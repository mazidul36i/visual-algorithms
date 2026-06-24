// Curve definitions, preset library, and sampling for the Graph Visualizer.

import { ExpressionError, compileExpression } from './expression';

export type CurveType = 'cartesian' | 'parametric' | 'polar' | 'implicit';

export interface CurveView {
  centerX: number;
  centerY: number;
  scale: number; // pixels per world unit (uniform x/y so circles stay round)
}

export interface CurveDef {
  id: string;
  label: string;
  type: CurveType;
  /**
   * [f(x)] for cartesian, [x(t), y(t)] for parametric, [r(theta)] for polar,
   * [lhs, rhs] of "lhs = rhs" for implicit
   */
  exprs: string[];
  /** x-range hint for cartesian (overridden by viewport), t/theta range otherwise */
  domain: [number, number];
  color: string;
  view: CurveView;
  /** seconds for a full trace at 1x speed */
  duration: number;
  annotation: string;
}

export interface SamplePoint {
  x: number;
  y: number;
  /** start a new subpath at this point (discontinuity before it) */
  brk: boolean;
}

export type CompiledCurve = ((vars: Record<string, number>) => number)[];

// Literal HSL values matching the theme tokens in index.css
// (canvas strokes can't reference CSS variables cheaply per-frame).
export const CURVE_COLORS = {
  emerald: 'hsl(158, 80%, 48%)', // --primary
  amber: 'hsl(38, 95%, 56%)', // --accent
  cyan: 'hsl(185, 95%, 55%)', // --chart-3
  magenta: 'hsl(340, 80%, 60%)', // --chart-5
};

export const VARS_FOR_TYPE: Record<CurveType, string[]> = {
  cartesian: ['x'],
  parametric: ['t'],
  polar: ['theta', 't'],
  implicit: ['x', 'y'],
};

const TWO_PI = Math.PI * 2;

