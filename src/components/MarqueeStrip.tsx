const ITEMS = [
  'BUBBLE SORT — O(n²)',
  'MERGE SORT — O(n log n)',
  'π ≈ 3.14159265358979',
  'BINARY SEARCH — O(log n)',
  'DIVIDE & CONQUER',
  '60 FPS · CANVAS API',
  'QUICKSORT — O(n log n) avg',
  'e ≈ 2.71828182845904',
  'DEPTH-FIRST SEARCH',
  'φ ≈ 1.61803398874989',
];

export const MarqueeStrip = () => {
  const row = ITEMS.map((item, i) => (
    <span key={i} className="flex items-center gap-8 shrink-0">
      <span>{item}</span>
      <span className="text-primary">◆</span>
    </span>
  ));

  return (
    <div className="relative border-y border-border bg-card/40 overflow-hidden py-3 select-none">
      <div className="flex w-max gap-8 animate-marquee font-mono text-xs tracking-[0.2em] text-muted-foreground whitespace-nowrap">
        <div className="flex gap-8 shrink-0">{row}</div>
        <div className="flex gap-8 shrink-0" aria-hidden="true">{row}</div>
      </div>
    </div>
  );
};
