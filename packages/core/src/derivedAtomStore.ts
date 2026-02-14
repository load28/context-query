import { AtomListener, Subscription } from "./types";
import type { ReactiveSystem } from "./signal/system";
import type { ReactiveComputed } from "./signal/computed";
import { createReactiveSystem } from "./signal/system";

let _defaultSystem: ReactiveSystem | null = null;
function getDefaultSystem(): ReactiveSystem {
  if (!_defaultSystem) _defaultSystem = createReactiveSystem();
  return _defaultSystem;
}

export class DerivedAtomStore<T> {
  private comp: ReactiveComputed<T>;
  private listeners: Set<AtomListener> = new Set();
  private depUnsubscribes: Subscription[] = [];
  private computing: boolean = false;
  private trackedDeps: Set<string> = new Set();
  private pendingNotification: boolean = false;
  private onError?: (error: Error) => void;
  private resolveStoreFn: (key: string) => {
    getValue(): any;
    subscribe(listener: AtomListener): Subscription;
  };

  constructor(
    readFn: (get: (key: string) => any) => T,
    resolveStore: (key: string) => {
      getValue(): any;
      subscribe(listener: AtomListener): Subscription;
    },
    onError?: (error: Error) => void,
    system?: ReactiveSystem
  ) {
    this.onError = onError;
    this.resolveStoreFn = resolveStore;
    const sys = system ?? getDefaultSystem();

    this.comp = sys.computed(() => {
      if (this.computing) {
        throw new Error('Circular dependency detected in derived atom');
      }
      this.computing = true;
      const newDeps = new Set<string>();
      const get = (key: string) => {
        newDeps.add(key);
        return this.resolveStoreFn(key).getValue();
      };
      try {
        const result = readFn(get);
        this.trackedDeps = newDeps;
        return result;
      } catch (e) {
        this.trackedDeps = newDeps;
        // Call onError for non-circular errors
        if (this.onError && !(e instanceof Error && e.message.includes('Circular dependency'))) {
          this.onError(e instanceof Error ? e : new Error(String(e)));
        }
        throw e;
      } finally {
        this.computing = false;
      }
    });
  }

  /**
   * Called after all stores are registered in ContextQueryStore.
   * Computes the initial value and sets up dependency subscriptions.
   */
  initialize(): void {
    // Force initial computation
    this.comp.get();

    // Circular dependency errors must propagate — they are fatal
    if (this.comp.error && this.comp.error.message.includes('Circular dependency')) {
      throw this.comp.error;
    }

    // Set up external subscriptions for push notifications
    this.setupExternalSubscriptions();
  }

  private setupExternalSubscriptions(): void {
    for (const sub of this.depUnsubscribes) {
      sub.unsubscribe();
    }
    this.depUnsubscribes = [];

    for (const dep of this.trackedDeps) {
      const store = this.resolveStoreFn(dep);
      const sub = store.subscribe(() => this.markDirty());
      this.depUnsubscribes.push(sub);
    }
  }

  private markDirty(): void {
    if (this.pendingNotification) return;
    this.pendingNotification = true;
    // Snapshot listeners to prevent mutation during iteration
    const snapshot = [...this.listeners];
    snapshot.forEach((listener) => listener());
  }

  public getValue(): T {
    // Force lazy recomputation via signal graph
    const value = this.comp.get();
    this.pendingNotification = false;

    // Check if deps changed (dynamic dependency tracking)
    // Re-subscribe if needed
    // Note: trackedDeps is updated inside the computed function on recomputation

    if (this.comp.error) {
      throw this.comp.error;
    }
    return value;
  }

  public hasError(): boolean {
    this.comp.get();
    this.pendingNotification = false;
    return this.comp.error !== null;
  }

  public getError(): Error | null {
    this.comp.get();
    this.pendingNotification = false;
    return this.comp.error;
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