export const PRESETS: CurveDef[] = [
  // — cartesian —
  {
    id: 'identity',
    label: 'y = x',
    type: 'cartesian',
    exprs: ['x'],
    domain: [-10, 10],
    color: CURVE_COLORS.emerald,
    view: { centerX: 0, centerY: 0, scale: 60 },
    duration: 4,
    annotation: '// plotting y = x',
  },
  {
    id: 'parabola',
    label: 'y = x²',
    type: 'cartesian',
    exprs: ['x^2'],
    domain: [-10, 10],
    color: CURVE_COLORS.emerald,
    view: { centerX: 0, centerY: 2.5, scale: 70 },
    duration: 5,
    annotation: '// plotting y = x^2',
  },
  {
    id: 'sine',
    label: 'y = sin(x)',
    type: 'cartesian',
    exprs: ['sin(x)'],
    domain: [-10, 10],
    color: CURVE_COLORS.cyan,
    view: { centerX: 0, centerY: 0, scale: 60 },
    duration: 6,
    annotation: '// plotting y = sin(x)',
  },
  {
    id: 'damped-sine',
    label: 'damped sine',
    type: 'cartesian',
    exprs: ['sin(3x) * exp(-0.2 * x^2)'],
    domain: [-10, 10],
    color: CURVE_COLORS.cyan,
    view: { centerX: 0, centerY: 0, scale: 90 },
    duration: 7,
    annotation: '// plotting y = sin(3x) · e^(-0.2x²)',
  },
  {
    id: 'reciprocal',
    label: 'y = 1/x',
    type: 'cartesian',
    exprs: ['1/x'],
    domain: [-10, 10],
    color: CURVE_COLORS.amber,
    view: { centerX: 0, centerY: 0, scale: 55 },
    duration: 6,
    annotation: '// plotting y = 1/x · mind the asymptote',
  },
  {
    id: 'tangent',
    label: 'y = tan(x)',
    type: 'cartesian',
    exprs: ['tan(x)'],
    domain: [-10, 10],
    color: CURVE_COLORS.amber,
    view: { centerX: 0, centerY: 0, scale: 55 },
    duration: 8,
    annotation: '// plotting y = tan(x) · asymptotes everywhere',
  },
  // — parametric —
  {
    id: 'circle',
    label: 'circle',
    type: 'parametric',
    exprs: ['cos(t)', 'sin(t)'],
    domain: [0, TWO_PI],
    color: CURVE_COLORS.emerald,
    view: { centerX: 0, centerY: 0, scale: 160 },
    duration: 4,
    annotation: '// plotting x = cos(t), y = sin(t)',
  },
  {
    id: 'lissajous',
    label: 'lissajous 3:4',
    type: 'parametric',
    exprs: ['sin(3t)', 'sin(4t)'],
    domain: [0, TWO_PI],
    color: CURVE_COLORS.cyan,
    view: { centerX: 0, centerY: 0, scale: 170 },
    duration: 10,
    annotation: '// plotting x = sin(3t), y = sin(4t)',
  },
  {
    id: 'butterfly',
    label: 'butterfly curve',
    type: 'parametric',
    exprs: [
      'sin(t) * (exp(cos(t)) - 2*cos(4t) - sin(t/12)^5)',
      'cos(t) * (exp(cos(t)) - 2*cos(4t) - sin(t/12)^5)',
    ],
    domain: [0, 12 * Math.PI],
    color: CURVE_COLORS.magenta,
    view: { centerX: 0, centerY: 0.4, scale: 95 },
    duration: 20,
    annotation: '// plotting fay’s butterfly · t ∈ [0, 12π]',
  },
  // — polar —
  {
    id: 'rose',
    label: 'rose · 8 petals',
    type: 'polar',
    exprs: ['cos(4 * theta)'],
    domain: [0, TWO_PI],
    color: CURVE_COLORS.magenta,
    view: { centerX: 0, centerY: 0, scale: 200 },
    duration: 9,
    annotation: '// plotting r = cos(4θ)',
  },
  {
    id: 'cardioid',
    label: 'cardioid',
    type: 'polar',
    exprs: ['1 - cos(theta)'],
    domain: [0, TWO_PI],
    color: CURVE_COLORS.amber,
    view: { centerX: -0.6, centerY: 0, scale: 130 },
    duration: 6,
    annotation: '// plotting r = 1 − cos(θ)',
  },
  {
    id: 'spiral',
    label: 'archimedean spiral',
    type: 'polar',
    exprs: ['0.15 * theta'],
    domain: [0, 10 * Math.PI],
    color: CURVE_COLORS.emerald,
    view: { centerX: 0, centerY: 0, scale: 50 },
    duration: 10,
    annotation: '// plotting r = 0.15θ · θ ∈ [0, 10π]',
  },
  // — implicit —
  {
    id: 'heart',
    label: 'heart curve',
    type: 'implicit',
    exprs: ['(x^2 + y^2 - 1)^3', 'x^2 * y^3'],
    domain: [0, 1],
    color: CURVE_COLORS.magenta,
    view: { centerX: 0, centerY: 0.1, scale: 170 },
    duration: 7,
    annotation: '// plotting (x² + y² − 1)³ = x²y³',
  },
  {
    id: 'hyperbola',
    label: 'xy = 1',
    type: 'implicit',
    exprs: ['x * y', '1'],
    domain: [0, 1],
    color: CURVE_COLORS.amber,
    view: { centerX: 0, centerY: 0, scale: 55 },
    duration: 6,
    annotation: '// plotting xy = 1',
  },
  {
    id: 'lemniscate',
    label: 'lemniscate',
    type: 'implicit',
    exprs: ['(x^2 + y^2)^2', '2 * (x^2 - y^2)'],
    domain: [0, 1],
    color: CURVE_COLORS.cyan,
    view: { centerX: 0, centerY: 0, scale: 160 },
    duration: 6,
    annotation: '// plotting (x² + y²)² = 2(x² − y²)',
  },
];

/** Compile a curve's expression strings (throws ExpressionError on bad input). */
export function compileCurve(curve: Pick<CurveDef, 'type' | 'exprs'>): CompiledCurve {
  const vars = VARS_FOR_TYPE[curve.type];
  return curve.exprs.map((src) => compileExpression(src, vars));
}

