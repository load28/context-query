import { describe, it, expect, vi } from "vitest";
import { ContextQueryStore } from "../contextQueryStore";
import { derived } from "../derived";
import { atom } from "../atom";
import { shallowEqual } from "../shallowEqual";

describe("Signal-Store Integration", () => {
  describe("signal graph propagation through stores", () => {
    it("diamond derived atoms compute correct values after change", () => {
      const computeFn = vi.fn((get: (key: string) => any) => get("b") + get("c"));
      const store = new ContextQueryStore({
        a: 1,
        b: derived((get) => get("a") * 2),
        c: derived((get) => get("a") * 3),
        d: derived(computeFn),
      });

      expect(store.getAtomValue("d")).toBe(5);
      expect(computeFn).toHaveBeenCalledTimes(1);

      computeFn.mockClear();
      store.setAtomValue("a", 10);
      expect(store.getAtomValue("d")).toBe(50);
      // Diamond problem: d should compute at most once per change
      expect(computeFn).toHaveBeenCalledTimes(1);
    });

    it("skip recomputation when intermediate computed produces same value", () => {
      const cComputeFn = vi.fn((get: (key: string) => any) =>
        get("b").toUpperCase()
      );
      const store = new ContextQueryStore({
        a: 1,
        b: derived((get) => (get("a") > 0 ? "positive" : "negative")),
        c: derived(cComputeFn),
      });

      expect(store.getAtomValue("c")).toBe("POSITIVE");
      expect(cComputeFn).toHaveBeenCalledTimes(1);

      cComputeFn.mockClear();
      store.setAtomValue("a", 2); // b still "positive"
      expect(store.getAtomValue("c")).toBe("POSITIVE");
      // c should NOT recompute because b's value didn't change
      expect(cComputeFn).toHaveBeenCalledTimes(0);
    });

    it("deep chain (A→B→C→D→E) propagates correctly", () => {
      const store = new ContextQueryStore({
        a: 1,
        b: derived((get) => get("a") + 1),
        c: derived((get) => get("b") + 1),
        d: derived((get) => get("c") + 1),
        e: derived((get) => get("d") + 1),
      });

      expect(store.getAtomValue("e")).toBe(5);
      store.setAtomValue("a", 10);
      expect(store.getAtomValue("e")).toBe(14);
    });
  });

  describe("multi-instance isolation via createReactiveSystem", () => {
    it("two ContextQueryStores do not interfere", () => {
      const store1 = new ContextQueryStore({ count: 0 });
      const store2 = new ContextQueryStore({ count: 100 });

      const listener1 = vi.fn();
      const listener2 = vi.fn();
      store1.subscribeToAtom("count", listener1);
      store2.subscribeToAtom("count", listener2);

      store1.setAtomValue("count", 1);
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).not.toHaveBeenCalled();

      store2.setAtomValue("count", 200);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener1).toHaveBeenCalledTimes(1);

      expect(store1.getAtomValue("count")).toBe(1);
      expect(store2.getAtomValue("count")).toBe(200);
    });
  });

  describe("error recovery through signal graph", () => {
    it("derived atom recovers when dependency changes to valid value", () => {
      const store = new ContextQueryStore({
        divisor: 1,
        result: derived((get) => {
          const d = get("divisor");
          if (d === 0) throw new Error("Division by zero");
          return 10 / d;
        }),
      });

      expect(store.getAtomValue("result")).toBe(10);
      store.setAtomValue("divisor", 0);
      expect(() => store.getAtomValue("result")).toThrow("Division by zero");

      // Recovery
      store.setAtomValue("divisor", 5);
      expect(store.getAtomValue("result")).toBe(2);
      expect(store.getAtomError("result")).toBeNull();
    });
  });

  describe("snapshot consistency with signal graph", () => {
    it("snapshot reflects latest computed values after change", () => {
      const store = new ContextQueryStore({
        x: 1,
        y: 2,
        sum: derived((get) => get("x") + get("y")),
      });

      store.setAtomValue("x", 10);
      const snap = store.getSnapshot();
      expect(snap).toEqual({ x: 10, y: 2, sum: 12 });
    });

    it("snapshot caching works with derived atoms", () => {
      const store = new ContextQueryStore({
        a: 1,
        doubled: derived((get) => get("a") * 2),
      });

      const s1 = store.getSnapshot();
      const s2 = store.getSnapshot();
      expect(s1).toBe(s2); // same reference (cached)

      store.setAtomValue("a", 5);
      const s3 = store.getSnapshot();
      expect(s3).not.toBe(s1);
      expect(s3).toEqual({ a: 5, doubled: 10 });
    });
  });

  describe("atom() config with signal engine", () => {
    it("custom equality prevents unnecessary derived recomputation", () => {
      const derivedFn = vi.fn((get: (key: string) => any) =>
        `Name: ${get("user").name}`
      );

      const store = new ContextQueryStore({
        user: atom({ name: "John", age: 30 }, { equalityFn: shallowEqual }),
        label: derived(derivedFn),
      });

      expect(store.getAtomValue("label")).toBe("Name: John");
      expect(derivedFn).toHaveBeenCalledTimes(1);

      derivedFn.mockClear();
      // Same structure, different reference — shallowEqual skips
      store.setAtomValue("user", { name: "John", age: 30 });
      expect(store.getAtomValue("label")).toBe("Name: John");
      // Derived should NOT recompute because user value didn't change
      expect(derivedFn).toHaveBeenCalledTimes(0);
    });
  });

  describe("batch-like behavior with patch", () => {
    it("patch triggers listeners for each changed atom", () => {
      const store = new ContextQueryStore({
        a: 0,
        b: 0,
        sum: derived((get) => get("a") + get("b")),
      });

      const sumListener = vi.fn();
      store.subscribeToAtom("sum", sumListener);

      store.patch({ a: 10, b: 20 });
      expect(store.getAtomValue("sum")).toBe(30);
      // sum listener fires for each source change (a and b)
      expect(sumListener.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
