import { ArrowUpRight, Github } from 'lucide-react';

export const CTASection = () => {
    const scrollToProjects = () => {
        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="py-32 px-6 border-t border-border relative overflow-hidden blueprint">
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, hsl(var(--background)) 100%)',
                }}
            />
            <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] bg-primary/8 rounded-full blur-[130px] pointer-events-none" />

            <div className="container mx-auto max-w-5xl relative z-10 text-center">
                <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                    free · open source · no signup
                </span>

                <h2 className="font-display font-medium text-5xl md:text-7xl tracking-tight leading-[1.02] mt-6 mb-8">
                    Stop reading about
                    <br />
                    algorithms. <em className="italic text-primary">Watch one.</em>
                </h2>

                <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
                    Student, educator, or just curious — the lab is open. Every
                    visualization is a self-contained module, and the whole platform is
                    built to take more.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={scrollToProjects}
                        className="group px-8 py-4 bg-primary text-primary-foreground font-medium text-base rounded-md hover:bg-primary/90 transition-colors flex items-center gap-3"
                    >
                        Explore the projects
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-4 font-mono text-sm text-muted-foreground border border-border rounded-md hover:border-primary/50 hover:text-foreground transition-colors flex items-center gap-2.5"
                    >
                        <Github className="w-4 h-4" />
                        read the source
                    </a>
                </div>
            </div>
        </section>
    );
};
