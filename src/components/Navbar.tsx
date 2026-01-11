import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-foreground tracking-tight">
                Visual Algorithms
              </span>
              <span className="text-xs text-muted-foreground -mt-0.5">
                Interactive DSA & Math
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isHome ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Gallery
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};