/**
 * Resolve a free-form equation typed as a whole — "y = sin(x)", "x^2 + y^2 = 4",
 * "x + y = 1", or just "sin(x)" — into a curve type + expressions.
 * "y = f(x)" (and bare x-only expressions) get the animated cartesian trace;
 * everything else becomes an implicit curve F(x,y) = G(x,y).
 * Throws ExpressionError with positions relative to the full input string.
 */
export function resolveEquation(input: string): {
  type: 'cartesian' | 'implicit';
  exprs: string[];
  label: string;
} {
  const firstEq = input.indexOf('=');

  if (firstEq === -1) {
    // no "=": treat as y = f(x) if it only uses x, otherwise as expr = 0
    try {
      compileExpression(input, ['x']);
      return { type: 'cartesian', exprs: [input.trim()], label: `y = ${input.trim()}` };
    } catch {
      compileExpression(input, ['x', 'y']); // rethrows with the real position if invalid
      return {
        type: 'implicit',
        exprs: [input.trim(), '0'],
        label: `${input.trim()} = 0`,
      };
    }
  }

  const secondEq = input.indexOf('=', firstEq + 1);
  if (secondEq !== -1) {
    throw new ExpressionError('only one "=" allowed', secondEq);
  }

  const lhsRaw = input.slice(0, firstEq);
  const rhsRaw = input.slice(firstEq + 1);
  if (lhsRaw.trim() === '') {
    throw new ExpressionError('left side of "=" is empty', 0);
  }
  if (rhsRaw.trim() === '') {
    throw new ExpressionError('right side of "=" is empty', input.length);
  }

  // fast path: "y = f(x)" keeps the animated left-to-right trace
  if (lhsRaw.trim() === 'y') {
    try {
      compileExpression(rhsRaw, ['x']);
      return { type: 'cartesian', exprs: [rhsRaw.trim()], label: input.trim() };
    } catch {
      // rhs references y (or is invalid) — fall through to implicit
    }
  }

  compileExpression(lhsRaw, ['x', 'y']); // lhs positions already match the input
  try {
    compileExpression(rhsRaw, ['x', 'y']);
  } catch (err) {
    if (err instanceof ExpressionError) {
      throw new ExpressionError(err.message, err.position + firstEq + 1);
    }
    throw err;
  }
  return {
    type: 'implicit',
    exprs: [lhsRaw.trim(), rhsRaw.trim()],
    label: input.trim(),
  };
}

interface SampleOptions {
  /** visible world x-range (cartesian/implicit sweep this instead of the preset domain) */
  xMin: number;
  xMax: number;
  /** visible world y-range (implicit marching-squares grid) */
  yMin: number;
  yMax: number;
  /** visible world height — drives jump detection & value clamping */
  visibleHeight: number;
  /** sample count (cartesian: ~2x canvas px width, clamped) */
  count: number;
}

/**
 * Marching squares over the visible viewport for implicit curves F(x,y) = 0
 * where F = lhs - rhs. Emits short line segments as point pairs (the first
 * point of each pair has brk: true), sorted left-to-right so the trace
 * animation sweeps across the screen.
 */
