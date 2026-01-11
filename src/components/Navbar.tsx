import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Github } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-primary/10">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex w-[200px] justify-start">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-1 ring-primary/30 group-hover:scale-105 transition-transform duration-300">
                <img src="/favicon.svg" alt="Logo" className="w-5 h-5 opacity-90" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-medium text-base text-foreground/90 tracking-tight">
                Visual Algorithms
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation */}
        <div className="flex-1 flex justify-center">
          <NavigationMenu>
            <NavigationMenuList className="space-x-2">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:bg-muted/50 data-[active]:bg-muted/50 data-[state=open]:bg-muted/50">Algorithms</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/10 to-transparent p-6 no-underline outline-none focus:shadow-md ring-1 ring-primary/20 hover:ring-primary/40 transition-all"
                          to="/sorting"
                        >
                          <div className="mt-4 mb-2 text-lg font-medium text-primary">
                            Sorting Visualizer
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground/80">
                            Interactive visualizations for Bubble Sort, Merge Sort, and more.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="#" title="Pathfinding" titleClassName="text-foreground/90">
                      <span className="text-muted-foreground/60">Coming Soon: A* and Dijkstra.</span>
                    </ListItem>
                    <ListItem href="#" title="Trees & Graphs" titleClassName="text-foreground/90">
                      <span className="text-muted-foreground/60">Coming Soon: BST visuals.</span>
                    </ListItem>
                    <ListItem href="#" title="More" titleClassName="text-foreground/90">
                      <span className="text-muted-foreground/60">More algorithms soon.</span>
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:bg-muted/50 data-[active]:bg-muted/50 data-[state=open]:bg-muted/50">Mathematics</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                    <ListItem href="/pi" title="Flow of Pi">
                      Experience the infinite stream of Pi.
                    </ListItem>
                    <ListItem href="#" title="Fourier Series" titleClassName="text-muted-foreground">
                      <span className="text-muted-foreground/60">Coming Soon: Wave visuals.</span>
                    </ListItem>
                    <ListItem href="#" title="Fractals" titleClassName="text-muted-foreground">
                      <span className="text-muted-foreground/60">Coming Soon: Mandelbrot set.</span>
                    </ListItem>
                    <ListItem href="#" title="Prime Spirals" titleClassName="text-muted-foreground">
                      <span className="text-muted-foreground/60">Coming Soon: Ulam spiral.</span>
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right: Actions */}
        <div className="flex w-[200px] justify-end items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50 rounded-md"
          >
            <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { titleClassName?: string }
>(({ className, title, children, titleClassName, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent/50 focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className={cn("text-sm font-medium leading-none", titleClassName)}>{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';
