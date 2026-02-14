import { bench, describe } from "vitest";
import { ContextQueryStore } from "../contextQueryStore";
import { derived } from "../derived";

describe("Store Operations Benchmark", () => {
  bench("Atom read/write (1K ops)", () => {
    const store = new ContextQueryStore({ count: 0 });
    for (let i = 0; i < 1000; i++) {
      store.setAtomValue("count", i);
      store.getAtomValue("count");
    }
  });

  bench("Derived atom recomputation (1K changes)", () => {
    const store = new ContextQueryStore({
      a: 0,
      doubled: derived((get) => get("a") * 2),
    });
    for (let i = 0; i < 1000; i++) {
      store.setAtomValue("a", i);
      store.getAtomValue("doubled");
    }
  });

  bench("Diamond derived (A→B,C→D) 1K changes", () => {
    const store = new ContextQueryStore({
      a: 0,
      b: derived((get) => get("a") * 2),
      c: derived((get) => get("a") * 3),
      d: derived((get) => get("b") + get("c")),
    });
    for (let i = 0; i < 1000; i++) {
      store.setAtomValue("a", i);
      store.getAtomValue("d");
    }
  });

  bench("Snapshot generation (10 atoms, 1K reads)", () => {
    const init: Record<string, number> = {};
    for (let i = 0; i < 10; i++) init[`a${i}`] = i;
    const store = new ContextQueryStore(init);

    for (let i = 0; i < 1000; i++) {
      store.setAtomValue("a0", i);
      store.getSnapshot();
    }
  });

  bench("Patch batch update (5 atoms)", () => {
    const store = new ContextQueryStore({
      a: 0, b: 0, c: 0, d: 0, e: 0,
    });
    for (let i = 0; i < 1000; i++) {
      store.patch({ a: i, b: i + 1, c: i + 2, d: i + 3, e: i + 4 });
    }
  });

  bench("Subscribe/unsubscribe (1K cycles)", () => {
    const store = new ContextQueryStore({ count: 0 });
    for (let i = 0; i < 1000; i++) {
      const sub = store.subscribeToAtom("count", () => {});
      sub.unsubscribe();
    }
  });
});
