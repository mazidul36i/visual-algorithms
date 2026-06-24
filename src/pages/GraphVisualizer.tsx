import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkPlus,
  Check,
  Crosshair,
  Pause,
  Play,
  Plus,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ExpressionError } from '@/lib/expression';
import {
  CURVE_COLORS,
  CompiledCurve,
  CurveDef,
  CurveType,
  PRESETS,
  SamplePoint,
  compileCurve,
  resolveEquation,
  sampleCurve,
} from '@/lib/curves';

const GRID_COLOR_MINOR = 'hsla(50, 12%, 92%, 0.04)';
const GRID_COLOR_MAJOR = 'hsla(50, 12%, 92%, 0.09)';
const AXIS_COLOR = 'hsla(50, 12%, 92%, 0.28)';
const LABEL_COLOR = 'hsla(50, 8%, 65%, 0.65)';

const TYPE_GROUPS: { type: CurveType; label: string }[] = [
  { type: 'cartesian', label: '// cartesian' },
  { type: 'parametric', label: '// parametric' },
  { type: 'polar', label: '// polar' },
  { type: 'implicit', label: '// implicit' },
];

type CustomModeId = 'equation' | 'parametric' | 'polar';

const CUSTOM_MODES: { id: CustomModeId; label: string; placeholders: string[] }[] = [
  { id: 'equation', label: 'equation', placeholders: ['x^2 + y^2 = 4'] },
  { id: 'parametric', label: 'x(t), y(t)', placeholders: ['sin(3t)', 'sin(4t)'] },
  { id: 'polar', label: 'r(θ)', placeholders: ['cos(4 * theta)'] },
];

const CUSTOM_PALETTE = [
  CURVE_COLORS.cyan,
  CURVE_COLORS.amber,
  CURVE_COLORS.magenta,
  CURVE_COLORS.emerald,
];

const formatTick = (v: number) => Number(v.toPrecision(10)).toString();

interface PlottedCurve {
  key: string;
  def: CurveDef;
  fns: CompiledCurve;
}

interface CurveRuntime {
  samples: SamplePoint[];
  progress: number;
}

interface SavedFormula {
  name: string;
  type: CurveType;
  exprs: string[];
  label: string;
}

const SAVED_STORAGE_KEY = 'curve-tracer-saved-formulas';

