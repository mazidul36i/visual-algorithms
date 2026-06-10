import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { MarqueeStrip } from '@/components/MarqueeStrip';
import { FeaturesSection } from '@/components/FeaturesSection';
import { CategoryTabs } from '@/components/CategoryTabs';
import { ProjectCard } from '@/components/ProjectCard';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { CTASection } from '@/components/CTASection';
import { ProjectCategory, getProjectsByCategory } from '@/lib/projectRegistry';
import ClickSpark from '@/components/ClickSpark';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all');
  const projects = getProjectsByCategory(selectedCategory);

  return (
    <div className="min-h-screen bg-background dark grain">
      <ClickSpark
        sparkColor="hsl(38, 95%, 56%)"
        sparkSize={10}
        sparkRadius={25}
        sparkCount={12}
        duration={500}
        easing="ease-out"
        extraScale={1}
      >
        <Navbar />

        <main className="relative z-10">
          <HeroSection />

          <MarqueeStrip />

          <FeaturesSection />

          {/* Projects Section */}
          <section id="projects" className="py-28 px-6 border-t border-border">
            <div className="container mx-auto max-w-6xl">
              <div className="flex items-baseline justify-between mb-12 gap-6 flex-wrap">
                <h2 className="font-display font-medium text-4xl md:text-5xl tracking-tight">
                  The <em className="italic text-primary">lab</em>
                </h2>
                <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                  {projects.length} live {projects.length === 1 ? 'experiment' : 'experiments'} · more incoming
                </span>
              </div>

              <div className="mb-12">
                <CategoryTabs
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {projects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                  />
                ))}
              </div>

              {projects.length === 0 && (
                <div className="text-center py-16 border border-dashed border-border rounded-lg">
                  <p className="font-mono text-sm text-muted-foreground">
                    // nothing in this category yet — check back soon
                  </p>
                </div>
              )}
            </div>
          </section>

          <HowItWorksSection />

          <CTASection />

          {/* Footer / Colophon */}
          <footer className="border-t border-border px-6 py-10">
            <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[11px] text-muted-foreground tracking-wide">
              <span>visual-algorithms © {new Date().getFullYear()}</span>
              <span className="text-center">
                react 18 · typescript · tailwind · vite · canvas api
              </span>
              <span>
                rendered at <span className="text-primary">60fps</span> with ❤️
              </span>
            </div>
          </footer>
        </main>
      </ClickSpark>
    </div>
  );
};

export default Index;
