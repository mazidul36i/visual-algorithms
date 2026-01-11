import { Link } from 'react-router-dom';
import { Project } from '@/lib/projectRegistry';
import { cn } from '@/lib/utils';
import { ArrowRight, BarChart3, Binary, Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const iconMap: Record<string, React.ReactNode> = {
  BarChart3: <BarChart3 className="w-8 h-8" />,
  Binary: <Binary className="w-8 h-8" />,
  Network: <Network className="w-8 h-8" />,
};

const colorMap = {
  primary: 'from-primary/20 to-primary/5 border-primary/30 hover:border-primary/60',
  accent: 'from-accent/20 to-accent/5 border-accent/30 hover:border-accent/60',
  cyan: 'from-chart-3/20 to-chart-3/5 border-chart-3/30 hover:border-chart-3/60',
};

const iconColorMap = {
  primary: 'text-primary',
  accent: 'text-accent',
  cyan: 'text-chart-3',
};

const difficultyColors = {
  beginner: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  intermediate: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  advanced: 'bg-chart-5/20 text-chart-5 border-chart-5/30',
};

interface ProjectCardProps {
  project: Project;
  index: number;
}

export const ProjectCard = ({ project, index }: ProjectCardProps) => {
  return (
    <Link
      to={project.path}
      className={cn(
        'group relative block rounded-2xl p-6 transition-all duration-500',
        'bg-gradient-to-br border backdrop-blur-sm',
        'hover:scale-[1.02] hover:shadow-glow-md',
        colorMap[project.color]
      )}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="flex flex-col h-full">
        {/* Icon */}
        <div
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
            'bg-card/50 backdrop-blur-sm',
            iconColorMap[project.color]
          )}
        >
          {iconMap[project.icon]}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {project.description}
          </p>
        </div>

        {/* Tags & Difficulty */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            variant="outline"
            className={cn('text-xs capitalize', difficultyColors[project.difficulty])}
          >
            {project.difficulty}
          </Badge>
          {project.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs bg-secondary/50 text-muted-foreground border-border"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span>Explore</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Glow effect on hover */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10',
          project.color === 'primary' && 'glow-primary',
          project.color === 'accent' && 'glow-accent',
          project.color === 'cyan' && 'glow-cyan'
        )}
      />
    </Link>
  );
};
