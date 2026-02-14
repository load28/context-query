import { bench, describe } from "vitest";
import { createReactiveSystem } from "../../signal/system";

describe("Signal Engine Benchmark", () => {
  bench("1K signal reads", () => {
    const system = createReactiveSystem();
    const signals = Array.from({ length: 1000 }, (_, i) =>
      system.signal(i)
    );
    for (const s of signals) {
      s.get();
    }
  });

  bench("Signal write + propagation (1K subscribers)", () => {
    const system = createReactiveSystem();
    const source = system.signal(0);
    // Create 1000 computed nodes subscribing to source
    const computeds = Array.from({ length: 1000 }, () =>
      system.computed(() => source.get() + 1)
    );
    // Force initial computation
    for (const c of computeds) c.get();

    // Measure write + propagation
    source.set(1);
    for (const c of computeds) c.get();
  });

  bench("Diamond dependency (A→B,C→D) 1K iterations", () => {
    const system = createReactiveSystem();
    const A = system.signal(0);
    const B = system.computed(() => A.get() * 2);
    const C = system.computed(() => A.get() * 3);
    const D = system.computed(() => B.get() + C.get());

    for (let i = 0; i < 1000; i++) {
      A.set(i);
      D.get();
    }
  });

  bench("Deep chain propagation (100 depth)", () => {
    const system = createReactiveSystem();
    const source = system.signal(0);
    let current: { get(): number } = source;
    for (let i = 0; i < 100; i++) {
      const prev = current;
      current = system.computed(() => prev.get() + 1);
    }
    // Force initial
    current.get();

    // Measure
    source.set(1);
    current.get();
  });

  bench("Subscribe/unsubscribe cycle (1K effects)", () => {
    const system = createReactiveSystem();
    const source = system.signal(0);

    for (let i = 0; i < 1000; i++) {
      const eff = system.effect(() => {
        source.get();
      });
      eff.dispose();
    }
  });
});