function sampleImplicit(fns: CompiledCurve, opts: SampleOptions): SamplePoint[] {
  const { xMin, xMax, yMin, yMax } = opts;
  const F = (x: number, y: number) => fns[0]({ x, y }) - fns[1]({ x, y });

  const cols = 170;
  const rows = Math.max(
    40,
    Math.min(240, Math.round((cols * (yMax - yMin)) / (xMax - xMin || 1)))
  );
  const dx = (xMax - xMin) / cols;
  const dy = (yMax - yMin) / rows;

  const grid = new Float64Array((cols + 1) * (rows + 1));
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      let v = F(xMin + i * dx, yMin + j * dy);
      if (v === 0) v = 1e-12; // nudge exact zeros so sign tests see a crossing
      grid[j * (cols + 1) + i] = v;
    }
  }

  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const v00 = grid[j * (cols + 1) + i]; // bottom-left
      const v10 = grid[j * (cols + 1) + i + 1]; // bottom-right
      const v01 = grid[(j + 1) * (cols + 1) + i]; // top-left
      const v11 = grid[(j + 1) * (cols + 1) + i + 1]; // top-right
      if (!isFinite(v00) || !isFinite(v10) || !isFinite(v01) || !isFinite(v11)) continue;

      const x0 = xMin + i * dx;
      const y0 = yMin + j * dy;
      const lerp = (va: number, vb: number) => va / (va - vb);

      // crossings indexed: 0 bottom, 1 right, 2 top, 3 left
      const crossings: { x: number; y: number }[] = [];
      if (v00 < 0 !== v10 < 0) crossings.push({ x: x0 + lerp(v00, v10) * dx, y: y0 });
      if (v10 < 0 !== v11 < 0) crossings.push({ x: x0 + dx, y: y0 + lerp(v10, v11) * dy });
      if (v01 < 0 !== v11 < 0) crossings.push({ x: x0 + lerp(v01, v11) * dx, y: y0 + dy });
      if (v00 < 0 !== v01 < 0) crossings.push({ x: x0, y: y0 + lerp(v00, v01) * dy });

      if (crossings.length === 2) {
        segments.push({
          x1: crossings[0].x,
          y1: crossings[0].y,
          x2: crossings[1].x,
          y2: crossings[1].y,
        });
      } else if (crossings.length === 4) {
        // saddle cell: disambiguate with the sign at the cell center
        const center = F(x0 + dx / 2, y0 + dy / 2);
        const pairs =
          center < 0 === v00 < 0
            ? [
                [0, 1],
                [2, 3],
              ]
            : [
                [0, 3],
                [1, 2],
              ];
        for (const [a, b] of pairs) {
          segments.push({
            x1: crossings[a].x,
            y1: crossings[a].y,
            x2: crossings[b].x,
            y2: crossings[b].y,
          });
        }
      }
    }
  }

  segments.sort((a, b) => Math.min(a.x1, a.x2) - Math.min(b.x1, b.x2));

  const points: SamplePoint[] = [];
  for (const seg of segments) {
    points.push({ x: seg.x1, y: seg.y1, brk: true });
    points.push({ x: seg.x2, y: seg.y2, brk: false });
  }
  return points;
}

/**
 * Sample a curve into world-space points, normalizing all three curve types.
 * Discontinuities (non-finite values, huge jumps) are marked with brk: true
 * so the renderer starts a new subpath instead of drawing asymptote walls.
 */
export function sampleCurve(
  curve: CurveDef,
  fns: CompiledCurve,
  opts: SampleOptions
): SamplePoint[] {
  if (curve.type === 'implicit') {
    return sampleImplicit(fns, opts);
  }

  const points: SamplePoint[] = [];
  const jumpLimit = 4 * opts.visibleHeight;
  const clampLimit = 10 * opts.visibleHeight;

  const isCartesian = curve.type === 'cartesian';
  const [from, to] = isCartesian ? [opts.xMin, opts.xMax] : curve.domain;
  const n = isCartesian
    ? Math.max(600, Math.min(2400, opts.count))
    : 2000;

  let prev: SamplePoint | null = null;
  let pendingBreak = false;

  for (let i = 0; i <= n; i++) {
    const s = from + ((to - from) * i) / n;

    let x: number;
    let y: number;
    if (curve.type === 'cartesian') {
      x = s;
      y = fns[0]({ x: s });
    } else if (curve.type === 'parametric') {
      x = fns[0]({ t: s });
      y = fns[1]({ t: s });
    } else {
      const r = fns[0]({ theta: s, t: s });
      x = r * Math.cos(s);
      y = r * Math.sin(s);
    }

    if (!isFinite(x) || !isFinite(y)) {
      pendingBreak = points.length > 0;
      continue;
    }

    // Keep canvas path coordinates sane near asymptotes.
    y = Math.max(-clampLimit, Math.min(clampLimit, y));
    x = Math.max(-clampLimit, Math.min(clampLimit, x));

    let brk = pendingBreak;
    if (prev && (Math.abs(y - prev.y) > jumpLimit || Math.abs(x - prev.x) > jumpLimit)) {
      brk = true;
    }

    const point: SamplePoint = { x, y, brk };
    points.push(point);
    prev = point;
    pendingBreak = false;
  }

  return points;
}
