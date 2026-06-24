import { Link } from 'react-router-dom';
import { Project } from '@/lib/projectRegistry';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

/* Each card carries a tiny CSS-animated preview of the actual visualization,
   so the gallery demos itself before a single click. */

const SortPreview = () => {
  const heights = [0.35, 0.8, 0.5, 1, 0.25, 0.65, 0.45, 0.9, 0.3, 0.7, 0.55, 0.85];
  return (
    <div className="flex items-end gap-1.5 h-full w-full px-6 pb-5 pt-8">
      {heights.map((h, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 origin-bottom animate-sortbar rounded-[1px]',
            i % 4 === 0 ? 'bg-accent/80' : 'bg-primary/70'
          )}
          style={{
            height: '100%',
            ['--bar-from' as string]: h,
            ['--bar-to' as string]: 1.05 - h,
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
};

const PI_COLUMNS = ['3141', '5926', '5358', '9793', '2384', '6264', '3383', '2795'];

const PiPreview = () => (
  <div className="relative flex justify-between h-full w-full px-7 overflow-hidden font-mono text-sm">
    {PI_COLUMNS.map((col, i) => (
      <div
        key={i}
        className="animate-digitfall flex flex-col gap-1 text-primary/70"
        style={{ animationDelay: `${i * 0.4}s`, animationDuration: `${2.6 + (i % 3) * 0.7}s` }}
      >
        {col.split('').map((d, j) => (
          <span key={j} className={j === 0 ? 'text-accent' : undefined}>
            {d}
          </span>
        ))}
      </div>
    ))}
  </div>
);

const GraphPreview = () => (
  <div className="flex items-center justify-center h-full w-full px-6 py-4">
    <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible" fill="none">
      {/* grid */}
      {[50, 100, 150].map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={100} stroke="hsl(var(--border))" strokeWidth={0.75} />
      ))}
      {[25, 75].map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={200} y2={y} stroke="hsl(var(--border))" strokeWidth={0.75} />
      ))}
      {/* x-axis */}
      <line x1={0} y1={50} x2={200} y2={50} stroke="hsl(var(--muted-foreground))" strokeWidth={0.75} opacity={0.4} />
      {/* self-drawing sine curve */}
      <path
        d="M0,50 Q19,14 38,50 T76,50 T114,50 T152,50 T190,50"
        stroke="hsl(var(--chart-3))"
        strokeWidth={2}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        className="animate-curvedraw"
      />
      {/* pen dot */}
      <circle cx={190} cy={50} r={3} fill="hsl(var(--accent))" className="animate-pulse" />
    </svg>
  </div>
);

const NodesPreview = () => (
  <div className="relative h-full w-full">
    {[
      { top: '30%', left: '20%' },
      { top: '55%', left: '45%' },
      { top: '25%', left: '65%' },
      { top: '65%', left: '78%' },
    ].map((pos, i) => (
      <span
        key={i}
        className="absolute w-2.5 h-2.5 rounded-full bg-primary/80 animate-pulse-slow"
        style={{ ...pos, animationDelay: `${i * 0.6}s` }}
      />
    ))}
  </div>
);

const previewById: Record<string, React.ReactNode> = {
  'sorting-visualizer': <SortPreview />,
  'flow-of-pi': <PiPreview />,
  'graph-visualizer': <GraphPreview />,
};

interface ProjectCardProps {
  project: Project;
  index: number;
}

export const ProjectCard = ({ project, index }: ProjectCardProps) => {
  return (
    <Link
      to={project.path}
      className="group relative block border border-border bg-card/60 rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/50 hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Live preview window */}
      <div className="relative h-44 border-b border-border bg-background/60 overflow-hidden">
        {previewById[project.id] ?? <NodesPreview />}
        <span className="absolute top-3 left-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          fig. {String(index + 1).padStart(2, '0')} — {project.category.replace('-', ' ')}
        </span>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="font-display text-2xl font-medium tracking-tight text-foreground group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1" />
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed mb-5">
          {project.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
          <span className={cn(
            'uppercase tracking-wider',
            project.difficulty === 'beginner' && 'text-primary',
            project.difficulty === 'intermediate' && 'text-accent',
            project.difficulty === 'advanced' && 'text-destructive'
          )}>
            ● {project.difficulty}
          </span>
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag}>#{tag.toLowerCase().replace(/\s+/g, '-')}</span>
          ))}
        </div>
      </div>
    </Link>
  );
};
