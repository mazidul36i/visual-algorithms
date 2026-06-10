export const TechStackSection = () => {
    const technologies = [
        { name: 'React', color: 'from-cyan-400 to-blue-500', icon: '⚛️' },
        { name: 'TypeScript', color: 'from-blue-500 to-blue-600', icon: 'TS' },
        { name: 'Tailwind CSS', color: 'from-cyan-400 to-teal-500', icon: '🎨' },
        { name: 'Vite', color: 'from-purple-500 to-pink-500', icon: '⚡' },
        { name: 'Lucide Icons', color: 'from-orange-400 to-red-500', icon: '🎯' },
        { name: 'Shadcn/ui', color: 'from-slate-600 to-slate-800', icon: '🧩' },
    ];

    return (
        <section className="py-24 px-6 border-t border-border relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

            <div className="container mx-auto max-w-6xl relative z-10">
                <div className="text-center mb-16">
                    <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
                        Built with Modern Tech
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Powered by cutting-edge technologies to deliver the best performance and developer experience.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    {technologies.map((tech, index) => (
                        <div
                            key={index}
                            className="group relative"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`glass rounded-xl px-6 py-4 hover:shadow-glow-md transition-all duration-300 hover:scale-110 cursor-default`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{tech.icon}</span>
                                    <span className="font-display font-semibold text-foreground">
                                        {tech.name}
                                    </span>
                                </div>
                            </div>

                            {/* Glow effect on hover */}
                            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tech.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10`} />
                        </div>
                    ))}
                </div>

                {/* Additional info */}
                <div className="mt-16 text-center">
                    <p className="text-muted-foreground text-sm">
                        Open source and built with ❤️ for the developer community
                    </p>
                </div>
            </div>
        </section>
    );
};
