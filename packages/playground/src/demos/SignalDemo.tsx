import { useState, useCallback, useRef } from "react";
import { createReactiveSystem } from "@context-query/core";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

function DiamondDemo() {
  const [result, setResult] = useState<{
    value: number;
    computeCount: number;
    timeMs: number;
  } | null>(null);

  const run = useCallback(() => {
    const system = createReactiveSystem();
    let dCount = 0;

    const A = system.signal(1);
    const B = system.computed(() => A.get() * 2);
    const C = system.computed(() => A.get() * 3);
    const D = system.computed(() => {
      dCount++;
      return B.get() + C.get();
    });

    // Initial computation
    D.get();
    dCount = 0;

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      A.set(i);
      D.get();
    }
    const elapsed = performance.now() - start;

    setResult({
      value: D.get(),
      computeCount: dCount,
      timeMs: Math.round(elapsed * 100) / 100,
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Diamond Problem Resolution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground font-mono bg-secondary/50 rounded-lg p-3">
          <div>A(signal) → B(A*2), C(A*3) → D(B+C)</div>
          <div className="mt-1 text-muted-foreground/70">D should compute exactly once per A change</div>
        </div>
        <Button size="sm" onClick={run}>
          Run 10K iterations
        </Button>
        {result && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary rounded-lg p-2">
              <div className="text-lg font-bold text-primary font-mono">{result.computeCount}</div>
              <div className="text-[10px] text-muted-foreground">D computes</div>
            </div>
            <div className="bg-secondary rounded-lg p-2">
              <div className="text-lg font-bold text-green-400 font-mono">{result.value}</div>
              <div className="text-[10px] text-muted-foreground">Final D</div>
            </div>
            <div className="bg-secondary rounded-lg p-2">
              <div className="text-lg font-bold text-amber-400 font-mono">{result.timeMs}ms</div>
              <div className="text-[10px] text-muted-foreground">Time</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeepChainDemo() {
  const [result, setResult] = useState<{
    depth: number;
    value: number;
    timeMs: number;
  } | null>(null);

  const run = useCallback(() => {
    const system = createReactiveSystem();
    const source = system.signal(0);
    let current: { get(): number } = source;

    for (let i = 0; i < 100; i++) {
      const prev = current;
      current = system.computed(() => prev.get() + 1);
    }
    current.get(); // initial

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      source.set(i);
      current.get();
    }
    const elapsed = performance.now() - start;

    setResult({
      depth: 100,
      value: current.get(),
      timeMs: Math.round(elapsed * 100) / 100,
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Deep Chain (Non-recursive)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground font-mono bg-secondary/50 rounded-lg p-3">
          <div>S → C₁ → C₂ → ... → C₁₀₀</div>
          <div className="mt-1 text-muted-foreground/70">100 depth, no stack overflow (iterative loop)</div>
        </div>
        <Button size="sm" onClick={run}>
          Run 1K propagations
        </Button>
        {result && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary rounded-lg p-2">
              <div className="text-lg font-bold text-primary font-mono">{result.depth}</div>
              <div className="text-[10px] text-muted-foreground">Depth</div>
            </div>
            <div className="bg-secondary rounded-lg p-2">
              <div className="text-lg font-bold text-green-400 font-mono">{result.value}</div>
              <div className="text-[10px] text-muted-foreground">Final value</div>
            </div>
            <div className="bg-secondary rounded-lg p-2">
              <div className="text-lg font-bold text-amber-400 font-mono">{result.timeMs}ms</div>
              <div className="text-[10px] text-muted-foreground">Time</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EffectBatchDemo() {
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<string[]>([]);

  const run = useCallback(() => {
    const system = createReactiveSystem();
    const a = system.signal(1);
    const b = system.signal(2);
    const entries: string[] = [];

    system.effect(() => {
      entries.push(`effect: a=${a.get()}, b=${b.get()}, sum=${a.get() + b.get()}`);
    });

    entries.push("--- batch start ---");
    system.batch(() => {
      a.set(10);
      entries.push("(set a=10, effect deferred)");
      b.set(20);
      entries.push("(set b=20, effect deferred)");
    });
    entries.push("--- batch end ---");

    logRef.current = entries;
    setLog([...entries]);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Effect & Batch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground font-mono bg-secondary/50 rounded-lg p-3">
          <div>batch: set a=10, set b=20 → effect runs once after batch</div>
        </div>
        <Button size="sm" onClick={run}>
          Run demo
        </Button>
        {log.length > 0 && (
          <div className="bg-secondary/50 rounded-lg p-3 space-y-0.5">
            {log.map((entry, i) => (
              <div
                key={i}
                className={`text-xs font-mono ${
                  entry.startsWith("effect:")
                    ? "text-green-400"
                    : entry.startsWith("---")
                    ? "text-amber-400"
                    : "text-muted-foreground"
                }`}
              >
                {entry}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SignalDemo() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Signal Engine
        </h2>
        <p className="text-xs text-muted-foreground">
          Push-pull hybrid reactive engine inspired by Alien Signals / TC39 Signals
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <DiamondDemo />
        <DeepChainDemo />
      </div>
      <EffectBatchDemo />
    </div>
  );
}