const loadSavedFormulas = (): SavedFormula[] => {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistSavedFormulas = (list: SavedFormula[]) => {
  try {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage full or unavailable — saving is best-effort
  }
};

const INITIAL_PRESET = PRESETS.find((p) => p.id === 'sine') ?? PRESETS[0];

const GraphVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const coordReadoutRef = useRef<HTMLSpanElement>(null);

  const [plotted, setPlotted] = useState<PlottedCurve[]>(() => [
    { key: INITIAL_PRESET.id, def: INITIAL_PRESET, fns: compileCurve(INITIAL_PRESET) },
  ]);
  const [customMode, setCustomMode] = useState<CustomModeId>('equation');
  const [customExprs, setCustomExprs] = useState<string[]>(['', '']);
  const [parseError, setParseError] = useState<{
    message: string;
    position: number;
    exprIndex: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [saved, setSaved] = useState<SavedFormula[]>(loadSavedFormulas);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');

  const viewportRef = useRef({ ...INITIAL_PRESET.view });
  const plottedRef = useRef<PlottedCurve[]>([]);
  const runtimeRef = useRef<Map<string, CurveRuntime>>(new Map());
  const samplesDirtyRef = useRef(true);
  const rafRef = useRef<number>();
  const sizeRef = useRef({ w: 0, h: 0 });
  const isPlayingRef = useRef(true);
  const speedRef = useRef(1);
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const customCountRef = useRef(0);
  const reducedMotionRef = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Keep refs/runtime in sync with the plotted list
  useEffect(() => {
    plottedRef.current = plotted;
    const runtime = runtimeRef.current;
    const keys = new Set(plotted.map((c) => c.key));
    for (const key of [...runtime.keys()]) {
      if (!keys.has(key)) runtime.delete(key);
    }
    for (const curve of plotted) {
      if (!runtime.has(curve.key)) {
        runtime.set(curve.key, {
          samples: [],
          progress: reducedMotionRef.current ? 1 : 0,
        });
      }
    }
    samplesDirtyRef.current = true;
  }, [plotted]);

  // Canvas: sizing, render loop, wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      sizeRef.current = { w: width, h: height };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      samplesDirtyRef.current = true;
    });
    resizeObserver.observe(wrapper);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { w, h } = sizeRef.current;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const vp = viewportRef.current;
      const wx = (mx - w / 2) / vp.scale + vp.centerX;
      const wy = (h / 2 - my) / vp.scale + vp.centerY;
      const factor = Math.pow(1.0015, -e.deltaY);
      vp.scale = Math.max(2, Math.min(5000, vp.scale * factor));
      vp.centerX = wx - (mx - w / 2) / vp.scale;
      vp.centerY = wy - (h / 2 - my) / vp.scale;
      samplesDirtyRef.current = true;
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });

    let lastTime = performance.now();

    const frame = (time: number) => {
      rafRef.current = requestAnimationFrame(frame);
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const vp = viewportRef.current;
      const xMin = vp.centerX - w / (2 * vp.scale);
      const xMax = vp.centerX + w / (2 * vp.scale);
      const visibleHeight = h / vp.scale;
      const curves = plottedRef.current;
      const runtime = runtimeRef.current;

      if (samplesDirtyRef.current) {
        for (const curve of curves) {
          const rt = runtime.get(curve.key);
          if (!rt) continue;
          rt.samples = sampleCurve(curve.def, curve.fns, {
            xMin,
            xMax,
            yMin: vp.centerY - visibleHeight / 2,
            yMax: vp.centerY + visibleHeight / 2,
            visibleHeight,
            count: Math.round(w * 2),
          });
        }
        samplesDirtyRef.current = false;
      }

      if (isPlayingRef.current && curves.length > 0) {
        let allDone = true;
        for (const curve of curves) {
          const rt = runtime.get(curve.key);
          if (!rt) continue;
          if (rt.progress < 1) {
            rt.progress = Math.min(
              1,
              rt.progress + (dt * speedRef.current) / curve.def.duration
            );
          }
          if (rt.progress < 1) allDone = false;
        }
        if (allDone) {
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      }

      const toSX = (wx: number) => (wx - vp.centerX) * vp.scale + w / 2;
      const toSY = (wy: number) => h / 2 - (wy - vp.centerY) * vp.scale;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // --- grid (1-2-5 ladder, major spacing >= 64px) ---
      let step = Math.pow(10, Math.floor(Math.log10(64 / vp.scale)));
      while (step * vp.scale < 64) {
        const mantissa = step / Math.pow(10, Math.floor(Math.log10(step) + 1e-9));
        step *= mantissa < 1.5 ? 2 : mantissa < 3 ? 2.5 : 2;
      }
      const yMin = vp.centerY - visibleHeight / 2;
      const yMax = vp.centerY + visibleHeight / 2;

      const drawGridLines = (spacing: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = Math.ceil(xMin / spacing) * spacing; gx <= xMax; gx += spacing) {
          const sx = Math.round(toSX(gx)) + 0.5;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, h);
        }
        for (let gy = Math.ceil(yMin / spacing) * spacing; gy <= yMax; gy += spacing) {
          const sy = Math.round(toSY(gy)) + 0.5;
          ctx.moveTo(0, sy);
          ctx.lineTo(w, sy);
        }
        ctx.stroke();
      };

      if ((step / 5) * vp.scale >= 14) drawGridLines(step / 5, GRID_COLOR_MINOR);
      drawGridLines(step, GRID_COLOR_MAJOR);

      // --- axes ---
      const axisSX = toSX(0);
      const axisSY = toSY(0);
      ctx.strokeStyle = AXIS_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (axisSX >= 0 && axisSX <= w) {
        ctx.moveTo(Math.round(axisSX) + 0.5, 0);
        ctx.lineTo(Math.round(axisSX) + 0.5, h);
      }
      if (axisSY >= 0 && axisSY <= h) {
        ctx.moveTo(0, Math.round(axisSY) + 0.5);
        ctx.lineTo(w, Math.round(axisSY) + 0.5);
      }
      ctx.stroke();

      // --- axis labels (mono, clamped to edges) ---
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = LABEL_COLOR;
      const labelY = Math.max(14, Math.min(h - 6, axisSY + 14));
      const labelX = Math.max(6, Math.min(w - 44, axisSX + 6));
      for (let gx = Math.ceil(xMin / step) * step; gx <= xMax; gx += step) {
        if (Math.abs(gx) < step / 2) continue;
        ctx.fillText(formatTick(gx), toSX(gx) + 4, labelY);
      }
      for (let gy = Math.ceil(yMin / step) * step; gy <= yMax; gy += step) {
        if (Math.abs(gy) < step / 2) continue;
        ctx.fillText(formatTick(gy), labelX, toSY(gy) - 4);
      }

      // --- curves ---
      let lastPen: { x: number; y: number } | null = null;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (const curve of curves) {
        const rt = runtime.get(curve.key);
        if (!rt || rt.samples.length < 2) continue;
        const samples = rt.samples;
        const upTo = Math.floor(rt.progress * (samples.length - 1));

        const strokePath = (from: number, to: number) => {
          ctx.beginPath();
          let started = false;
          for (let i = from; i <= to; i++) {
            const p = samples[i];
            const sx = toSX(p.x);
            const sy = toSY(p.y);
            if (!started || p.brk) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          }
          ctx.stroke();
        };

        // faint ghost of the not-yet-traced remainder
        if (upTo < samples.length - 1) {
          ctx.strokeStyle = curve.def.color;
          ctx.globalAlpha = 0.08;
          ctx.lineWidth = 1.5;
          strokePath(upTo, samples.length - 1);
          ctx.globalAlpha = 1;
        }

        // traced portion
        ctx.strokeStyle = curve.def.color;
        ctx.lineWidth = 2;
        strokePath(0, upTo);

        // pen at the tip
        const pen = samples[upTo];
        if (pen) {
          const px = toSX(pen.x);
          const py = toSY(pen.y);
          ctx.shadowColor = curve.def.color;
          ctx.shadowBlur = 14;
          ctx.fillStyle = curve.def.color;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(px, py, 9, 0, Math.PI * 2);
          ctx.strokeStyle = curve.def.color;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
          lastPen = pen;
        }
      }

      if (coordReadoutRef.current) {
        coordReadoutRef.current.textContent = lastPen
          ? `x: ${lastPen.x.toFixed(3)}   y: ${lastPen.y.toFixed(3)}`
          : '';
      }
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('wheel', onWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // --- pan handlers ---
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    const vp = viewportRef.current;
    vp.centerX -= dx / vp.scale;
    vp.centerY += dy / vp.scale;
    samplesDirtyRef.current = true;
  };
  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  const zoomBy = (factor: number) => {
    const vp = viewportRef.current;
    vp.scale = Math.max(2, Math.min(5000, vp.scale * factor));
    samplesDirtyRef.current = true;
  };

  const resetView = () => {
    const first = plottedRef.current[0];
    if (first) {
      viewportRef.current = { ...first.def.view };
      samplesDirtyRef.current = true;
    }
  };

  const replay = () => {
    for (const rt of runtimeRef.current.values()) {
      rt.progress = 0;
    }
    setIsPlaying(true);
  };

  const togglePreset = (preset: CurveDef) => {
    const exists = plotted.some((c) => c.key === preset.id);
    if (exists) {
      setPlotted(plotted.filter((c) => c.key !== preset.id));
      return;
    }
    if (plotted.length === 0) {
      viewportRef.current = { ...preset.view };
    }
    setPlotted([...plotted, { key: preset.id, def: preset, fns: compileCurve(preset) }]);
    if (!reducedMotionRef.current) setIsPlaying(true);
  };

  const removeCurve = (key: string) => {
    setPlotted(plotted.filter((c) => c.key !== key));
  };

  const clearAll = () => {
    setPlotted([]);
  };

  const activeMode = CUSTOM_MODES.find((m) => m.id === customMode)!;

  const makeCustomDef = (type: CurveType, exprs: string[], label: string): CurveDef => {
    const n = customCountRef.current++;
    return {
      id: `custom-${n}`,
      label,
      type,
      exprs,
      domain: type === 'parametric' || type === 'polar' ? [0, Math.PI * 2] : [-10, 10],
      color: CUSTOM_PALETTE[n % CUSTOM_PALETTE.length],
      view: { ...viewportRef.current },
      duration: type === 'cartesian' ? 6 : type === 'implicit' ? 7 : 8,
      annotation: `// plotting ${label}`,
    };
  };

  const startSaving = (curve: PlottedCurve) => {
    setSavingKey(curve.key);
    setSaveName(curve.def.label);
  };

  const confirmSave = () => {
    const curve = plotted.find((c) => c.key === savingKey);
    const name = saveName.trim();
    if (!curve || name === '') return;
    const entry: SavedFormula = {
      name,
      type: curve.def.type,
      exprs: curve.def.exprs,
      label: curve.def.label,
    };
    const next = [...saved.filter((s) => s.name !== name), entry];
    setSaved(next);
    persistSavedFormulas(next);
    setSavingKey(null);
  };

  const deleteSaved = (name: string) => {
    const next = saved.filter((s) => s.name !== name);
    setSaved(next);
    persistSavedFormulas(next);
  };

  const plotSaved = (formula: SavedFormula) => {
    let fns: CompiledCurve;
    try {
      fns = compileCurve(formula);
    } catch {
      // stored formula no longer compiles (e.g. hand-edited storage) — drop it
      deleteSaved(formula.name);
      return;
    }
    const def = makeCustomDef(formula.type, formula.exprs, formula.label);
    setPlotted([...plotted, { key: def.id, def, fns }]);
    if (!reducedMotionRef.current) setIsPlaying(true);
  };

  const addCustomCurve = () => {
    const rawInputs = customExprs.slice(0, activeMode.placeholders.length);

    const emptyIndex = rawInputs.findIndex((e) => e.trim() === '');
    if (emptyIndex !== -1) {
      setParseError({ message: 'enter an expression', position: 0, exprIndex: emptyIndex });
      return;
    }

    let type: CurveType;
    let exprs: string[];
    let label: string;
    try {
      if (customMode === 'equation') {
        // full equation: "y = sin(x)", "x^2 + y^2 = 4", "x + y = 1", or bare "sin(x)"
        const resolved = resolveEquation(rawInputs[0]);
        type = resolved.type;
        exprs = resolved.exprs;
        label = resolved.label;
      } else {
        type = customMode;
        exprs = rawInputs.map((e) => e.trim());
        compileCurve({ type, exprs });
        label = type === 'parametric' ? `(${exprs[0]}, ${exprs[1]})` : `r = ${exprs[0]}`;
      }
    } catch (err) {
      if (err instanceof ExpressionError) {
        let exprIndex = 0;
        if (customMode !== 'equation') {
          for (let i = 0; i < rawInputs.length; i++) {
            try {
              compileCurve({ type: customMode, exprs: [rawInputs[i].trim()] });
            } catch {
              exprIndex = i;
              break;
            }
          }
        }
        setParseError({ message: err.message, position: err.position, exprIndex });
      }
      return;
    }

    const def = makeCustomDef(type, exprs, label);
    const fns = compileCurve(def);

    setParseError(null);
    setCustomExprs(['', '']);
    setPlotted([...plotted, { key: def.id, def, fns }]);
    if (!reducedMotionRef.current) setIsPlaying(true);
  };

  return (
    <div className="h-screen bg-background dark flex flex-col overflow-hidden">
      {/* Header */}
      <header className="relative z-10 glass-strong border-b border-border shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Gallery</span>
            </Link>
            <h1 className="font-display font-bold text-xl text-foreground">
              Curve Tracer
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Sidebar */}
        <aside className="lg:w-80 shrink-0 glass border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Plotted curves */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="font-mono text-[11px] text-muted-foreground tracking-widest">
                  // plotted ({plotted.length})
                </p>
                {plotted.length > 1 && (
                  <button
                    onClick={clearAll}
                    className="font-mono text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    clear all
                  </button>
                )}
              </div>
              {plotted.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground/60 px-1 py-1.5">
                  nothing plotted — pick a preset or add a formula
                </p>
              ) : (
                <div className="space-y-1">
                  {plotted.map((curve) =>
                    savingKey === curve.key ? (
                      <div
                        key={curve.key}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30"
                      >
                        <Input
                          value={saveName}
                          onChange={(e) => setSaveName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmSave();
                            if (e.key === 'Escape') setSavingKey(null);
                          }}
                          placeholder="name this formula"
                          className="h-7 font-mono text-xs"
                          autoFocus
                          spellCheck={false}
                        />
                        <button
                          onClick={confirmSave}
                          className="text-primary hover:text-primary/80 transition-colors shrink-0 p-1"
                          title="Save formula"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSavingKey(null)}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        key={curve.key}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-muted/30 group"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: curve.def.color }}
                        />
                        <span className="font-mono text-xs text-foreground/90 truncate flex-1">
                          {curve.def.label}
                        </span>
                        {curve.key.startsWith('custom-') && (
                          <button
                            onClick={() => startSaving(curve)}
                            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                            title="Save formula with a name"
                          >
                            <BookmarkPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => removeCurve(curve.key)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          title="Remove curve"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Saved formulas */}
            {saved.length > 0 && (
              <div>
                <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-2">
                  // saved ({saved.length})
                </p>
                <div className="space-y-1">
                  {saved.map((formula) => (
                    <div
                      key={formula.name}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-muted/40 transition-colors group"
                    >
                      <button
                        onClick={() => plotSaved(formula)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                        title={`Plot ${formula.label}`}
                      >
                        <Bookmark className="w-3 h-3 text-primary shrink-0" />
                        <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground truncate transition-colors">
                          {formula.name}
                        </span>
                      </button>
                      <button
                        onClick={() => deleteSaved(formula.name)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        title="Delete saved formula"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {TYPE_GROUPS.map((group) => (
              <div key={group.type}>
                <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-2">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {PRESETS.filter((p) => p.type === group.type).map((preset) => {
                    const active = plotted.some((c) => c.key === preset.id);
                    return (
                      <button
                        key={preset.id}
                        onClick={() => togglePreset(preset)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-md border text-left font-mono text-sm transition-all',
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="flex-1">{preset.label}</span>
                        {active && <X className="w-3.5 h-3.5 opacity-60" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Custom expression */}
            <div className="pt-4 border-t border-border">
              <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-3">
                // custom
              </p>
              <div className="flex gap-1.5 mb-3">
                {CUSTOM_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setCustomMode(mode.id);
                      setParseError(null);
                    }}
                    className={cn(
                      'px-2.5 py-1.5 rounded-md border font-mono text-xs transition-all',
                      customMode === mode.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {activeMode.placeholders.map((placeholder, i) => (
                  <Input
                    key={`${customMode}-${i}`}
                    value={customExprs[i] ?? ''}
                    onChange={(e) => {
                      const next = [...customExprs];
                      next[i] = e.target.value;
                      setCustomExprs(next);
                      setParseError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addCustomCurve();
                    }}
                    placeholder={placeholder}
                    className="font-mono text-sm"
                    spellCheck={false}
                    autoComplete="off"
                  />
                ))}
              </div>

              <Button
                onClick={addCustomCurve}
                variant="outline"
                size="sm"
                className="w-full mt-3 font-mono text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                add to plot
              </Button>

              {parseError && (
                <div className="mt-3">
                  <pre className="font-mono text-xs text-destructive leading-5 whitespace-pre-wrap break-all">
                    {customExprs[parseError.exprIndex] ?? ''}
                    {'\n'}
                    {' '.repeat(Math.max(0, parseError.position))}^
                  </pre>
                  <p className="font-mono text-xs text-destructive mt-1">
                    {parseError.message}
                  </p>
                </div>
              )}

              <p className="font-mono text-[10px] text-muted-foreground/70 leading-5 mt-4">
                equation takes the whole formula:
                <br />
                y = sin(x) · x^2 + y^2 = 4 · x + y = 1
                <br />
                fn: sin cos tan sqrt abs log exp floor
                <br />
                const: pi e · ops: + - * / ^
                <br />
                implicit mul works: 2x, x sin(x)
              </p>
            </div>
          </div>
        </aside>

        {/* Canvas area */}
        <div ref={wrapperRef} className="relative flex-1 min-h-[55vh] lg:min-h-0">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="Animated graph of the plotted curves"
          />

          {/* Annotation overlay */}
          <div className="absolute top-4 left-5 pointer-events-none space-y-1">
            {plotted.slice(0, 6).map((curve) => (
              <p
                key={curve.key}
                className="font-mono text-xs text-muted-foreground flex items-center gap-2"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: curve.def.color }}
                />
                {curve.def.annotation}
              </p>
            ))}
            {plotted.length > 6 && (
              <p className="font-mono text-xs text-muted-foreground/60">
                … +{plotted.length - 6} more
              </p>
            )}
            <span ref={coordReadoutRef} className="font-mono text-xs text-accent block" />
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-2rem)] sm:w-auto">
            <div className="glass-strong rounded-2xl px-5 py-4 flex flex-wrap items-center justify-center gap-5">
              <div className="flex items-center gap-3 min-w-44">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Speed
                </span>
                <Slider
                  value={[speed]}
                  onValueChange={(v) => setSpeed(v[0])}
                  min={0.25}
                  max={4}
                  step={0.25}
                  className="flex-1"
                />
                <span className="font-mono text-xs text-muted-foreground w-10">
                  {speed}×
                </span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={replay} title="Replay">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => zoomBy(1.5)}
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => zoomBy(1 / 1.5)}
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetView}
                  title="Reset view"
                >
                  <Crosshair className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GraphVisualizer;
