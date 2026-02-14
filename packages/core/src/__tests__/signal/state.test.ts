import { describe, it, expect } from "vitest";
import { createReactiveSystem } from "../../signal/system";

describe("ReactiveState (signal)", () => {
  it("should create signal with initial value", () => {
    const system = createReactiveSystem();
    const s = system.signal(42);
    expect(s.get()).toBe(42);
  });

  it("should update value with set()", () => {
    const system = createReactiveSystem();
    const s = system.signal(1);
    s.set(2);
    expect(s.get()).toBe(2);
  });

  it("should skip update when value is equal (Object.is)", () => {
    const system = createReactiveSystem();
    const s = system.signal(1);
    const calls: number[] = [];
    system.effect(() => {
      calls.push(s.get());
    });
    expect(calls).toEqual([1]);
    s.set(1); // same value
    expect(calls).toEqual([1]); // no re-run
  });

  it("should use custom equals function", () => {
    const system = createReactiveSystem();
    const s = system.signal(
      { x: 1, y: 2 },
      { equals: (a, b) => a.x === b.x && a.y === b.y }
    );
    const calls: any[] = [];
    system.effect(() => {
      calls.push(s.get());
    });
    expect(calls.length).toBe(1);
    s.set({ x: 1, y: 2 }); // equal by custom fn
    expect(calls.length).toBe(1);
    s.set({ x: 2, y: 2 }); // different
    expect(calls.length).toBe(2);
  });

  it("should distinguish NaN correctly with Object.is", () => {
    const system = createReactiveSystem();
    const s = system.signal(NaN);
    const calls: number[] = [];
    system.effect(() => {
      calls.push(s.get());
    });
    expect(calls.length).toBe(1);
    s.set(NaN); // Object.is(NaN, NaN) === true
    expect(calls.length).toBe(1);
  });

  it("should notify subscribers synchronously", () => {
    const system = createReactiveSystem();
    const s = system.signal(0);
    const log: string[] = [];
    system.effect(() => {
      log.push(`effect: ${s.get()}`);
    });
    log.push("before set");
    s.set(1);
    log.push("after set");
    expect(log).toEqual(["effect: 0", "before set", "effect: 1", "after set"]);
  });
});
