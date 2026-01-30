import { AtomStore } from "./atomStore";
import { AtomListener, Subscription } from "./types";

export class ContextQueryStore<TAtoms extends Record<string, any>> {
  private atoms: Map<keyof TAtoms, AtomStore<any>>;
  private cachedSnapshot: TAtoms | null = null;
  private snapshotStale: boolean = true;

  constructor(initialValues: TAtoms) {
    this.atoms = new Map();

    Object.entries(initialValues).forEach(([key, value]) => {
      const atomStore = new AtomStore(value);
      this.atoms.set(key as keyof TAtoms, atomStore);

      atomStore.subscribe(() => {
        this.snapshotStale = true;
      });
    });
  }

  private getAtom<TKey extends keyof TAtoms>(key: TKey): AtomStore<TAtoms[TKey]> {
    const atomStore = this.atoms.get(key);
    if (!atomStore) {
      throw new Error(`Atom with key "${String(key)}" not found`);
    }
    return atomStore;
  }

  public getAtomValue<TKey extends keyof TAtoms>(key: TKey): TAtoms[TKey] {
    return this.getAtom(key).getValue();
  }

  public setAtomValue<TKey extends keyof TAtoms>(
    key: TKey,
    value: TAtoms[TKey]
  ): void {
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
