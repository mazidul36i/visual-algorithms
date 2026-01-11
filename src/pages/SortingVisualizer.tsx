import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

type SortAlgorithm = 'bubble' | 'merge';

interface ArrayBar {
  value: number;
  state: 'default' | 'comparing' | 'sorted' | 'pivot';
}

const SortingVisualizer = () => {
  const [array, setArray] = useState<ArrayBar[]>([]);
  const [arraySize, setArraySize] = useState(30);
  const [speed, setSpeed] = useState(50);
  const [algorithm, setAlgorithm] = useState<SortAlgorithm>('bubble');
  const [isSorting, setIsSorting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);
  const sortingRef = useRef(false);

  const generateArray = useCallback(() => {
    const newArray: ArrayBar[] = [];
    for (let i = 0; i < arraySize; i++) {
      newArray.push({
        value: Math.floor(Math.random() * 85) + 15,
        state: 'default',
      });
    }
    setArray(newArray);
  }, [arraySize]);

  useEffect(() => {
    generateArray();
  }, [generateArray]);

  const sleep = (ms: number) => {
    return new Promise<void>((resolve) => {
      const checkPause = () => {
        if (!sortingRef.current) {
          resolve();
          return;
        }
        if (pausedRef.current) {
          setTimeout(checkPause, 50);
        } else {
          setTimeout(resolve, ms);
        }
      };
      checkPause();
    });
  };

  const bubbleSort = async () => {
    const arr = [...array];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (!sortingRef.current) return;

        arr[j].state = 'comparing';
        arr[j + 1].state = 'comparing';
        setArray([...arr]);

        await sleep(101 - speed);

        if (arr[j].value > arr[j + 1].value) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }

        arr[j].state = 'default';
        arr[j + 1].state = 'default';
        setArray([...arr]);
      }
      arr[n - i - 1].state = 'sorted';
      setArray([...arr]);
    }
    arr[0].state = 'sorted';
    setArray([...arr]);
  };

  const mergeSort = async () => {
    const arr = [...array];

    const merge = async (start: number, mid: number, end: number) => {
      if (!sortingRef.current) return;

      const left = arr.slice(start, mid + 1);
      const right = arr.slice(mid + 1, end + 1);
      let i = 0, j = 0, k = start;

      while (i < left.length && j < right.length) {
        if (!sortingRef.current) return;

        arr[k].state = 'comparing';
        setArray([...arr]);
        await sleep(101 - speed);

        if (left[i].value <= right[j].value) {
          arr[k] = { ...left[i], state: 'pivot' };
          i++;
        } else {
          arr[k] = { ...right[j], state: 'pivot' };
          j++;
        }
        setArray([...arr]);
        await sleep(101 - speed);
        arr[k].state = 'default';
        k++;
      }

      while (i < left.length) {
        if (!sortingRef.current) return;
        arr[k] = { ...left[i], state: 'default' };
        setArray([...arr]);
        await sleep(51 - speed / 2);
        i++;
        k++;
      }

      while (j < right.length) {
        if (!sortingRef.current) return;
        arr[k] = { ...right[j], state: 'default' };
        setArray([...arr]);
        await sleep(51 - speed / 2);
        j++;
        k++;
      }
    };

    const sort = async (start: number, end: number) => {
      if (start >= end || !sortingRef.current) return;
      const mid = Math.floor((start + end) / 2);
      await sort(start, mid);
      await sort(mid + 1, end);
      await merge(start, mid, end);
    };

    await sort(0, arr.length - 1);

    for (let i = 0; i < arr.length; i++) {
      arr[i].state = 'sorted';
    }
    setArray([...arr]);
  };

  const startSorting = async () => {
    setIsSorting(true);
    sortingRef.current = true;
    pausedRef.current = false;
    setIsPaused(false);

    if (algorithm === 'bubble') {
      await bubbleSort();
    } else {
      await mergeSort();
    }

    setIsSorting(false);
    sortingRef.current = false;
  };

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setIsPaused(!isPaused);
  };

  const reset = () => {
    sortingRef.current = false;
    setIsSorting(false);
    setIsPaused(false);
    pausedRef.current = false;
    generateArray();
  };

  const getBarColor = (state: ArrayBar['state']) => {
    switch (state) {
      case 'comparing':
        return 'bg-chart-4';
      case 'sorted':
        return 'bg-primary';
      case 'pivot':
        return 'bg-accent';
      default:
        return 'bg-muted-foreground/40';
    }
  };

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="glass-strong border-b border-border">
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
              Sorting Algorithms
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Controls */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap items-center gap-6">
            {/* Algorithm Selection */}
            <div className="flex gap-2">
              <Button
                variant={algorithm === 'bubble' ? 'default' : 'outline'}
                onClick={() => !isSorting && setAlgorithm('bubble')}
                disabled={isSorting}
                className="font-medium"
              >
                Bubble Sort
              </Button>
              <Button
                variant={algorithm === 'merge' ? 'default' : 'outline'}
                onClick={() => !isSorting && setAlgorithm('merge')}
                disabled={isSorting}
                className="font-medium"
              >
                Merge Sort
              </Button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-3 min-w-48">
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

            {/* Size Control */}
            <div className="flex items-center gap-3 min-w-48">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Size</span>
              <Slider
                value={[arraySize]}
                onValueChange={(v) => !isSorting && setArraySize(v[0])}
                min={10}
                max={100}
                step={5}
                disabled={isSorting}
                className="flex-1"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={reset}
                disabled={false}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={generateArray}
                disabled={isSorting}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              {isSorting ? (
                <Button onClick={togglePause} size="icon">
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
              ) : (
                <Button onClick={startSorting} className="gap-2">
                  <Play className="w-4 h-4" />
                  Start
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="glass rounded-2xl p-8">
          <div className="flex items-end justify-center gap-[2px] h-[400px]">
            {array.map((bar, idx) => (
              <div
                key={idx}
                className={cn(
                  'transition-all duration-75 rounded-t-sm',
                  getBarColor(bar.state)
                )}
                style={{
                  height: `${bar.value}%`,
                  width: `${Math.max(100 / array.length - 0.5, 2)}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted-foreground/40" />
            <span className="text-sm text-muted-foreground">Unsorted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-chart-4" />
            <span className="text-sm text-muted-foreground">Comparing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-accent" />
            <span className="text-sm text-muted-foreground">Pivot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span className="text-sm text-muted-foreground">Sorted</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SortingVisualizer;
