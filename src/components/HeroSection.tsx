import { ChevronDown } from 'lucide-react';
import { BackgroundEffect } from './BackgroundEffect';
import { Button } from './ui/button';

export const HeroSection = () => {
  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background */}
      <BackgroundEffect />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)' }}
      />

      {/* Floating Geometric Shapes */}
      <div className="absolute top-20 right-[15%] w-12 h-12 border border-primary/20 rounded-lg rotate-12 animate-float pointer-events-none blur-[1px]" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-32 left-[10%] w-16 h-16 border border-accent/20 rounded-full animate-float pointer-events-none blur-[1px]" style={{ animationDelay: '1s', animationDuration: '10s' }} />
      <div className="absolute top-1/3 left-[20%] w-8 h-8 bg-primary/10 rotate-45 animate-pulse-slow pointer-events-none blur-[2px]" />

      {/* Decorative gradients for depth (Restored & Enhanced) */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[100px] animate-float" style={{ animationDuration: '15s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '5s', animationDuration: '12s' }} />

      {/* Gradient Fade for Smooth Blending */}
      <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm text-sm font-medium text-primary mb-8 shadow-glow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Interactive Visualizations
          </div>
        </div>

        <h1
          className="font-display font-bold text-6xl md:text-8xl lg:text-9xl tracking-tight mb-8 animate-fade-in-up leading-[1.1]"
          style={{ animationDelay: '100ms' }}
        >
          <span className="text-foreground">Visual</span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer">
            Algorithms
          </span>
        </h1>

        <p
          className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up font-light"
          style={{ animationDelay: '200ms' }}
        >
          Transform complex logic into beautiful, interactive art. Explore sorting algorithms,
          mathematical patterns, and data structures through stunning visualizations.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <Button
            onClick={scrollToProjects}
            size="lg"
            className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-md hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
          >
            Explore Projects
          </Button>
          <a
            href="#about"
            className="h-14 px-8 inline-flex items-center justify-center text-lg rounded-full border border-muted-foreground/20 hover:border-foreground/50 hover:bg-muted/50 transition-all duration-300"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToProjects}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer animate-fade-in z-20"
        style={{ animationDelay: '1000ms' }}
      >
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase">Scroll</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </button>
    </section>
  );
};
