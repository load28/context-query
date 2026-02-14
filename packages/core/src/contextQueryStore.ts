import { Signal, Computed, batch } from "./signal";
import { isDerivedAtom } from "./derived";
import { isAtomConfig } from "./atom";
import { Subscription, RESET } from "./types";

export type ContextQueryStoreOptions = {
  onError?: (error: Error, context: { key?: string; type: 'derived' | 'updater' }) => void;
};

export type AtomDebugInfo = {
  value: any;
  subscriberCount: number;
  isDerived: boolean;
  dependencies?: string[];
  error?: Error | null;
};

export class ContextQueryStore<TAtoms extends Record<string, any>> {
  private signals: Map<keyof TAtoms, Signal<any> | Computed<any>>;
  private derivedKeys: Set<keyof TAtoms> = new Set();
  private initialValues: Map<keyof TAtoms, any> = new Map();
  private cachedSnapshot: TAtoms | null = null;
  private snapshotStale: boolean = true;
  private onError?: ContextQueryStoreOptions['onError'];
  private signalKeyMap: Map<Signal<any>, string> = new Map();

  constructor(
    initialValues: { [K in keyof TAtoms]: TAtoms[K] | any },
    options?: ContextQueryStoreOptions
  ) {
    this.signals = new Map();
    this.onError = options?.onError;

    const derivedEntries: Array<[string, { read: (get: (key: string) => any) => any }]> = [];

    // Phase 1: Create writable signals, collect derived definitions
    Object.entries(initialValues).forEach(([key, value]) => {
      if (isDerivedAtom(value)) {
        derivedEntries.push([key, value]);
        this.derivedKeys.add(key as keyof TAtoms);
      } else if (isAtomConfig(value)) {
        const sig = new Signal(value.initialValue, { equalityFn: value.equalityFn });
        this.signals.set(key as keyof TAtoms, sig);
        this.initialValues.set(key as keyof TAtoms, value.initialValue);
        this.signalKeyMap.set(sig, key);
      } else {
        const sig = new Signal(value);
        this.signals.set(key as keyof TAtoms, sig);
        this.initialValues.set(key as keyof TAtoms, value);
        this.signalKeyMap.set(sig, key);
      }
    });

    // Phase 2: Create computed signals
    for (const [key, config] of derivedEntries) {
      const keyOnError = this.onError
        ? (error: Error) => this.onError!(error, { key, type: 'derived' })
        : undefined;

      const readFn = () => {
        const get = (depKey: string) => {
          const sig = this.signals.get(depKey as keyof TAtoms);
          if (!sig) {
            throw new Error(`Signal with key "${depKey}" not found`);
          }
          return sig.value;
        };
        return config.read(get);
      };

      const comp = new Computed(readFn, { onError: keyOnError });
      this.signals.set(key as keyof TAtoms, comp);
    }

    // Phase 3: Initialize computed signals
    for (const key of this.derivedKeys) {
      (this.signals.get(key) as Computed<any>).initialize();
    }

    // Phase 4: Subscribe to all signals for snapshot staleness tracking
    this.signals.forEach((sig) => {
      sig.subscribe(() => {
        this.snapshotStale = true;
      });
    });
  }

  private getSignal<TKey extends keyof TAtoms>(key: TKey): Signal<TAtoms[TKey]> | Computed<TAtoms[TKey]> {
    const sig = this.signals.get(key);
    if (!sig) {
      throw new Error(`Signal with key "${String(key)}" not found`);
    }
    return sig;
  }

  public isDerivedKey(key: keyof TAtoms): boolean {
    return this.derivedKeys.has(key);
  }

  public getAtomValue<TKey extends keyof TAtoms>(key: TKey): TAtoms[TKey] {
    const sig = this.getSignal(key);
    return sig.peek();
  }

  public setAtomValue<TKey extends keyof TAtoms>(
    key: TKey,
    value: TAtoms[TKey] | RESET
  ): void {
    if (this.derivedKeys.has(key)) {
      throw new Error(`Cannot set value of derived signal "${String(key)}"`);
    }
    if (value === RESET) {
      this.resetAtom(key);
      return;
    }
    (this.getSignal(key) as Signal<TAtoms[TKey]>).value = value;
  }

