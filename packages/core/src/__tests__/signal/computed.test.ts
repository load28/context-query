import { describe, it, expect } from "vitest";
import { createReactiveSystem } from "../../signal/system";

describe("ReactiveComputed (computed)", () => {
  it("should compute derived value", () => {
    const system = createReactiveSystem();
    const a = system.signal(1);
    const b = system.signal(2);
    const sum = system.computed(() => a.get() + b.get());
    expect(sum.get()).toBe(3);
  });

  it("should lazy-evaluate on first get()", () => {
    const system = createReactiveSystem();
    let callCount = 0;
    const a = system.signal(1);
    const c = system.computed(() => {
      callCount++;
      return a.get() * 2;
    });
    expect(callCount).toBe(0); // not called yet
    expect(c.get()).toBe(2);
    expect(callCount).toBe(1);
  });

  it("should recompute when dependency changes", () => {
    const system = createReactiveSystem();
    const a = system.signal(1);
    const doubled = system.computed(() => a.get() * 2);
    expect(doubled.get()).toBe(2);
    a.set(5);
    expect(doubled.get()).toBe(10);
  });

  it("should not recompute if dependencies unchanged", () => {
    const system = createReactiveSystem();
    let callCount = 0;
    const a = system.signal(1);
    const c = system.computed(() => {
      callCount++;
      return a.get() * 2;
    });
    c.get(); // first compute
    expect(callCount).toBe(1);
    c.get(); // cached
    expect(callCount).toBe(1);
  });

  it("should chain computeds", () => {
    const system = createReactiveSystem();
    const a = system.signal(1);
    const b = system.computed(() => a.get() * 2);
    const c = system.computed(() => b.get() + 10);
    expect(c.get()).toBe(12);
    a.set(5);
    expect(c.get()).toBe(20);
  });

  it("should use custom equals", () => {
    const system = createReactiveSystem();
    const a = system.signal(1);
    let callCount = 0;
    const c = system.computed(() => ({ val: a.get() }), {
      equals: (x, y) => x.val === y.val,
    });
    system.effect(() => {
      c.get();
      callCount++;
    });
    expect(callCount).toBe(1);
    a.set(1); // same logical value
    // computed returns { val: 1 } both times, custom equals should prevent propagation
    // But since Object.is would see them as different objects,
    // only the custom equals prevents propagation
    expect(callCount).toBe(1);
  });

  it("should handle errors in computation", () => {
    const system = createReactiveSystem();
    const a = system.signal(0);
    const c = system.computed(() => {
      if (a.get() === 0) throw new Error("division by zero");
      return 10 / a.get();
    });
    c.get(); // triggers error
    expect(c.error).toBeInstanceOf(Error);
    expect(c.error!.message).toBe("division by zero");
    a.set(2);
    c.get();
    expect(c.error).toBeNull();
    expect(c.get()).toBe(5);
  });
});
