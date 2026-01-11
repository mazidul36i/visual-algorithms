import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

// First 1000 digits of Pi (after 3.)
const PI_DIGITS = '14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196442881097566593344612847564823378678316527120190914564856692346034861045432664821339360726024914127372458700660631558817488152092096282925409171536436789259036001133053054882046652138414695194151160943305727036575959195309218611738193261179310511854807446237996274956735188575272489122793818301194912983367336244065664308602139494639522473719070217986094370277053921717629317675238467481846766940513200056812714526356082778577134275778960917363717872146844090122495343014654958537105079227968925892354201995611212902196086403441815981362977477130996051870721134999999837297804995105973173281609631859502445945534690830264252230825334468503526193118817101000313783875288658753320838142061717766914730359825349042875546873115956286388235378759375195778185778053217122680661300192787661119590921642019893809525720106548586327886593615338182796823030195203530185296899577362259941389124972177528347913151557485724245415069595082953311686172785588907509838175463746493931925506040092770167113900984882401285836160356370766010471018194295559619894676783744944825537977472684710404753464620804668425906949129331367702898915210475216205696602405803815019351125338243003558764024749647326391419927260426992279678235478163600934172164121992458631503028618297455570674983850549458858692699569092721079750930295532116534498720275596023648066549911988183479775356636980742654252786255181841757467289097777279380008164706001614524919217321721477235014144197356854816136115735255213347574184946843852332390739414333454776241686251898356948556209921922218427255025425688767179049460165346680498862723279178608578438382796797668145410095388378636095068006422512520511739298489608412848862694560424196528502221066118630674427862203919494504712371378696095636437191728746776465757396241389086583264599581339047802759009';

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  digitIndex: number;
  opacity: number;
  fontSize: number;
}

const FlowOfPi = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raindropsRef = useRef<RainDrop[]>([]);
  const animationRef = useRef<number>();
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(50);
  const [density, setDensity] = useState(30);
  const isRunningRef = useRef(true);
  const speedRef = useRef(50);
  const densityRef = useRef(30);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    densityRef.current = density;
  }, [density]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createRaindrop = (): RainDrop => ({
      x: Math.random() * canvas.width,
      y: -20,
      speed: Math.random() * 3 + 2,
      digitIndex: Math.floor(Math.random() * PI_DIGITS.length),
      opacity: Math.random() * 0.5 + 0.5,
      fontSize: Math.random() * 12 + 14,
    });

    const initRaindrops = () => {
      raindropsRef.current = [];
      const count = Math.floor((canvas.width / 20) * (densityRef.current / 50));
      for (let i = 0; i < count; i++) {
        const drop = createRaindrop();
        drop.y = Math.random() * canvas.height;
        raindropsRef.current.push(drop);
      }
    };

    const draw = () => {
      if (!isRunningRef.current) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Create fade effect
      ctx.fillStyle = 'hsl(225, 25%, 6%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Adjust raindrop count based on density
      const targetCount = Math.floor((canvas.width / 20) * (densityRef.current / 50));
      while (raindropsRef.current.length < targetCount) {
        raindropsRef.current.push(createRaindrop());
      }
      while (raindropsRef.current.length > targetCount) {
        raindropsRef.current.pop();
      }

      // Draw raindrops
      raindropsRef.current.forEach((drop, index) => {
        // Draw trail
        const trailLength = 15;
        for (let i = 0; i < trailLength; i++) {
          const trailY = drop.y - i * drop.fontSize * 0.8;
          const trailDigitIndex = (drop.digitIndex - i + PI_DIGITS.length) % PI_DIGITS.length;
          const trailOpacity = drop.opacity * (1 - i / trailLength) * 0.6;

          if (trailY > 0 && trailY < canvas.height) {
            ctx.font = `${drop.fontSize}px JetBrains Mono, monospace`;
            
            // Green color with glow for primary digits
            const hue = i === 0 ? 160 : 160;
            const lightness = i === 0 ? 55 : 45;
            
            ctx.fillStyle = `hsla(${hue}, 84%, ${lightness}%, ${trailOpacity})`;
            ctx.fillText(PI_DIGITS[trailDigitIndex], drop.x, trailY);

            // Add glow effect for leading digit
            if (i === 0) {
              ctx.shadowColor = `hsla(160, 84%, 55%, 0.8)`;
              ctx.shadowBlur = 10;
              ctx.fillText(PI_DIGITS[trailDigitIndex], drop.x, trailY);
              ctx.shadowBlur = 0;
            }
          }
        }

        // Update position
        drop.y += drop.speed * (speedRef.current / 50);
        drop.digitIndex = (drop.digitIndex + 1) % PI_DIGITS.length;

        // Reset if off screen
        if (drop.y > canvas.height + 200) {
          raindropsRef.current[index] = createRaindrop();
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    resize();
    initRaindrops();
    draw();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const reset = () => {
    raindropsRef.current = [];
    setIsRunning(true);
  };

  return (
    <div className="min-h-screen bg-background dark relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ zIndex: 0 }}
      />

      {/* Header */}
      <header className="relative z-10 glass-strong border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Gallery</span>
            </Link>
            <h1 className="font-display font-bold text-xl text-foreground">
              Flow of Pi
            </h1>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="glass-strong rounded-2xl p-6 flex flex-wrap items-center gap-6">
          {/* Speed Control */}
          <div className="flex items-center gap-3 min-w-40">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Speed</span>
            <Slider
              value={[speed]}
              onValueChange={(v) => setSpeed(v[0])}
              min={10}
              max={100}
              step={10}
              className="flex-1"
            />
          </div>

          {/* Density Control */}
          <div className="flex items-center gap-3 min-w-40">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Density</span>
            <Slider
              value={[density]}
              onValueChange={(v) => setDensity(v[0])}
              min={10}
              max={100}
              step={10}
              className="flex-1"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={reset}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsRunning(!isRunning)}
              size="icon"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Pi Symbol Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
        <span className="text-[20rem] font-serif font-bold text-primary/5 select-none">
          π
        </span>
      </div>

      {/* Info */}
      <div className="absolute top-24 right-6 z-10">
        <div className="glass rounded-xl p-4 max-w-xs">
          <h3 className="font-display font-semibold text-foreground mb-2">
            The Flow of Pi
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Watch the infinite, non-repeating digits of π cascade down like digital rain. 
            Each column displays consecutive digits from different starting points.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlowOfPi;
