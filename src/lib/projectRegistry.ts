// Visual Algorithms - Project Registry System
// Add new projects by simply adding entries to this registry

export type ProjectCategory = 'algorithms' | 'mathematics' | 'data-structures';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  path: string;
  icon: string;
  color: 'primary' | 'accent' | 'cyan';
}

export const projects: Project[] = [
  {
    id: 'sorting-visualizer',
    title: 'Sorting Algorithms',
    description: 'Real-time, color-coded animations of Bubble Sort and Merge Sort with step-by-step visualization.',
    category: 'algorithms',
    tags: ['Bubble Sort', 'Merge Sort', 'Animation'],
    difficulty: 'beginner',
    path: '/sorting',
    icon: 'BarChart3',
    color: 'primary',
  },
  {
    id: 'flow-of-pi',
    title: 'Flow of Pi',
    description: 'A mesmerizing "Matrix-style" rain visualization of the infinite digits of Pi.',
    category: 'mathematics',
    tags: ['Pi', 'Visualization', 'Mathematics'],
    difficulty: 'intermediate',
    path: '/pi',
    icon: 'Binary',
    color: 'accent',
  },
];

export const categories: { id: ProjectCategory; label: string; icon: string }[] = [
  { id: 'algorithms', label: 'Algorithms', icon: 'Cpu' },
  { id: 'mathematics', label: 'Mathematics', icon: 'Calculator' },
  { id: 'data-structures', label: 'Data Structures', icon: 'Network' },
];

export const getProjectsByCategory = (category: ProjectCategory | 'all'): Project[] => {
  if (category === 'all') return projects;
  return projects.filter((p) => p.category === category);
};
