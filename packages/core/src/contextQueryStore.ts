import { AtomStore } from "./atomStore";
import { DerivedAtomStore } from "./derivedAtomStore";
import { isDerivedAtom } from "./derived";
import { AtomListener, Subscription } from "./types";

type AnyStore<T = any> = {
  getValue(): T;
  setValue(value: T): void;
  subscribe(listener: AtomListener): Subscription;
};

export class ContextQueryStore<TAtoms extends Record<string, any>> {
  private atoms: Map<keyof TAtoms, AnyStore>;
  private derivedKeys: Set<keyof TAtoms> = new Set();
  private cachedSnapshot: TAtoms | null = null;
  private snapshotStale: boolean = true;

  constructor(initialValues: { [K in keyof TAtoms]: TAtoms[K] | any }) {
    this.atoms = new Map();

    const derivedEntries: Array<[string, { read: (get: (key: string) => any) => any }]> = [];

    // Phase 1: Create writable atom stores, collect derived definitions
    Object.entries(initialValues).forEach(([key, value]) => {
      if (isDerivedAtom(value)) {
        derivedEntries.push([key, value]);
        this.derivedKeys.add(key as keyof TAtoms);
      } else {
        const atomStore = new AtomStore(value);
        this.atoms.set(key as keyof TAtoms, atomStore);
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

    for (const [key, config] of derivedEntries) {
      const derivedStore = new DerivedAtomStore(config.read, resolveStore);
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
    value: TAtoms[TKey]
  ): void {
    if (this.derivedKeys.has(key)) {
      throw new Error(`Cannot set value of derived atom "${String(key)}"`);
    }
    this.getAtom(key).setValue(value);
  }

  public subscribeToAtom<TKey extends keyof TAtoms>(
    key: TKey,
    listener: AtomListener
  ): Subscription {
    return this.getAtom(key).subscribe(listener);
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
