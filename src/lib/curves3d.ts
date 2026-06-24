// 3D curve/surface definitions, presets, and geometry building for the 3D Graph page.

import { ExpressionError, compileExpression } from './expression';

export type Curve3DType = 'surface' | 'curve3d';

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface Curve3DDef {
  id: string;
  label: string;
  type: Curve3DType;
  /** [f(x,y)] for surfaces, [x(t), y(t), z(t)] for space curves */
  exprs: string[];
  /** t-range for space curves (unused for surfaces) */
  domain: [number, number];
  /** surfaces sample x,y over [-range, range] */
  range: number;
  color: HSLColor;
  /** seconds for a full trace at 1x speed */
  duration: number;
  annotation: string;
}

export type Compiled3D = ((vars: Record<string, number>) => number)[];

export const VARS_FOR_3D: Record<Curve3DType, string[]> = {
  surface: ['x', 'y'],
  curve3d: ['t'],
};

// HSL components of the theme tokens in index.css (numeric so shading can
// scale lightness per-quad).
export const COLORS_3D = {
  emerald: { h: 158, s: 80, l: 48 },
  amber: { h: 38, s: 95, l: 56 },
  cyan: { h: 185, s: 95, l: 55 },
  magenta: { h: 340, s: 80, l: 60 },
};

export const SURFACE_SEGMENTS = 48;
export const CURVE3D_SAMPLES = 700;

const TWO_PI = Math.PI * 2;

export const PRESETS_3D: Curve3DDef[] = [
  // — surfaces —
  {
    id: 'waves',
    label: 'z = sin(x) · cos(y)',
    type: 'surface',
    exprs: ['1.5 * sin(x) * cos(y)'],
    domain: [0, 1],
    range: 6,
    color: COLORS_3D.emerald,
    duration: 6,
    annotation: '// plotting z = 1.5 · sin(x) · cos(y)',
  },
  {
    id: 'ripple',
    label: 'ripple',
    type: 'surface',
    exprs: ['3 * sin(sqrt(x^2 + y^2)) * exp(-0.15 * sqrt(x^2 + y^2))'],
    domain: [0, 1],
    range: 7,
    color: COLORS_3D.cyan,
    duration: 7,
    annotation: '// plotting z = 3 sin(r) · e^(−0.15r) · r = √(x² + y²)',
  },
  {
    id: 'saddle',
    label: 'saddle',
    type: 'surface',
    exprs: ['(x^2 - y^2) / 6'],
    domain: [0, 1],
    range: 6,
    color: COLORS_3D.amber,
    duration: 6,
    annotation: '// plotting z = (x² − y²) / 6',
  },
  {
    id: 'peaks',
    label: 'twin peaks',
    type: 'surface',
    exprs: ['4 * exp(-((x-2)^2 + (y-2)^2) / 4) + 3 * exp(-((x+2)^2 + (y+2)^2) / 5)'],
    domain: [0, 1],
    range: 6,
    color: COLORS_3D.magenta,
    duration: 7,
    annotation: '// plotting two gaussian peaks',
  },
  // — space curves —
  {
    id: 'helix',
    label: 'helix',
    type: 'curve3d',
    exprs: ['4 * cos(t)', '4 * sin(t)', '0.8 * t - 5'],
    domain: [0, 4 * Math.PI],
    range: 6,
    color: COLORS_3D.emerald,
    duration: 8,
    annotation: '// plotting (4cos t, 4sin t, 0.8t − 5)',
  },
  {
    id: 'torus-knot',
    label: 'torus knot 2:3',
    type: 'curve3d',
    exprs: [
      '1.4 * (3 + cos(3t)) * cos(2t)',
      '1.4 * (3 + cos(3t)) * sin(2t)',
      '1.4 * sin(3t)',
    ],
    domain: [0, TWO_PI],
    range: 6,
    color: COLORS_3D.magenta,
    duration: 12,
    annotation: '// plotting a (2,3) torus knot',
  },
  {
    id: 'lissajous-3d',
    label: 'lissajous 3:4:5',
    type: 'curve3d',
    exprs: ['5 * sin(3t)', '5 * sin(4t)', '5 * sin(5t)'],
    domain: [0, TWO_PI],
    range: 6,
    color: COLORS_3D.cyan,
    duration: 12,
    annotation: '// plotting (sin 3t, sin 4t, sin 5t) · scaled ×5',
  },
];

