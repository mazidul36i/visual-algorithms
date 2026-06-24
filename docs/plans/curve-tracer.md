# Curve Tracer — Animated Graph Visualizer at `/graphs`

> **Resume instructions:** This file is the source of truth for this feature. If execution was
> interrupted, check the Progress Checklist below — items marked `[x]` are done and verified,
> `[~]` means in progress (read the listed file to see how far it got), `[ ]` not started.
> Update the checklist as you complete each step.

## Progress Checklist

- [x] 1. `src/lib/expression.ts` — safe expression parser/compiler
- [x] 2. `src/lib/curves.ts` — curve types, preset library, sampling + discontinuity handling
- [x] 3. `src/pages/GraphVisualizer.tsx` — the page (canvas, RAF loop, controls, custom input)
- [x] 4. `src/App.tsx` — add `/graphs` route above the catch-all
- [x] 5. `src/lib/projectRegistry.ts` — register `graph-visualizer` project
- [x] 6. `src/components/ProjectCard.tsx` — `GraphPreview` + `previewById` entry
- [x] 7. `src/index.css` — `curvedraw` keyframes + `.animate-curvedraw` + reduced-motion guard
- [x] 8. `src/components/Navbar.tsx` — replace "Fourier Series — Coming Soon" with Curve Tracer link
- [x] 9. Verify: `npm run build` + `npm run lint` pass
- [x] 11. (follow-up request) Multi-curve plotting: presets toggle on/off and stack; custom
        formulas added via "add to plot" button (Enter works too) with cycling colors;
        "// plotted (n)" list in sidebar with per-curve remove and clear-all; per-curve
        trace progress/pen; annotation overlay lists all plotted curves. Build + lint pass.
- [x] 12. (follow-up request) Full-equation input + implicit curves: new `implicit` curve type
        rendered via marching squares over the visible viewport (`sampleImplicit` in
        src/lib/curves.ts); `resolveEquation()` turns a whole typed formula ("y = sin(x)",
        "x^2 + y^2 = 4", "x + y = 1", bare "sin(x)") into cartesian or implicit; custom
        section's first mode is now "equation" (replaces y = f(x)); three implicit presets
        added (heart curve, xy = 1, lemniscate) under a "// implicit" sidebar group.
        Trace animation sweeps implicit segments left-to-right. Build + lint + node
        unit checks (routing, circle accuracy 2e-4, segment ordering) pass.
- [x] 13. (follow-up request) Save formulas by name: BookmarkPlus icon on plotted custom-curve
        rows opens an inline name input (Enter/✓ saves, Esc cancels); entries persist to
        localStorage key `curve-tracer-saved-formulas` as {name, type, exprs, label};
        "// saved (n)" sidebar section lists them — click re-plots (fresh color, current
        viewport), × deletes; same name overwrites. Build + lint pass.
- [~] 10. Verify: dev server boots, `/graphs` serves, all 3 new modules transform cleanly,
        parser (18 cases) + sampler (12 presets, break detection) unit-checked via node.
        Remaining: in-browser visual checks (trace animation, pan/zoom feel, mobile layout,
        reduced-motion) — needs a human eyeball.

## Context

A new tool that visualizes graphs with animation — "like x=y graph or any complex ones." Third
lab experiment: an animated math curve plotter where equations draw themselves on a pan/zoomable
canvas, spanning simple cartesian curves (y=x, sin x) through parametric showpieces (Lissajous,
butterfly curve) and polar curves (rose, cardioid, spiral), plus a custom-expression input so
users can type their own f(x). Follows established patterns (FlowOfPi's canvas+RAF page, project
registry, landing-card previews) and the editorial-lab aesthetic (Fraunces headings, JetBrains
Mono annotations, glass panels, emerald/amber/cyan palette).

## New files

### 1. `src/lib/expression.ts` — safe expression parser/compiler (~180 lines)

No `eval`/`new Function`. Tokenizer + recursive-descent parser → AST → closure compile.

- **Tokens**: number, ident, ops `+ - * / ^`, parens; each records char position for error reporting.
- **Grammar** (precedence climbing):
  - `expr := term (('+'|'-') term)*`
  - `term := unary (('*'|'/') unary | implicit-mul)*`
  - `unary := '-' unary | power`
  - `power := primary ('^' unary)?` (right-assoc)
  - `primary := number | ident | ident '(' expr ')' | '(' expr ')'`
