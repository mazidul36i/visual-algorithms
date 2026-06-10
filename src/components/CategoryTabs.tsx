import { cn } from '@/lib/utils';
import { ProjectCategory, categories } from '@/lib/projectRegistry';

interface CategoryTabsProps {
  selected: ProjectCategory | 'all';
  onSelect: (category: ProjectCategory | 'all') => void;
}

export const CategoryTabs = ({ selected, onSelect }: CategoryTabsProps) => {
  const tabs: { id: ProjectCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'all' },
    ...categories.map((c) => ({ id: c.id, label: c.label.toLowerCase() })),
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 font-mono text-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn(
            'px-4 py-2 rounded-md border transition-all duration-200',
            selected === tab.id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
          )}
        >
          {selected === tab.id ? `[${tab.label}]` : tab.label}
        </button>
      ))}
    </div>
  );
};
