import { AtomListener, Subscription } from "./types";

export class DerivedAtomStore<T> {
  private cachedValue: T | undefined = undefined;
  private dirty: boolean = true;
  private listeners: Set<AtomListener> = new Set();
  private depUnsubscribes: Subscription[] = [];
  private computing: boolean = false;
  private trackedDeps: Set<string> = new Set();
  private error: Error | null = null;
  private onError?: (error: Error) => void;

  constructor(
    private readFn: (get: (key: string) => any) => T,
    private resolveStore: (key: string) => {
      getValue(): any;
      subscribe(listener: AtomListener): Subscription;
    },
    onError?: (error: Error) => void
  ) {
    this.onError = onError;
  }

  /**
   * Called after all stores are registered in ContextQueryStore.
   * Computes the initial value and sets up dependency subscriptions.
   */
  initialize(): void {
    this.recompute();
  }

  private recompute(): void {
    if (this.computing) {
      throw new Error('Circular dependency detected in derived atom');
    }

    this.computing = true;

    // Unsubscribe from old dependencies
    for (const sub of this.depUnsubscribes) {
      sub.unsubscribe();
    }
    this.depUnsubscribes = [];

    // Track new dependencies via get() calls
    const newDeps = new Set<string>();
    const get = (key: string) => {
      newDeps.add(key);
      return this.resolveStore(key).getValue();
    };

    try {
      const newValue = this.readFn(get);
      this.cachedValue = newValue;
      this.error = null;
      this.dirty = false;
      this.trackedDeps = newDeps;

      // Subscribe to new dependencies
      for (const dep of newDeps) {
        const store = this.resolveStore(dep);
        const sub = store.subscribe(() => this.markDirty());
        this.depUnsubscribes.push(sub);
      }
    } catch (err) {
      // Circular dependency errors must propagate — they are fatal
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Circular dependency')) {
        throw err;
      }

      this.error = err instanceof Error ? err : new Error(String(err));
      this.dirty = false;
      this.trackedDeps = newDeps;

      if (this.onError) {
        this.onError(this.error);
      }

      // Still subscribe to deps so we can recover when they change
      for (const dep of newDeps) {
        const store = this.resolveStore(dep);
        const sub = store.subscribe(() => this.markDirty());
        this.depUnsubscribes.push(sub);
      }
    } finally {
      this.computing = false;
    }
  }

  private markDirty(): void {
    if (this.dirty) return;
    this.dirty = true;
    // Snapshot listeners to prevent mutation during iteration
    const snapshot = [...this.listeners];
    snapshot.forEach((listener) => listener());
  }

  public getValue(): T {
    if (this.dirty) {
      this.recompute();
    }
    if (this.error) {
      throw this.error;
    }
    return this.cachedValue as T;
  }

  public hasError(): boolean {
    if (this.dirty) {
      this.recompute();
    }
    return this.error !== null;
  }

  public getError(): Error | null {
    if (this.dirty) {
      this.recompute();
    }
    return this.error;
  }

  public setValue(_value: T): void {
    throw new Error('Cannot set value of a derived atom');
  }

  public getSubscriberCount(): number {
    return this.listeners.size;
  }

  public getDependencyKeys(): string[] {
    return [...this.trackedDeps];
  }

  public subscribe(listener: AtomListener): Subscription {
    this.listeners.add(listener);
    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      },
    };
  }
}
