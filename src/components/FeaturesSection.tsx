import { ArrowUpRight } from 'lucide-react';

const ENTRIES = [
    {
        index: '01',
        title: 'Step through, not skim past',
        annotation: 'pause() · resume() · speed(0.25x → 4x)',
        description:
            'Every visualization exposes its execution. Pause mid-swap, crawl through a merge, replay the step you missed.',
    },
    {
        index: '02',
        title: 'Intuition over memorization',
        annotation: 'seeing > reciting',
        description:
            'Watching a pivot partition an array beats rereading the definition. The animation is the explanation.',
    },
    {
        index: '03',
        title: 'Real code, in the open',
        annotation: 'react · typescript · canvas',
        description:
            'No black boxes. The same TypeScript that renders each frame is on GitHub — read it, fork it, break it.',
    },
    {
        index: '04',
        title: 'Built to grow',
        annotation: 'registry.push(yourIdea)',
        description:
            'A pluggable registry means new visualizations drop in as self-contained modules. Pathfinding and fractals are next.',
    },
];

export const FeaturesSection = () => {
    return (
        <section className="py-28 px-6 relative">
            <div className="container mx-auto max-w-6xl">
                <div className="flex items-baseline justify-between mb-14 gap-6 flex-wrap">
                    <h2 className="font-display font-medium text-4xl md:text-5xl tracking-tight">
                        Why it <em className="italic text-primary">works</em>
                    </h2>
                    <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                        field notes / 01–04
                    </span>
                </div>

                <div className="border-t border-border">
                    {ENTRIES.map((entry) => (
                        <div
                            key={entry.index}
                            className="group grid md:grid-cols-12 gap-2 md:gap-6 items-baseline py-8 border-b border-border px-2 md:px-4 -mx-2 md:-mx-4 transition-colors duration-300 hover:bg-card/70"
                        >
                            <span className="md:col-span-1 font-mono text-sm text-primary">
                                {entry.index}
                            </span>
                            <div className="md:col-span-5">
                                <h3 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-foreground group-hover:text-primary transition-colors duration-300 flex items-center gap-3">
                                    {entry.title}
                                    <ArrowUpRight className="w-5 h-5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary shrink-0" />
                                </h3>
                                <p className="font-mono text-[11px] text-muted-foreground mt-2">
                                    {entry.annotation}
                                </p>
                            </div>
                            <p className="md:col-span-6 text-muted-foreground leading-relaxed">
                                {entry.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
