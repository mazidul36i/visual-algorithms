import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Crosshair,
  Orbit,
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
  COLORS_3D,
  Compiled3D,
  Curve3DDef,
  Curve3DType,
  Geometry3D,
  HSLColor,
  PRESETS_3D,
  compileCurve3D,
  buildGeometry3D,
  resolveSurfaceEquation,
} from '@/lib/curves3d';

const AXIS_COLOR = 'hsla(50, 12%, 92%, 0.3)';
const FLOOR_COLOR = 'hsla(50, 12%, 92%, 0.06)';
const LABEL_COLOR = 'hsla(50, 8%, 65%, 0.7)';

const GROUPS_3D: { type: Curve3DType; label: string }[] = [
  { type: 'surface', label: '// surfaces' },
  { type: 'curve3d', label: '// space curves' },
];

type CustomModeId3D = 'surface' | 'curve3d';

const CUSTOM_MODES_3D: { id: CustomModeId3D; label: string; placeholders: string[] }[] = [
  { id: 'surface', label: 'z = f(x, y)', placeholders: ['sin(x) * cos(y)'] },
  {
    id: 'curve3d',
    label: 'x(t), y(t), z(t)',
    placeholders: ['4 * cos(t)', '4 * sin(t)', 't / 2'],
  },
];

const CUSTOM_PALETTE_3D: HSLColor[] = [
  COLORS_3D.cyan,
  COLORS_3D.amber,
  COLORS_3D.magenta,
  COLORS_3D.emerald,
];

const LIGHT_DIR = (() => {
  const v = [0.4, 0.25, 0.88];
  const len = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
})();

const DEFAULT_CAMERA = { yaw: 0.85, pitch: 0.5, dist: 26, tx: 0, ty: 0, tz: 0 };

const hslStr = (c: HSLColor, l = c.l, a = 1) =>
  a >= 1 ? `hsl(${c.h}, ${c.s}%, ${l}%)` : `hsla(${c.h}, ${c.s}%, ${l}%, ${a})`;

interface Plotted3D {
  key: string;
  def: Curve3DDef;
  fns: Compiled3D;
}

interface Runtime3D {
  geometry: Geometry3D;
  progress: number;
  /** projected vertex cache for surfaces: (n+1)^2 * 3 of [sx, sy, viewZ] */
  projected?: Float64Array;
}

type Primitive =
  | {
      kind: 'quad';
      depth: number;
      pts: number[]; // sx0,sy0 .. sx3,sy3
      fill: string;
      stroke: string;
    }
  | {
      kind: 'seg';
      depth: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
    };

const INITIAL_3D = PRESETS_3D.find((p) => p.id === 'ripple') ?? PRESETS_3D[0];