- **Implicit multiplication**: `2x`, `x sin(x)`, `3(x+1)` all parse (in `term`, adjacent
  ident/number/lparen ⇒ `*`).
- **Whitelists** (the safety boundary): functions `sin cos tan asin acos atan sqrt abs log ln exp
  floor ceil round sign` → `Math.*`; constants `pi`, `e`; allowed variables passed by caller
  (`['x']` cartesian, `['t']` parametric, `['theta','t']` polar). Anything else throws
  `ExpressionError` (with `position`).
- **API**: `compileExpression(src, allowedVars): (vars) => number`. AST compiled once into nested
  closures; NaN/Infinity flow through to the sampler (discontinuity handling there).

### 2. `src/lib/curves.ts` — curve model, presets, sampling (~160 lines)

- **Types**: `CurveType = 'cartesian' | 'parametric' | 'polar'`;
  `CurveDef { id, label, type, exprs (1 or 2 strings), domain: [a,b], color (hsl literal),
  view {centerX, centerY, scale}, duration (s at 1×), annotation }`;
  `SamplePoint { x, y, brk }`.
- **Palette literals** matching index.css tokens (canvas can't read CSS vars per-stroke cheaply):
  emerald `hsl(158 80% 48%)`, amber `hsl(38 95% 56%)`, cyan `hsl(185 95% 55%)`,
  magenta `hsl(340 80% 60%)`.
- **~12 presets**, simple → complex; expression strings compiled through the same parser as
  custom input (one code path):
  - cartesian: `x`, `x^2`, `sin(x)`, damped sine `sin(3x)*exp(-0.2*x^2)`, `1/x`, `tan(x)`
  - parametric: circle, Lissajous `sin(3t), sin(4t)`, butterfly curve (domain [0, 12π], ~20s — the showpiece)
  - polar: rose `cos(4·theta)`, cardioid `1−cos(theta)`, Archimedean spiral `0.15·theta`
- **`sampleCurve(...)` → `SamplePoint[]`** normalizes all three types: cartesian samples the
  *visible* x-range (n ≈ 2×canvas width, clamped [600, 2400]); parametric/polar sample the fixed
  domain (n = 2000).
- **Discontinuity handling** (in sampler, world space): non-finite values dropped and next point
  marked `brk: true`; jump detection `|Δy| > 4×visibleWorldHeight` ⇒ `brk` (so `1/x` and `tan(x)`
  render as separate branches, no asymptote walls); finite-but-huge values clamped to
  ±10×visibleWorldHeight. At draw time `brk` ⇒ `moveTo`.

### 3. `src/pages/GraphVisualizer.tsx` — the page (~450 lines, single file like FlowOfPi)

**State vs refs** (FlowOfPi pattern — refs mirror state for the RAF loop):
- React state: `selectedId` (preset id or `'custom'`), `customType`, custom expression strings,
  `parseError`, `isPlaying`, `speed` (0.25–4×), `activeCurve`.
- Refs (no re-renders at 60fps): canvas/wrapper, `viewportRef {centerX, centerY, scale}` (uniform
  px-per-unit so circles stay round), compiled curve, samples + dirty flag, `progressRef` (0–1),
  `isPlayingRef`/`speedRef` synced via tiny effects, drag state, `coordReadoutRef` (pen
  coordinates written via `textContent`), reduced-motion flag.

**RAF loop** (always running, like FlowOfPi — makes pan/zoom-while-paused free). Per frame:
resample if dirty → advance `progress += dt·speed/duration` when playing (auto-stop at 1) →
draw: clear, grid, axes+labels, curve path up to `floor(progress·(n−1))` respecting `brk`,
glowing pen dot at tip (shadowBlur in curve color), faint 8%-opacity ghost of the full curve
ahead of the pen → write live `x: …  y: …` readout.

**Canvas/coords**: ResizeObserver + DPR-aware sizing (`ctx.setTransform(dpr,…)`, draw in CSS px).
`worldToScreen`/`screenToWorld` helpers. Grid step from the 1–2–5 ladder (spacing ≥ 64px), faint
minor grid, brighter axes, JetBrains Mono 10px labels clamped to edges when axes are off-screen.

**Pan/zoom**: pointer-capture drag to pan; wheel zoom anchored at cursor (`{ passive: false }`,
scale clamp [2, 5000] px/unit); zoom in/out buttons; reset-view button restoring the preset's
suggested `view`. All set the samples-dirty flag (cartesian resamples to the new visible domain).

**Custom input**: mode tabs `y = f(x)` / `x(t), y(t)` / `r(θ)`; one or two mono `Input` fields,
debounced ~300ms parse; on success build a custom `CurveDef` and auto-play; on `ExpressionError`
show the message in destructive color plus a mono caret line (expression echoed with `^` at the
error position). Hint line lists supported functions/constants.

**Reduced motion**: on curve load set `progress = 1`, don't auto-play (explicit Play still animates).

**Layout** (matching FlowOfPi conventions): `min-h-screen bg-background dark` shell; glass-strong
header with ArrowLeft back-link + Fraunces title "Curve Tracer"; left sidebar (~300px glass
panel, stacks on mobile) with presets grouped under mono headers (`// cartesian`,
`// parametric`, `// polar`) — swatch + label rows, active = primary ring — and the custom-input
section below; canvas fills the rest with top-left mono annotation (`// plotting y = sin(x)`) +
amber live coordinate readout; floating bottom-center glass-strong control bar: speed slider,
Replay / Play-Pause / ZoomIn / ZoomOut / reset-view buttons (lucide icons).

## Modified files

- **`src/App.tsx`** — `import GraphVisualizer` + `<Route path="/graphs" element={<GraphVisualizer />} />`
  above the `*` catch-all.
- **`src/lib/projectRegistry.ts`** — new entry: id `graph-visualizer`, title "Curve Tracer",
  category `mathematics`, difficulty `intermediate`, path `/graphs`, tags
  `['Functions','Parametric','Polar']`, icon `'Spline'` (string is only stored — ProjectCard no
  longer renders icons), color `cyan`.
- **`src/components/ProjectCard.tsx`** — add `GraphPreview`: small SVG with faint grid lines +
  axes and a sine path using `pathLength={1}`, `strokeDasharray: 1`, class `animate-curvedraw`,
  stroke `hsl(var(--chart-3))` (cyan), plus a pulsing amber pen dot; register in
  `previewById['graph-visualizer']` (around line 69).
- **`src/index.css`** — `@keyframes curvedraw` (stroke-dashoffset 1 → 0, ~3.5s ease-in-out
  infinite) + `.animate-curvedraw` utility; disable it in the existing `prefers-reduced-motion` block.
- **`src/components/Navbar.tsx`** — replace the "Fourier Series — Coming Soon" `ListItem`
  (around line 77) with
  `<ListItem href="/graphs" title="Curve Tracer">Watch functions, parametric and polar curves draw themselves.</ListItem>`
  (plain `href`, consistent with the `/pi` item).

## Reused existing pieces

- shadcn `Slider`, `Button`, `Input`, `Tabs` from `src/components/ui/`; `cn` from `src/lib/utils.ts`.
- `.glass` / `.glass-strong` utilities and theme tokens from `src/index.css`.
- FlowOfPi (`src/pages/FlowOfPi.tsx`) as the structural template for header, RAF/refs pattern,
  and floating control bar.

## Verification

1. `npm run build` and `npm run lint` pass.
2. `npm run dev` manual checks:
   - Landing card shows the self-drawing sine preview and links to `/graphs`; Navbar →
     Mathematics → Curve Tracer works.
   - Each preset traces with the moving pen; `1/x` and `tan(x)` show separate branches with no
     vertical asymptote lines.
   - Custom input: `sin(x) * x/3`, `2x`, `x sin(x)` plot; `sin(x` and `foo(x)` show inline caret errors.
   - Play/pause/replay/speed (mid-trace speed change applies immediately); drag-pan, wheel-zoom
     at cursor, zoom buttons, reset view; cartesian curves resample to fill new visible domain.
   - Browser zoom 150% stays crisp (DPR); DevTools `prefers-reduced-motion: reduce` ⇒ curve
     renders instantly, card preview static.

## Key trade-offs (decided)

- Single page file + two `src/lib/` modules (parser/curves reusable, page matches repo
  convention) — no folder.
- Always-running RAF (FlowOfPi precedent) over dirty-flag invalidation — one ~2000-point stroke
  per frame is trivial.
- Uniform x/y scale (round circles) with per-preset suggested viewports + reset-view to
  compensate for fast-growing curves.
- Fixed-density sampling with world-space break detection — adaptive subdivision rejected as
  unneeded complexity.
