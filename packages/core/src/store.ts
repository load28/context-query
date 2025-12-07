import { AtomStore } from "./atom-store";
import { AtomListener, Subscription } from "./types";

export class ContextQueryStore<TAtoms extends Record<string, any>> {
  private atoms: Map<keyof TAtoms, AtomStore<any>>;

  constructor(initialValues: TAtoms) {
    this.atoms = new Map();

    Object.entries(initialValues).forEach(([key, value]) => {
      this.atoms.set(key as keyof TAtoms, new AtomStore(value));
    });
  }

  public getAtomValue<TKey extends keyof TAtoms>(key: TKey): TAtoms[TKey] {
    const atomStore = this.atoms.get(key);
    if (!atomStore) {
      throw new Error(`Atom with key "${String(key)}" not found`);
    }
    return atomStore.getValue();
  }

  public setAtomValue<TKey extends keyof TAtoms>(
    key: TKey,
    value: TAtoms[TKey]
  ): void {
    const atomStore = this.atoms.get(key);
    if (!atomStore) {
      throw new Error(`Atom with key "${String(key)}" not found`);
    }
    atomStore.setValue(value);
  }

  public subscribeToAtom<TKey extends keyof TAtoms>(
    key: TKey,
    listener: AtomListener
  ): Subscription {
    const atomStore = this.atoms.get(key);
    if (!atomStore) {
      throw new Error(`Atom with key "${String(key)}" not found`);
    }

    return atomStore.subscribe(listener);
  }

  public getAllAtomValues(): TAtoms {
    const result = {} as TAtoms;

    this.atoms.forEach((atomStore, key) => {
      result[key] = atomStore.getValue();
    });

    return result;
  }

  public updateAllAtoms(newAtoms: Partial<TAtoms>): void {
    Object.entries(newAtoms).forEach(([key, value]) => {
      const atomStore = this.atoms.get(key as keyof TAtoms);
      if (atomStore) {
        atomStore.setValue(value);
      }
    });
  }
}
