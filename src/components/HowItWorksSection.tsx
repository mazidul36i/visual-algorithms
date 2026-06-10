const STEPS = [
    {
        number: '01',
        title: 'Pick a concept',
        description: 'Sorting, π, data structures — choose whatever currently refuses to make sense.',
    },
    {
        number: '02',
        title: 'Run it live',
        description: 'Drive the visualization yourself: feed it data, slow it to a crawl, scrub through steps.',
    },
    {
        number: '03',
        title: 'Keep the intuition',
        description: 'Once you have watched a merge happen, you cannot unsee it. That is the point.',
    },
];

export const HowItWorksSection = () => {
    return (
        <section id="method" className="py-28 px-6 border-t border-border relative overflow-hidden">
            <div className="absolute bottom-[-30%] right-[-10%] w-[500px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left: the method */}
                    <div>
                        <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                            method
                        </span>
                        <h2 className="font-display font-medium text-4xl md:text-5xl tracking-tight mt-3 mb-12">
                            Three steps,
                            <br />
                            <em className="italic text-primary">zero lectures.</em>
                        </h2>

                        <ol className="space-y-8">
                            {STEPS.map((step) => (
                                <li key={step.number} className="flex gap-6 group">
                                    <span className="font-mono text-sm text-primary pt-1.5 shrink-0">
                                        {step.number}
                                    </span>
                                    <div>
                                        <h3 className="font-display text-xl md:text-2xl font-medium tracking-tight mb-1.5">
                                            {step.title}
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Right: a session transcript */}
                    <div className="relative">
                        <div className="border border-border bg-card/70 rounded-lg overflow-hidden font-mono text-[13px] leading-7">
                            <div className="flex items-center justify-between px-4 h-9 border-b border-border">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-muted" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-muted" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                                </div>
                                <span className="text-[11px] text-muted-foreground">session.log</span>
                            </div>
                            <div className="p-6 text-muted-foreground">
                                <p><span className="text-primary">$</span> visual-algorithms open sorting</p>
                                <p className="text-muted-foreground/70">→ loaded: bubble_sort, merge_sort</p>
                                <p className="mt-3"><span className="text-primary">$</span> run --speed 0.25x --array random:64</p>
                                <p className="text-muted-foreground/70">→ rendering at 60fps · paused at step 41</p>
                                <p className="mt-3"><span className="text-primary">$</span> why did it swap index 12?</p>
                                <p className="text-muted-foreground/70">→ a[12] &gt; a[13] · watch it again ↺</p>
                                <p className="mt-3 text-foreground">
                                    <span className="text-accent">✓</span> intuition acquired
                                    <span className="animate-blink text-primary">▍</span>
                                </p>
                            </div>
                        </div>
                        <div className="absolute inset-0 border border-accent/20 rounded-lg translate-x-3 translate-y-3 -z-10" />
                    </div>
                </div>
            </div>
        </section>
    );
};