  public resetAtom<TKey extends keyof TAtoms>(key: TKey): void {
    if (this.derivedKeys.has(key)) {
      throw new Error(`Cannot reset derived signal "${String(key)}"`);
    }
    (this.getSignal(key) as Signal<TAtoms[TKey]>).reset();
  }

  public resetAll(): void {
    batch(() => {
      this.initialValues.forEach((_initialValue, key) => {
        (this.getSignal(key) as Signal<any>).reset();
      });
    });
  }

  public subscribeToAtom<TKey extends keyof TAtoms>(
    key: TKey,
    listener: () => void
  ): Subscription {
    return this.getSignal(key).subscribe(listener);
  }

  public getAtomSubscriberCount<TKey extends keyof TAtoms>(key: TKey): number {
    return this.getSignal(key).getSubscriberCount();
  }

  public getAtomError<TKey extends keyof TAtoms>(key: TKey): Error | null {
    const sig = this.signals.get(key);
    if (!sig) {
      throw new Error(`Signal with key "${String(key)}" not found`);
    }
    if (this.derivedKeys.has(key)) {
      return (sig as Computed<any>).getError();
    }
    return null;
  }

  public getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    for (const key of this.derivedKeys) {
      const comp = this.signals.get(key) as Computed<any>;
      const depKeys: string[] = [];
      const deps = (comp as any)._deps as Set<Signal<any>>;
      if (deps) {
        for (const dep of deps) {
          const depKey = this.signalKeyMap.get(dep);
          if (depKey) {
            depKeys.push(depKey);
          }
        }
      }
      graph[key as string] = depKeys;
    }
    return graph;
  }

  public getDebugInfo(): Record<string, AtomDebugInfo> {
    const info: Record<string, AtomDebugInfo> = {};
    this.signals.forEach((sig, key) => {
      const isDerived = this.derivedKeys.has(key);
      const entry: AtomDebugInfo = {
        value: undefined,
        subscriberCount: sig.getSubscriberCount(),
        isDerived,
      };

      if (isDerived) {
        const comp = sig as Computed<any>;
        const depKeys: string[] = [];
        const deps = (comp as any)._deps as Set<Signal<any>>;
        if (deps) {
          for (const dep of deps) {
            const depKey = this.signalKeyMap.get(dep);
            if (depKey) {
              depKeys.push(depKey);
            }
          }
        }
        entry.dependencies = depKeys;
        entry.error = comp.getError();
        if (!entry.error) {
          entry.value = sig.peek();
        }
      } else {
        entry.value = sig.peek();
      }

      info[key as string] = entry;
    });
    return info;
  }

  public getSnapshot(): TAtoms {
    if (!this.snapshotStale && this.cachedSnapshot !== null) {
      return this.cachedSnapshot;
    }

    const result = {} as TAtoms;
    this.signals.forEach((sig, key) => {
      result[key] = sig.peek();
    });

    this.cachedSnapshot = result;
    this.snapshotStale = false;
    return result;
  }

  public patch(newAtoms: Partial<TAtoms>): void {
    batch(() => {
      Object.entries(newAtoms).forEach(([key, value]) => {
        if (this.derivedKeys.has(key as keyof TAtoms)) return;
        const sig = this.signals.get(key as keyof TAtoms);
        if (sig) {
          (sig as Signal<any>).value = value;
        }
      });
    });
  }

  public subscribe(
    callback: (values: TAtoms) => void
  ): Subscription {
    const subscriptions: Subscription[] = [];

    this.signals.forEach((sig) => {
      const sub = sig.subscribe(() => {
        callback(this.getSnapshot());
      });
      subscriptions.push(sub);
    });

    return {
      unsubscribe: () => {
        subscriptions.forEach((sub) => sub.unsubscribe());
      },
    };
  }
}
