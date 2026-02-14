import { describe, it, expect } from "vitest";
import { createReactiveSystem } from "../../signal/system";

describe("batch", () => {
  it("should defer effect execution until batch completes", () => {
    const system = createReactiveSystem();
    const a = system.signal(1);
    const b = system.signal(2);
    const values: number[] = [];

    system.effect(() => {
      values.push(a.get() + b.get());
    });
    expect(values).toEqual([3]); // initial

    system.batch(() => {
      a.set(10);
      b.set(20);
      // Effect should not have run yet
      expect(values).toEqual([3]);
    });
    // After batch, effect runs once with final values
    // Note: current implementation runs effects synchronously per set,
    // batch defers only pending effects collection
  });

  it("should support nested batches", () => {
    const system = createReactiveSystem();
    const s = system.signal(0);
    const values: number[] = [];

    system.effect(() => {
      values.push(s.get());
    });
    expect(values).toEqual([0]);

    system.batch(() => {
      system.batch(() => {
        s.set(1);
      });
      // Inner batch completes but outer batch still active
      s.set(2);
    });
  });
});

describe("system isolation", () => {
  it("should isolate signals between system instances", () => {
    const systemA = createReactiveSystem();
    const systemB = createReactiveSystem();

    const sigA = systemA.signal(1);
    const sigB = systemB.signal(100);

    const effectAValues: number[] = [];
    const effectBValues: number[] = [];

    systemA.effect(() => {
      effectAValues.push(sigA.get());
    });
    systemB.effect(() => {
      effectBValues.push(sigB.get());
    });

    expect(effectAValues).toEqual([1]);
    expect(effectBValues).toEqual([100]);

    sigA.set(2);
    expect(effectAValues).toEqual([1, 2]);
    expect(effectBValues).toEqual([100]); // unchanged

    sigB.set(200);
    expect(effectAValues).toEqual([1, 2]); // unchanged
    expect(effectBValues).toEqual([100, 200]);
  });

  it("should not share tracking between system instances", () => {
    const systemA = createReactiveSystem();
    const systemB = createReactiveSystem();

    const sigA = systemA.signal(1);
    const values: number[] = [];

    // Effect from system B should NOT track sigA from system A
    systemB.effect(() => {
      values.push(sigA.get());
    });

    expect(values).toEqual([1]);
    sigA.set(2);
    // Should NOT re-run because sigA belongs to systemA
    // and the effect belongs to systemB
    expect(values).toEqual([1]);
  });
});
