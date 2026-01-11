import { ChevronDown } from 'lucide-react';

export const HeroSection = () => {
  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Interactive Visualizations
          </span>
        </div>

        <h1
          className="font-display font-bold text-5xl md:text-7xl lg:text-8xl tracking-tight mb-6 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <span className="text-foreground">Visual</span>
          <br />
          <span className="text-gradient">Algorithms</span>
        </h1>

        <p
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          Transform complex logic into beautiful, interactive art. Explore sorting algorithms, 
          mathematical patterns, and data structures through stunning visualizations.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <button
            onClick={scrollToProjects}
            className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-glow-md hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
          >
            Explore Projects
          </button>
          <a
            href="#about"
            className="px-8 py-4 rounded-xl glass text-foreground font-semibold text-lg hover:bg-secondary/80 transition-all duration-300"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToProjects}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
      >
        <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </button>

      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '-3s' }}
      />
    </section>
  );
};
