import type { ReactiveNode, Link, SignalOptions } from "./types";
import { ReactiveFlags } from "./types";
import { linkDep, unlinkDep } from "./link";
import { propagate, checkDirty } from "./propagate";
import type { ReactiveState } from "./state";
import type { ReactiveComputed } from "./computed";
import type { ReactiveEffect } from "./effect";

export interface ReactiveSystem {
  signal<T>(initialValue: T, options?: SignalOptions<T>): ReactiveState<T>;
  computed<T>(fn: () => T, options?: SignalOptions<T>): ReactiveComputed<T>;
  effect(fn: () => void | (() => void)): ReactiveEffect;
  batch(fn: () => void): void;
}

export function createReactiveSystem(): ReactiveSystem {
  let activeEffect: ReactiveNode | null = null;
  let batchDepth = 0;
  let pendingEffects: Set<ReactiveEffect> = new Set();

  function track(dep: ReactiveNode): void {
    if (activeEffect) {
      linkDep(dep, activeEffect);
    }
  }

  function collectEffect(
    collected: ReactiveEffect[],
    node: ReactiveNode
  ): void {
    collected.push(node as unknown as ReactiveEffect);
  }

  function scheduleEffects(effects: ReactiveEffect[]): void {
    if (batchDepth > 0) {
      for (const eff of effects) {
        pendingEffects.add(eff);
      }
    } else {
      for (const eff of effects) {
        if (eff._active) {
          eff.run();
        }
      }
    }
  }

  function signal<T>(
    initialValue: T,
    options?: SignalOptions<T>
  ): ReactiveState<T> {
    const equals = options?.equals ?? Object.is;

    const state = {
      flags: ReactiveFlags.Mutable,
      deps: null as Link | null,
      subs: null as Link | null,
      _value: initialValue,
      _equals: equals,
      get(): T {
        track(state);
        return state._value;
      },
      set(value: T): void {
        if (equals(state._value, value)) {
          return;
        }
        state._value = value;
        if (state.subs) {
          const collected: ReactiveEffect[] = [];
          propagate(state, (node) => collectEffect(collected, node));
          scheduleEffects(collected);
        }
      },
    } as ReactiveState<T>;

    return state;
  }

  function computed<T>(
    fn: () => T,
    options?: SignalOptions<T>
  ): ReactiveComputed<T> {
    const equals = options?.equals ?? Object.is;

    const comp = {
      flags: ReactiveFlags.Dirty,
      deps: null as Link | null,
      subs: null as Link | null,
      _value: undefined as T | undefined,
      _fn: fn,
      _equals: equals,
      _version: 0,
      error: null as Error | null,
      get(): T {
        track(comp);
        if ((comp.flags & ReactiveFlags.Dirty) !== 0) {
          comp.update();
        } else if ((comp.flags & ReactiveFlags.Pending) !== 0) {
          if (checkDirty(comp)) {
            comp.update();
          }
        }
        return comp._value as T;
      },
      update(): void {
        const prevActive = activeEffect;
        // Clear existing deps
        let link = comp.deps;
        while (link) {
          const next = link.nextDep;
          unlinkDep(link);
          link = next;
        }
        comp.deps = null;

        activeEffect = comp;
        let newValue: T;
        try {
          newValue = fn();
          comp.error = null;
        } catch (e) {
          comp.error = e instanceof Error ? e : new Error(String(e));
          comp.flags &= ~(ReactiveFlags.Dirty | ReactiveFlags.Pending);
          activeEffect = prevActive;
          return;
        }
        activeEffect = prevActive;

        const oldValue = comp._value;
        if (oldValue === undefined || !equals(oldValue, newValue)) {
          comp._value = newValue;
          comp._version++;
          comp.flags &= ~(ReactiveFlags.Dirty | ReactiveFlags.Pending);
          // Value changed — mark direct subs as Dirty
          if (comp.subs) {
            let sub = comp.subs;
            while (sub) {
              sub.sub.flags |= ReactiveFlags.Dirty;
              sub.sub.flags &= ~ReactiveFlags.Pending;
              sub = sub.nextSub;
            }
          }
        } else {
          comp.flags &= ~(ReactiveFlags.Dirty | ReactiveFlags.Pending);
        }
      },
    } as ReactiveComputed<T>;

    return comp;
  }

  function effect(fn: () => void | (() => void)): ReactiveEffect {
    const eff = {
      flags: ReactiveFlags.Dirty | ReactiveFlags.Watching,
      deps: null as Link | null,
      subs: null as Link | null,
      _fn: fn,
      _cleanup: null as (() => void) | null,
      _active: true,
      run(): void {
        if (!eff._active) return;

        if (eff._cleanup) {
          eff._cleanup();
          eff._cleanup = null;
        }

        // Clear deps and re-track
        let link = eff.deps;
        while (link) {
          const next = link.nextDep;
          unlinkDep(link);
          link = next;
        }
        eff.deps = null;

        const prevActive = activeEffect;
        activeEffect = eff;
        try {
          const cleanup = fn();
          if (typeof cleanup === "function") {
            eff._cleanup = cleanup;
          }
        } finally {
          activeEffect = prevActive;
        }

        eff.flags &= ~(ReactiveFlags.Dirty | ReactiveFlags.Pending);
      },
      dispose(): void {
        eff._active = false;
        if (eff._cleanup) {
          eff._cleanup();
          eff._cleanup = null;
        }
        let link = eff.deps;
        while (link) {
          const next = link.nextDep;
          unlinkDep(link);
          link = next;
        }
        eff.deps = null;
        eff.flags &= ~ReactiveFlags.Watching;
      },
    } as ReactiveEffect;

    // Run immediately to establish initial deps
    eff.run();

    return eff;
  }

  function batch(fn: () => void): void {
    batchDepth++;
    try {
      fn();
    } finally {
      batchDepth--;
      if (batchDepth === 0) {
        flushEffects();
      }
    }
  }

  function flushEffects(): void {
    while (pendingEffects.size > 0) {
      const effects = pendingEffects;
      pendingEffects = new Set();
      for (const eff of effects) {
        if (eff._active) {
          eff.run();
        }
      }
    }
  }

  return { signal, computed, effect, batch };
}
