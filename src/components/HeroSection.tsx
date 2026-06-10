import { ArrowDown } from 'lucide-react';
import { LiveSortCanvas } from './LiveSortCanvas';

export const HeroSection = () => {
  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background blueprint">
      {/* Soften the grid towards the edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 30%, hsl(var(--background)) 100%)',
        }}
      />

      {/* Single restrained light source */}
      <div className="absolute top-[-20%] left-[10%] w-[700px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-6 pt-32 pb-24 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left: editorial headline */}
          <div className="lg:col-span-7">
            <p
              className="font-mono text-xs text-muted-foreground tracking-widest mb-8 animate-fade-in-up"
            >
              <span className="text-primary">~/visual-algorithms</span> $ run --interactive
              <span className="animate-blink text-primary">▍</span>
            </p>

            <h1
              className="font-display font-medium text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.95] mb-8 animate-fade-in-up"
              style={{ animationDelay: '120ms' }}
            >
              Code you can
              <br />
              <em className="text-primary italic font-light">watch think.</em>
            </h1>

            <p
              className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '240ms' }}
            >
              Sorting, searching, π and beyond — every algorithm here runs live in
              your browser, drawn frame by frame so the logic stops being abstract.
            </p>

            <div
              className="flex flex-wrap items-center gap-4 animate-fade-in-up"
              style={{ animationDelay: '360ms' }}
            >
              <button
                onClick={scrollToProjects}
                className="group px-7 py-3.5 bg-primary text-primary-foreground font-medium text-base rounded-md hover:bg-primary/90 transition-colors flex items-center gap-3"
              >
                Open the lab
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </button>
              <a
                href="#method"
                className="px-7 py-3.5 font-mono text-sm text-muted-foreground border border-border rounded-md hover:border-primary/50 hover:text-foreground transition-colors"
              >
                how it works →
              </a>
            </div>
          </div>

          {/* Right: the product, demoing itself */}
          <div
            className="lg:col-span-5 animate-fade-in-up"
            style={{ animationDelay: '480ms' }}
          >
            <div className="relative">
              {/* Annotation tag */}
              <span className="absolute -top-3 left-4 z-10 font-mono text-[10px] tracking-widest uppercase bg-accent text-accent-foreground px-2 py-0.5">
                live · not a gif
              </span>

              <div className="border border-border bg-card/70 backdrop-blur-sm rounded-lg overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center justify-between px-4 h-9 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-muted" />
                    <span className="w-2.5 h-2.5 rounded-full bg-muted" />
                    <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">sort.ts — running</span>
                </div>
                <div className="h-64 md:h-72">
                  <LiveSortCanvas />
                </div>
              </div>

              {/* Offset frame for depth */}
              <div className="absolute inset-0 border border-primary/20 rounded-lg translate-x-3 translate-y-3 -z-10" />
            </div>

            <p className="font-mono text-[11px] text-muted-foreground mt-5 pl-1">
              // three sorting algorithms, cycling forever. this is the whole idea.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