/** Compile a 3D def's expression strings (throws ExpressionError on bad input). */
export function compileCurve3D(def: Pick<Curve3DDef, 'type' | 'exprs'>): Compiled3D {
  const vars = VARS_FOR_3D[def.type];
  return def.exprs.map((src) => compileExpression(src, vars));
}

/**
 * Resolve a surface equation typed as a whole — "z = sin(x) * cos(y)" or just
 * "sin(x) * cos(y)" — into the f(x,y) expression string.
 * Throws ExpressionError with positions relative to the full input string.
 */
export function resolveSurfaceEquation(input: string): string {
  const firstEq = input.indexOf('=');

  if (firstEq === -1) {
    compileExpression(input, ['x', 'y']); // throws with the real position if invalid
    return input.trim();
  }

  const secondEq = input.indexOf('=', firstEq + 1);
  if (secondEq !== -1) {
    throw new ExpressionError('only one "=" allowed', secondEq);
  }

  const lhsRaw = input.slice(0, firstEq);
  const rhsRaw = input.slice(firstEq + 1);
  if (lhsRaw.trim() !== 'z') {
    throw new ExpressionError('left side must be "z" (or omit the "z =")', 0);
  }
  if (rhsRaw.trim() === '') {
    throw new ExpressionError('right side of "=" is empty', input.length);
  }
  try {
    compileExpression(rhsRaw, ['x', 'y']);
  } catch (err) {
    if (err instanceof ExpressionError) {
      throw new ExpressionError(err.message, err.position + firstEq + 1);
    }
    throw err;
  }
  return rhsRaw.trim();
}

export interface SurfaceGeometry {
  kind: 'surface';
  /** grid segments per side; vertex grid is (n+1) x (n+1) */
  n: number;
  /** world-space positions, (n+1)^2 * 3, NaN z marks an invalid vertex */
  verts: Float64Array;
}

export interface Curve3DPoint {
  x: number;
  y: number;
  z: number;
  /** start a new subpath at this point (discontinuity before it) */
  brk: boolean;
}

export interface Curve3DGeometry {
  kind: 'curve';
  points: Curve3DPoint[];
}

export type Geometry3D = SurfaceGeometry | Curve3DGeometry;

/**
 * Build world-space geometry for a 3D def. Geometry is viewport-independent,
 * so this runs once per plotted item (navigation only re-projects).
 */
export function buildGeometry3D(def: Curve3DDef, fns: Compiled3D): Geometry3D {
  if (def.type === 'surface') {
    const n = SURFACE_SEGMENTS;
    const verts = new Float64Array((n + 1) * (n + 1) * 3);
    const r = def.range;
    const zLimit = 2.5 * r;
    for (let j = 0; j <= n; j++) {
      const y = -r + (2 * r * j) / n;
      for (let i = 0; i <= n; i++) {
        const x = -r + (2 * r * i) / n;
        let z = fns[0]({ x, y });
        if (isFinite(z)) {
          z = Math.max(-zLimit, Math.min(zLimit, z));
        } else {
          z = NaN;
        }
        const k = (j * (n + 1) + i) * 3;
        verts[k] = x;
        verts[k + 1] = y;
        verts[k + 2] = z;
      }
    }
    return { kind: 'surface', n, verts };
  }

  const points: Curve3DPoint[] = [];
  const [from, to] = def.domain;
  const limit = 40;
  let pendingBreak = false;
  for (let i = 0; i <= CURVE3D_SAMPLES; i++) {
    const t = from + ((to - from) * i) / CURVE3D_SAMPLES;
    const x = fns[0]({ t });
    const y = fns[1]({ t });
    const z = fns[2]({ t });
    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
      pendingBreak = points.length > 0;
      continue;
    }
    points.push({
      x: Math.max(-limit, Math.min(limit, x)),
      y: Math.max(-limit, Math.min(limit, y)),
      z: Math.max(-limit, Math.min(limit, z)),
      brk: pendingBreak,
    });
    pendingBreak = false;
  }
  return { kind: 'curve', points };
}
