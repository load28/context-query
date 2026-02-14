import { describe, it, expect } from "vitest";
import { createReactiveSystem } from "../../signal/system";

describe("ReactiveEffect (effect)", () => {
  it("should run immediately", () => {
    const system = createReactiveSystem();
    let ran = false;
    system.effect(() => {
      ran = true;
    });
    expect(ran).toBe(true);
  });

  it("should track dependencies and re-run on change", () => {
    const system = createReactiveSystem();
    const s = system.signal(1);
    const values: number[] = [];
    system.effect(() => {
      values.push(s.get());
    });
    expect(values).toEqual([1]);
    s.set(2);
    expect(values).toEqual([1, 2]);
    s.set(3);
    expect(values).toEqual([1, 2, 3]);
  });

  it("should track computed dependencies", () => {
    const system = createReactiveSystem();
    const a = system.signal(1);
    const doubled = system.computed(() => a.get() * 2);
    const values: number[] = [];
    system.effect(() => {
      values.push(doubled.get());
    });
    expect(values).toEqual([2]);
    a.set(5);
    expect(values).toEqual([2, 10]);
  });

  it("should dispose and stop tracking", () => {
    const system = createReactiveSystem();
    const s = system.signal(1);
    const values: number[] = [];
    const eff = system.effect(() => {
      values.push(s.get());
    });
    expect(values).toEqual([1]);
    eff.dispose();
    s.set(2);
    expect(values).toEqual([1]); // no re-run after dispose
  });

  it("should call cleanup function", () => {
    const system = createReactiveSystem();
    const s = system.signal(1);
    const cleanups: number[] = [];
    system.effect(() => {
      const val = s.get();
      return () => {
        cleanups.push(val);
      };
    });
    expect(cleanups).toEqual([]);
    s.set(2); // previous cleanup runs
    expect(cleanups).toEqual([1]);
    s.set(3);
    expect(cleanups).toEqual([1, 2]);
  });

  it("should update dependency tracking on re-run (conditional deps)", () => {
    const system = createReactiveSystem();
    const toggle = system.signal(true);
    const a = system.signal(1);
    const b = system.signal(2);
    const values: number[] = [];

    system.effect(() => {
      if (toggle.get()) {
        values.push(a.get());
      } else {
        values.push(b.get());
      }
    });

    expect(values).toEqual([1]);
    a.set(10);
    expect(values).toEqual([1, 10]);
    b.set(20); // b is not tracked yet
    expect(values).toEqual([1, 10]);

    toggle.set(false); // now tracks b instead of a
    expect(values).toEqual([1, 10, 20]);
    a.set(100); // a is no longer tracked
    expect(values).toEqual([1, 10, 20]);
    b.set(30);
    expect(values).toEqual([1, 10, 20, 30]);
  });
});
