import { useEffect, useRef } from 'react';

type Frame = { compare: [number, number]; swapped: boolean };

function* bubbleSort(a: number[]): Generator<Frame> {
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      const swapped = a[j] > a[j + 1];
      if (swapped) [a[j], a[j + 1]] = [a[j + 1], a[j]];
      yield { compare: [j, j + 1], swapped };
    }
  }
}

function* insertionSort(a: number[]): Generator<Frame> {
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0 && a[j - 1] > a[j]) {
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      yield { compare: [j - 1, j], swapped: true };
      j--;
    }
    yield { compare: [j, i], swapped: false };
  }
}

function* selectionSort(a: number[]): Generator<Frame> {
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      yield { compare: [min, j], swapped: false };
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      yield { compare: [i, min], swapped: true };
    }
  }
}

const ALGORITHMS = [
  { name: 'bubble_sort', complexity: 'O(n²)', fn: bubbleSort, stepsPerFrame: 3 },
  { name: 'insertion_sort', complexity: 'O(n²)', fn: insertionSort, stepsPerFrame: 3 },
  { name: 'selection_sort', complexity: 'O(n²)', fn: selectionSort, stepsPerFrame: 5 },
];

const BAR_COUNT = 44;

export const LiveSortCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let values: number[] = [];
    let gen: Generator<Frame> | null = null;
    let algoIndex = 0;
    let comparisons = 0;
    let highlight: [number, number] | null = null;
    let restingUntil = 0;
    let sortedFlash = 0;

    const css = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const shuffle = () => {
      values = Array.from({ length: BAR_COUNT }, (_, i) => (i + 1) / BAR_COUNT);
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }
      comparisons = 0;
      highlight = null;
      gen = ALGORITHMS[algoIndex].fn(values);
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const algo = ALGORITHMS[algoIndex];

      if (!reduced) {
        if (now > restingUntil) {
          const steps = algo.stepsPerFrame;
          for (let s = 0; s < steps; s++) {
            const r = gen!.next();
            if (r.done) {
              highlight = null;
              sortedFlash = now;
              restingUntil = now + 2200;
              algoIndex = (algoIndex + 1) % ALGORITHMS.length;
              break;
            }
            comparisons++;
            highlight = r.value.compare;
          }
        } else if (restingUntil - now < 60 && sortedFlash > 0) {
          shuffle();
          sortedFlash = 0;
        }
      }

      const primary = `hsl(${css('--primary')})`;
      const accent = `hsl(${css('--accent')})`;
      const dim = `hsl(${css('--muted-foreground')})`;

      const pad = 18;
      const top = 44;
      const gap = 3;
      const barW = (w - pad * 2 - gap * (BAR_COUNT - 1)) / BAR_COUNT;
      const maxH = h - top - pad;

      const isResting = now <= restingUntil && sortedFlash > 0;

      values.forEach((v, i) => {
        const bh = Math.max(2, v * maxH);
        const x = pad + i * (barW + gap);
        const y = h - pad - bh;
        const active = highlight && (i === highlight[0] || i === highlight[1]);
        ctx.fillStyle = isResting ? primary : active ? accent : primary;
        ctx.globalAlpha = isResting ? 0.95 : active ? 1 : 0.38 + v * 0.5;
        ctx.fillRect(x, y, barW, bh);
        ctx.globalAlpha = 1;
      });

      // Header readout, drawn in-canvas so it updates at 60fps for free
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = dim;
      ctx.fillText(isResting ? '// sorted — reshuffling' : `// ${algo.name}  ·  ${algo.complexity}`, pad, 24);
      const right = `comparisons: ${comparisons.toLocaleString()}`;
      ctx.fillStyle = isResting ? primary : dim;
      ctx.fillText(right, w - pad - ctx.measureText(right).width, 24);

      raf = requestAnimationFrame(draw);
    };

    resize();
    shuffle();
    if (reduced) {
      // Render a single sorted-ish static frame
      values.sort((a, b) => a - b);
    }
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" aria-label="Live sorting algorithm visualization" />;
};