const Graph3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const coordReadoutRef = useRef<HTMLSpanElement>(null);

  const [plotted, setPlotted] = useState<Plotted3D[]>(() => [
    { key: INITIAL_3D.id, def: INITIAL_3D, fns: compileCurve3D(INITIAL_3D) },
  ]);
  const [customMode, setCustomMode] = useState<CustomModeId3D>('surface');
  const [customExprs, setCustomExprs] = useState<string[]>(['', '', '']);
  const [parseError, setParseError] = useState<{
    message: string;
    position: number;
    exprIndex: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [spinOn, setSpinOn] = useState(
    () =>
      typeof window === 'undefined' ||
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const camRef = useRef({ ...DEFAULT_CAMERA });
  const plottedRef = useRef<Plotted3D[]>([]);
  const runtimeRef = useRef<Map<string, Runtime3D>>(new Map());
  const rafRef = useRef<number>();
  const sizeRef = useRef({ w: 0, h: 0 });
  const isPlayingRef = useRef(true);
  const speedRef = useRef(1);
  const spinRef = useRef(spinOn);
  const dragRef = useRef({ active: false, pan: false, lastX: 0, lastY: 0 });
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

  useEffect(() => {
    spinRef.current = spinOn;
  }, [spinOn]);

  // Keep refs/runtime in sync with the plotted list (geometry built once per item)
  useEffect(() => {
    plottedRef.current = plotted;
    const runtime = runtimeRef.current;
    const keys = new Set(plotted.map((c) => c.key));
    for (const key of [...runtime.keys()]) {
      if (!keys.has(key)) runtime.delete(key);
    }
    for (const item of plotted) {
      if (!runtime.has(item.key)) {
        runtime.set(item.key, {
          geometry: buildGeometry3D(item.def, item.fns),
          progress: reducedMotionRef.current ? 1 : 0,
        });
      }
    }
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
    });
    resizeObserver.observe(wrapper);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = camRef.current;
      cam.dist = Math.max(6, Math.min(120, cam.dist * Math.pow(1.0015, e.deltaY)));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });

    let lastTime = performance.now();

    const frame = (time: number) => {
      rafRef.current = requestAnimationFrame(frame);
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const cam = camRef.current;
      if (spinRef.current && !dragRef.current.active) {
        cam.yaw += dt * 0.12;
      }

      const items = plottedRef.current;
      const runtime = runtimeRef.current;

      if (isPlayingRef.current && items.length > 0) {
        let allDone = true;
        for (const item of items) {
          const rt = runtime.get(item.key);
          if (!rt) continue;
          if (rt.progress < 1) {
            rt.progress = Math.min(
              1,
              rt.progress + (dt * speedRef.current) / item.def.duration
            );
          }
          if (rt.progress < 1) allDone = false;
        }
        if (allDone) {
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      }

      // --- camera basis (orbit around target, z-up) ---
      const cp = Math.cos(cam.pitch);
      const sp = Math.sin(cam.pitch);
      const cy = Math.cos(cam.yaw);
      const sy = Math.sin(cam.yaw);
      const ex = cam.tx + cam.dist * cp * cy;
      const ey = cam.ty + cam.dist * cp * sy;
      const ez = cam.tz + cam.dist * sp;
      // forward = normalize(target - eye)
      const fx = -cp * cy;
      const fy = -cp * sy;
      const fz = -sp;
      // right = normalize(forward x up(0,0,1))
      let rx = fy * 1 - fz * 0;
      let ry = fz * 0 - fx * 1;
      let rz = fx * 0 - fy * 0;
      const rlen = Math.hypot(rx, ry, rz) || 1;
      rx /= rlen;
      ry /= rlen;
      rz /= rlen;
      // upv = right x forward
      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;

      const persp = 1.1 * Math.min(w, h);
      const cx = w / 2;
      const cyc = h / 2;

      // returns [sx, sy, viewZ]; viewZ <= 0.2 means behind/too close
      const project = (px: number, py: number, pz: number): [number, number, number] => {
        const dx = px - ex;
        const dy = py - ey;
        const dz = pz - ez;
        const vz = dx * fx + dy * fy + dz * fz;
        if (vz < 0.2) return [0, 0, vz];
        const vx = dx * rx + dy * ry + dz * rz;
        const vy = dx * ux + dy * uy + dz * uz;
        return [cx + (vx / vz) * persp, cyc - (vy / vz) * persp, vz];
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // --- floor grid at z = -8 ---
      ctx.strokeStyle = FLOOR_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = -8; k <= 8; k += 2) {
        const a = project(k, -8, -8);
        const b = project(k, 8, -8);
        if (a[2] > 0.2 && b[2] > 0.2) {
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
        const c = project(-8, k, -8);
        const d = project(8, k, -8);
        if (c[2] > 0.2 && d[2] > 0.2) {
          ctx.moveTo(c[0], c[1]);
          ctx.lineTo(d[0], d[1]);
        }
      }
      ctx.stroke();

      // --- axes ---
      ctx.strokeStyle = AXIS_COLOR;
      ctx.beginPath();
      const origin = project(0, 0, 0);
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = LABEL_COLOR;
      const axes: [number, number, number, string][] = [
        [9, 0, 0, 'x'],
        [0, 9, 0, 'y'],
        [0, 0, 9, 'z'],
      ];
      for (const [ax, ay, az, name] of axes) {
        const tip = project(ax, ay, az);
        if (origin[2] > 0.2 && tip[2] > 0.2) {
          ctx.moveTo(origin[0], origin[1]);
          ctx.lineTo(tip[0], tip[1]);
          ctx.fillText(name, tip[0] + 4, tip[1] - 4);
        }
      }
      ctx.stroke();

      // --- build depth-sorted primitives across all plotted items ---
      const prims: Primitive[] = [];
      let lastPen: { x: number; y: number; z: number; sx: number; sy: number } | null =
        null;

      for (const item of items) {
        const rt = runtime.get(item.key);
        if (!rt) continue;
        const color = item.def.color;

        if (rt.geometry.kind === 'surface') {
          const { n, verts } = rt.geometry;
          const vCount = (n + 1) * (n + 1);
          if (!rt.projected || rt.projected.length !== vCount * 3) {
            rt.projected = new Float64Array(vCount * 3);
          }
          const proj = rt.projected;
          for (let v = 0; v < vCount; v++) {
            const wz = verts[v * 3 + 2];
            if (isNaN(wz)) {
              proj[v * 3 + 2] = -1;
              continue;
            }
            const p = project(verts[v * 3], verts[v * 3 + 1], wz);
            proj[v * 3] = p[0];
            proj[v * 3 + 1] = p[1];
            proj[v * 3 + 2] = p[2];
          }

          const rowsRevealed = Math.floor(rt.progress * n);
          for (let j = 0; j < rowsRevealed; j++) {
            for (let i = 0; i < n; i++) {
              const a = j * (n + 1) + i;
              const b = a + 1;
              const c = a + (n + 1) + 1;
              const d = a + (n + 1);
              const za = proj[a * 3 + 2];
              const zb = proj[b * 3 + 2];
              const zc = proj[c * 3 + 2];
              const zd = proj[d * 3 + 2];
              if (za <= 0.2 || zb <= 0.2 || zc <= 0.2 || zd <= 0.2) continue;

              // world-space normal from the quad diagonals for lambert shading
              const acx = verts[c * 3] - verts[a * 3];
              const acy = verts[c * 3 + 1] - verts[a * 3 + 1];
              const acz = verts[c * 3 + 2] - verts[a * 3 + 2];
              const dbx = verts[b * 3] - verts[d * 3];
              const dby = verts[b * 3 + 1] - verts[d * 3 + 1];
              const dbz = verts[b * 3 + 2] - verts[d * 3 + 2];
              let nx = acy * dbz - acz * dby;
              let ny = acz * dbx - acx * dbz;
              let nz = acx * dby - acy * dbx;
              const nlen = Math.hypot(nx, ny, nz) || 1;
              nx /= nlen;
              ny /= nlen;
              nz /= nlen;
              const lambert = Math.abs(
                nx * LIGHT_DIR[0] + ny * LIGHT_DIR[1] + nz * LIGHT_DIR[2]
              );
              const lightness = Math.min(
                72,
                color.l * (0.35 + 0.75 * lambert)
              );

              prims.push({
                kind: 'quad',
                depth: (za + zb + zc + zd) / 4,
                pts: [
                  proj[a * 3], proj[a * 3 + 1],
                  proj[b * 3], proj[b * 3 + 1],
                  proj[c * 3], proj[c * 3 + 1],
                  proj[d * 3], proj[d * 3 + 1],
                ],
                fill: hslStr(color, lightness, 0.92),
                stroke: hslStr(color, Math.min(80, color.l + 18), 0.16),
              });
            }
          }
        } else {
          const points = rt.geometry.points;
          if (points.length < 2) continue;
          const upTo = Math.floor(rt.progress * (points.length - 1));
          let prev: [number, number, number] | null = null;
          let prevPoint = points[0];
          for (let i = 0; i <= upTo; i++) {
            const pt = points[i];
            const p = project(pt.x, pt.y, pt.z);
            if (p[2] <= 0.2) {
              prev = null;
              prevPoint = pt;
              continue;
            }
            if (prev && !pt.brk) {
              prims.push({
                kind: 'seg',
                depth: (prev[2] + p[2]) / 2,
                x1: prev[0],
                y1: prev[1],
                x2: p[0],
                y2: p[1],
                color: hslStr(color),
              });
            }
            if (i === upTo) {
              lastPen = { x: pt.x, y: pt.y, z: pt.z, sx: p[0], sy: p[1] };
            }
            prev = p;
            prevPoint = pt;
          }
          void prevPoint;
        }
      }

      // painter's algorithm: far first
      prims.sort((a, b) => b.depth - a.depth);

      for (const prim of prims) {
        if (prim.kind === 'quad') {
          ctx.beginPath();
          ctx.moveTo(prim.pts[0], prim.pts[1]);
          ctx.lineTo(prim.pts[2], prim.pts[3]);
          ctx.lineTo(prim.pts[4], prim.pts[5]);
          ctx.lineTo(prim.pts[6], prim.pts[7]);
          ctx.closePath();
          ctx.fillStyle = prim.fill;
          ctx.fill();
          ctx.strokeStyle = prim.stroke;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(prim.x1, prim.y1);
          ctx.lineTo(prim.x2, prim.y2);
          ctx.strokeStyle = prim.color;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // pen on the last space curve
      if (lastPen) {
        ctx.shadowColor = 'hsla(38, 95%, 56%, 0.9)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'hsl(38, 95%, 56%)';
        ctx.beginPath();
        ctx.arc(lastPen.sx, lastPen.sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (coordReadoutRef.current) {
        coordReadoutRef.current.textContent = lastPen
          ? `x: ${lastPen.x.toFixed(2)}   y: ${lastPen.y.toFixed(2)}   z: ${lastPen.z.toFixed(2)}`
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

  // --- orbit / pan handlers ---
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      pan: e.shiftKey,
      lastX: e.clientX,
      lastY: e.clientY,
    };
    if (spinRef.current) setSpinOn(false);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    const cam = camRef.current;
    if (dragRef.current.pan) {
      // pan the orbit target in the view plane
      const { w, h } = sizeRef.current;
      const persp = 1.1 * Math.min(w, h) || 1;
      const cp = Math.cos(cam.pitch);
      const sy2 = Math.sin(cam.yaw);
      const cy2 = Math.cos(cam.yaw);
      // right = (sy2 * ... ) — derived the same way as in the render loop
      const fx = -cp * cy2;
      const fy = -cp * sy2;
      const rxn = fy;
      const ryn = -fx;
      const rlen = Math.hypot(rxn, ryn) || 1;
      const k = (cam.dist / persp) * 1.0;
      cam.tx -= (dx * k * rxn) / rlen;
      cam.ty -= (dx * k * ryn) / rlen;
      cam.tz += dy * k * Math.cos(cam.pitch);
    } else {
      cam.yaw -= dx * 0.005;
      cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch + dy * 0.005));
    }
  };
  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  const zoomBy = (factor: number) => {
    const cam = camRef.current;
    cam.dist = Math.max(6, Math.min(120, cam.dist / factor));
  };

  const resetView = () => {
    camRef.current = { ...DEFAULT_CAMERA };
  };

  const replay = () => {
    for (const rt of runtimeRef.current.values()) {
      rt.progress = 0;
    }
    setIsPlaying(true);
  };

  const togglePreset = (preset: Curve3DDef) => {
    const exists = plotted.some((c) => c.key === preset.id);
    if (exists) {
      setPlotted(plotted.filter((c) => c.key !== preset.id));
      return;
    }
    setPlotted([...plotted, { key: preset.id, def: preset, fns: compileCurve3D(preset) }]);
    if (!reducedMotionRef.current) setIsPlaying(true);
  };

  const removeCurve = (key: string) => {
    setPlotted(plotted.filter((c) => c.key !== key));
  };

  const clearAll = () => {
    setPlotted([]);
  };

  const activeMode = CUSTOM_MODES_3D.find((m) => m.id === customMode)!;

  const addCustom = () => {
    const rawInputs = customExprs.slice(0, activeMode.placeholders.length);

    const emptyIndex = rawInputs.findIndex((e) => e.trim() === '');
    if (emptyIndex !== -1) {
      setParseError({ message: 'enter an expression', position: 0, exprIndex: emptyIndex });
      return;
    }

    let exprs: string[];
    let label: string;
    try {
      if (customMode === 'surface') {
        const expr = resolveSurfaceEquation(rawInputs[0]);
        exprs = [expr];
        label = `z = ${expr}`;
      } else {
        exprs = rawInputs.map((e) => e.trim());
        compileCurve3D({ type: 'curve3d', exprs });
        label = `(${exprs[0]}, ${exprs[1]}, ${exprs[2]})`;
      }
    } catch (err) {
      if (err instanceof ExpressionError) {
        let exprIndex = 0;
        if (customMode === 'curve3d') {
          for (let i = 0; i < rawInputs.length; i++) {
            try {
              compileCurve3D({ type: 'curve3d', exprs: [rawInputs[i].trim(), '0', '0'] });
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

    const n = customCountRef.current++;
    const def: Curve3DDef = {
      id: `custom3d-${n}`,
      label,
      type: customMode,
      exprs,
      domain: [0, Math.PI * 4],
      range: 6,
      color: CUSTOM_PALETTE_3D[n % CUSTOM_PALETTE_3D.length],
      duration: customMode === 'surface' ? 7 : 10,
      annotation: `// plotting ${label}`,
    };
    const fns = compileCurve3D(def);

    setParseError(null);
    setCustomExprs(['', '', '']);
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
            <div className="flex items-center gap-4">
              <Link
                to="/graphs"
                className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                2d →
              </Link>
              <h1 className="font-display font-bold text-xl text-foreground">
                Curve Tracer · 3D
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Sidebar */}
        <aside className="lg:w-80 shrink-0 glass border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Plotted */}
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
                  {plotted.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-muted/30"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: hslStr(item.def.color) }}
                      />
                      <span className="font-mono text-xs text-foreground/90 truncate flex-1">
                        {item.def.label}
                      </span>
                      <button
                        onClick={() => removeCurve(item.key)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {GROUPS_3D.map((group) => (
              <div key={group.type}>
                <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-2">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {PRESETS_3D.filter((p) => p.type === group.type).map((preset) => {
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
                          style={{ backgroundColor: hslStr(preset.color) }}
                        />
                        <span className="flex-1">{preset.label}</span>
                        {active && <X className="w-3.5 h-3.5 opacity-60" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Custom */}
            <div className="pt-4 border-t border-border">
              <p className="font-mono text-[11px] text-muted-foreground tracking-widest mb-3">
                // custom
              </p>
              <div className="flex gap-1.5 mb-3">
                {CUSTOM_MODES_3D.map((mode) => (
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
                      if (e.key === 'Enter') addCustom();
                    }}
                    placeholder={placeholder}
                    className="font-mono text-sm"
                    spellCheck={false}
                    autoComplete="off"
                  />
                ))}
              </div>

              <Button
                onClick={addCustom}
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
                surfaces: z = sin(x) * cos(y) or just sin(x) * cos(y)
                <br />
                space curves: x(t), y(t), z(t) · t ∈ [0, 4π]
                <br />
                fn: sin cos tan sqrt abs log exp · const: pi e
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
            aria-label="3D plot of the selected surfaces and space curves"
          />

          {/* Annotation overlay */}
          <div className="absolute top-4 left-5 pointer-events-none space-y-1">
            {plotted.slice(0, 6).map((item) => (
              <p
                key={item.key}
                className="font-mono text-xs text-muted-foreground flex items-center gap-2"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: hslStr(item.def.color) }}
                />
                {item.def.annotation}
              </p>
            ))}
            {plotted.length > 6 && (
              <p className="font-mono text-xs text-muted-foreground/60">
                … +{plotted.length - 6} more
              </p>
            )}
            <span ref={coordReadoutRef} className="font-mono text-xs text-accent block" />
          </div>

          {/* Navigation hint */}
          <div className="absolute top-4 right-5 pointer-events-none">
            <p className="font-mono text-[10px] text-muted-foreground/60">
              drag · orbit&ensp;/&ensp;wheel · zoom&ensp;/&ensp;shift+drag · pan
            </p>
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
                  variant={spinOn ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setSpinOn(!spinOn)}
                  title={spinOn ? 'Stop auto-rotation' : 'Auto-rotate'}
                >
                  <Orbit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => zoomBy(1.3)}
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => zoomBy(1 / 1.3)}
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

export default Graph3D;
