import { cn } from '@/lib/utils';
import { ProjectCategory, categories } from '@/lib/projectRegistry';
import { Cpu, Calculator, Network, LayoutGrid } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-4 h-4" />,
  Calculator: <Calculator className="w-4 h-4" />,
  Network: <Network className="w-4 h-4" />,
  LayoutGrid: <LayoutGrid className="w-4 h-4" />,
};

interface CategoryTabsProps {
  selected: ProjectCategory | 'all';
  onSelect: (category: ProjectCategory | 'all') => void;
}

export const CategoryTabs = ({ selected, onSelect }: CategoryTabsProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <button
        onClick={() => onSelect('all')}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
          selected === 'all'
            ? 'bg-primary text-primary-foreground glow-primary'
            : 'glass text-muted-foreground hover:text-foreground hover:bg-secondary/80'
        )}
      >
        {iconMap.LayoutGrid}
        All Projects
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
            selected === category.id
              ? 'bg-primary text-primary-foreground glow-primary'
              : 'glass text-muted-foreground hover:text-foreground hover:bg-secondary/80'
          )}
        >
          {iconMap[category.icon]}
          {category.label}
        </button>
      ))}
    </div>
  );
};
