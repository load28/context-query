import { describe, it, expect } from "vitest";
import { createReactiveSystem } from "../../signal/system";

describe("Diamond Problem", () => {
  it("should compute D exactly once in A → B, C → D pattern", () => {
    const system = createReactiveSystem();
    let dComputeCount = 0;

    const A = system.signal(1);
    const B = system.computed(() => A.get() * 2);
    const C = system.computed(() => A.get() * 3);
    const D = system.computed(() => {
      dComputeCount++;
      return B.get() + C.get();
    });

    expect(D.get()).toBe(5); // 2 + 3
    expect(dComputeCount).toBe(1);

    dComputeCount = 0;
    A.set(2);
    expect(D.get()).toBe(10); // 4 + 6
    expect(dComputeCount).toBe(1); // exactly once!
  });

  it("should handle nested diamond: A → B → D, A → C → D, D → E", () => {
    const system = createReactiveSystem();
    let eComputeCount = 0;

    const A = system.signal(1);
    const B = system.computed(() => A.get() + 1);
    const C = system.computed(() => A.get() + 2);
    const D = system.computed(() => B.get() + C.get());
    const E = system.computed(() => {
      eComputeCount++;
      return D.get() * 10;
    });

    expect(E.get()).toBe(50); // (2 + 3) * 10
    expect(eComputeCount).toBe(1);

    eComputeCount = 0;
    A.set(10);
    expect(E.get()).toBe(230); // (11 + 12) * 10
    expect(eComputeCount).toBe(1);
  });

  it("should skip recomputation when dependency value hasn't changed", () => {
    const system = createReactiveSystem();
    let bComputeCount = 0;
    let cComputeCount = 0;

    const A = system.signal(1);
    const B = system.computed(() => {
      bComputeCount++;
      return A.get() > 0 ? "positive" : "non-positive";
    });
    const C = system.computed(() => {
      cComputeCount++;
      return B.get().toUpperCase();
    });

    expect(C.get()).toBe("POSITIVE");
    expect(bComputeCount).toBe(1);
    expect(cComputeCount).toBe(1);

    bComputeCount = 0;
    cComputeCount = 0;

    A.set(2); // still positive — B returns same value
    expect(C.get()).toBe("POSITIVE");
    expect(bComputeCount).toBe(1); // B recalculated
    expect(cComputeCount).toBe(0); // C skipped — B's value unchanged
  });

  it("should handle multiple diamond merges", () => {
    const system = createReactiveSystem();
    //  A
    // / \
    // B   C
    // \ / \ /
    //  D   E
    //   \ /
    //    F
    let fCount = 0;

    const A = system.signal(1);
    const B = system.computed(() => A.get() + 1);
    const C = system.computed(() => A.get() + 2);
    const D = system.computed(() => B.get() + C.get());
    const E = system.computed(() => B.get() - C.get());
    const F = system.computed(() => {
      fCount++;
      return D.get() + E.get();
    });

    expect(F.get()).toBe(4 + -1 + 1); // D=5, E=-1 → wait
    // A=1, B=2, C=3, D=5, E=-1, F=4
    expect(F.get()).toBe(4);
    expect(fCount).toBe(1);

    fCount = 0;
    A.set(10);
    // B=11, C=12, D=23, E=-1, F=22
    expect(F.get()).toBe(22);
    expect(fCount).toBe(1);
  });

  it("should work with effects in diamond pattern", () => {
    const system = createReactiveSystem();
    const log: number[] = [];

    const A = system.signal(1);
    const B = system.computed(() => A.get() * 2);
    const C = system.computed(() => A.get() * 3);

    system.effect(() => {
      log.push(B.get() + C.get());
    });

    expect(log).toEqual([5]); // initial

    A.set(2);
    expect(log).toEqual([5, 10]); // B=4, C=6 → 10
  });
});
