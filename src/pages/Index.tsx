import { useState } from 'react';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { CategoryTabs } from '@/components/CategoryTabs';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectCategory, getProjectsByCategory } from '@/lib/projectRegistry';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all');
  const projects = getProjectsByCategory(selectedCategory);

  return (
    <div className="min-h-screen bg-background dark">
      <ParticleBackground />
      <Navbar />

      <main className="relative z-10">
        <HeroSection />

        {/* Projects Section */}
        <section id="projects" className="py-24 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
                Visual Projects
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Each project transforms complex algorithms and mathematical concepts 
                into interactive, visual experiences.
              </p>
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
              <div className="text-center py-16 glass rounded-2xl">
                <p className="text-muted-foreground">
                  No projects in this category yet. Check back soon!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 px-6 border-t border-border">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-6">
              About This Platform
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Visual Algorithms is a portfolio-grade platform designed to make learning 
              data structures, algorithms, and mathematical concepts engaging and intuitive. 
              Built with a pluggable architecture, new visualizations can be added seamlessly.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="glass rounded-xl p-6">
                <div className="text-4xl font-display font-bold text-primary mb-2">2+</div>
                <div className="text-muted-foreground text-sm">Visual Projects</div>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="text-4xl font-display font-bold text-accent mb-2">∞</div>
                <div className="text-muted-foreground text-sm">Possibilities</div>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="text-4xl font-display font-bold text-chart-3 mb-2">60fps</div>
                <div className="text-muted-foreground text-sm">Smooth Animations</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-border">
          <div className="container mx-auto text-center text-muted-foreground text-sm">
            <p>Built with React, TypeScript & ❤️</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
