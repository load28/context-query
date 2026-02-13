import { AtomStore } from "./atomStore";
import { DerivedAtomStore } from "./derivedAtomStore";
import { isDerivedAtom } from "./derived";
import { isAtomConfig } from "./atom";
import { AtomListener, Subscription, RESET } from "./types";

type AnyStore<T = any> = {
  getValue(): T;
  setValue(value: T): void;
  subscribe(listener: AtomListener): Subscription;
  getSubscriberCount(): number;
};

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
  private atoms: Map<keyof TAtoms, AnyStore>;
  private derivedKeys: Set<keyof TAtoms> = new Set();
  private initialValues: Map<keyof TAtoms, any> = new Map();
  private cachedSnapshot: TAtoms | null = null;
  private snapshotStale: boolean = true;
  private onError?: ContextQueryStoreOptions['onError'];

  constructor(
    initialValues: { [K in keyof TAtoms]: TAtoms[K] | any },
    options?: ContextQueryStoreOptions
  ) {
    this.atoms = new Map();
    this.onError = options?.onError;

    const derivedEntries: Array<[string, { read: (get: (key: string) => any) => any }]> = [];

    // Phase 1: Create writable atom stores, collect derived definitions
    Object.entries(initialValues).forEach(([key, value]) => {
      if (isDerivedAtom(value)) {
        derivedEntries.push([key, value]);
        this.derivedKeys.add(key as keyof TAtoms);
      } else if (isAtomConfig(value)) {
        const atomStore = new AtomStore(value.initialValue, value.equalityFn);
        this.atoms.set(key as keyof TAtoms, atomStore);
        this.initialValues.set(key as keyof TAtoms, value.initialValue);
      } else {
        const atomStore = new AtomStore(value);
        this.atoms.set(key as keyof TAtoms, atomStore);
        this.initialValues.set(key as keyof TAtoms, value);
      }
    });

    // Phase 2: Create derived atom stores (all writable stores exist now)
    const resolveStore = (depKey: string) => {
      const store = this.atoms.get(depKey as keyof TAtoms);
      if (!store) {
        throw new Error(`Atom with key "${depKey}" not found`);
      }
      return store;
    };

    const derivedOnError = this.onError
      ? (error: Error) => this.onError!(error, { type: 'derived' })
      : undefined;

    for (const [key, config] of derivedEntries) {
      const keyOnError = this.onError
        ? (error: Error) => this.onError!(error, { key, type: 'derived' })
        : undefined;
      const derivedStore = new DerivedAtomStore(config.read, resolveStore, keyOnError);
      this.atoms.set(key as keyof TAtoms, derivedStore);
    }

    // Phase 3: Initialize derived atom stores (compute initial values, set up subscriptions)
    for (const key of this.derivedKeys) {
      (this.atoms.get(key) as DerivedAtomStore<any>).initialize();
    }

    // Phase 4: Subscribe to all stores for snapshot staleness tracking
    this.atoms.forEach((store) => {
      store.subscribe(() => {
        this.snapshotStale = true;
      });
    });
  }

  private getAtom<TKey extends keyof TAtoms>(key: TKey): AnyStore<TAtoms[TKey]> {
    const atomStore = this.atoms.get(key);
    if (!atomStore) {
      throw new Error(`Atom with key "${String(key)}" not found`);
    }
    return atomStore;
  }

  public isDerivedKey(key: keyof TAtoms): boolean {
    return this.derivedKeys.has(key);
  }

  public getAtomValue<TKey extends keyof TAtoms>(key: TKey): TAtoms[TKey] {
    return this.getAtom(key).getValue();
  }

  public setAtomValue<TKey extends keyof TAtoms>(
    key: TKey,
    value: TAtoms[TKey] | RESET
  ): void {
    if (this.derivedKeys.has(key)) {
      throw new Error(`Cannot set value of derived atom "${String(key)}"`);
    }
    if (value === RESET) {
      this.resetAtom(key);
      return;
    }
    this.getAtom(key).setValue(value);
  }

  public resetAtom<TKey extends keyof TAtoms>(key: TKey): void {
    if (this.derivedKeys.has(key)) {
      throw new Error(`Cannot reset derived atom "${String(key)}"`);
    }
    const initial = this.initialValues.get(key);
    this.getAtom(key).setValue(initial);
  }

  public resetAll(): void {
    this.initialValues.forEach((initialValue, key) => {
      this.getAtom(key).setValue(initialValue);
    });
  }

  public subscribeToAtom<TKey extends keyof TAtoms>(
    key: TKey,
    listener: AtomListener
  ): Subscription {
    return this.getAtom(key).subscribe(listener);
  }

  public getAtomSubscriberCount<TKey extends keyof TAtoms>(key: TKey): number {
    return this.getAtom(key).getSubscriberCount();
  }

  public getAtomError<TKey extends keyof TAtoms>(key: TKey): Error | null {
    const store = this.atoms.get(key);
    if (!store) {
      throw new Error(`Atom with key "${String(key)}" not found`);
    }
    if (this.derivedKeys.has(key)) {
      return (store as DerivedAtomStore<any>).getError();
    }
    return null;
  }

  public getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    for (const key of this.derivedKeys) {
      const store = this.atoms.get(key) as DerivedAtomStore<any>;
      graph[key as string] = store.getDependencyKeys();
    }
    return graph;
  }

  public getDebugInfo(): Record<string, AtomDebugInfo> {
    const info: Record<string, AtomDebugInfo> = {};
    this.atoms.forEach((store, key) => {
      const isDerived = this.derivedKeys.has(key);
      const entry: AtomDebugInfo = {
        value: undefined,
        subscriberCount: store.getSubscriberCount(),
        isDerived,
      };

      if (isDerived) {
        const derivedStore = store as DerivedAtomStore<any>;
        entry.dependencies = derivedStore.getDependencyKeys();
        entry.error = derivedStore.getError();
        if (!entry.error) {
          entry.value = store.getValue();
        }
      } else {
        entry.value = store.getValue();
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
    this.atoms.forEach((atomStore, key) => {
      result[key] = atomStore.getValue();
    });

    this.cachedSnapshot = result;
    this.snapshotStale = false;
    return result;
  }

  public patch(newAtoms: Partial<TAtoms>): void {
    Object.entries(newAtoms).forEach(([key, value]) => {
      // Skip derived atoms silently
      if (this.derivedKeys.has(key as keyof TAtoms)) return;

      const atomStore = this.atoms.get(key as keyof TAtoms);
      if (atomStore) {
        atomStore.setValue(value);
      }
    });
  }

  public subscribe(
    callback: (values: TAtoms) => void
  ): Subscription {
    const subscriptions: Subscription[] = [];

    this.atoms.forEach((atomStore) => {
      const sub = atomStore.subscribe(() => {
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
