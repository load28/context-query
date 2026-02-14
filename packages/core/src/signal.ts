import { Subscription } from "./types";

// ─── Global Tracking Context ───────────────────────────────────
let currentTracker: Set<Signal<any>> | null = null;
const trackerStack: (Set<Signal<any>> | null)[] = [];

let batchDepth = 0;
const pendingNotifications = new Set<Signal<any> | Computed<any>>();

export function startTracking(): Set<Signal<any>> {
  trackerStack.push(currentTracker);
  currentTracker = new Set();
  return currentTracker;
}

export function stopTracking(): void {
  currentTracker = trackerStack.pop() ?? null;
}

export function getCurrentTracker(): Set<Signal<any>> | null {
  return currentTracker;
}

// ─── Batch ─────────────────────────────────────────────────────
export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const toNotify = [...pendingNotifications];
      pendingNotifications.clear();
      for (const node of toNotify) {
        node._notifyListeners();
      }
    }
  }
}

// ─── Signal (Writable Reactive Value) ──────────────────────────
export type SignalOptions<T> = {
  equalityFn?: (a: T, b: T) => boolean;
};

export class Signal<T> {
  private _value: T;
  private readonly _initialValue: T;
  private _listeners: Set<() => void> = new Set();
  private _dependents: Set<Computed<any>> = new Set();
  private _equalityFn: (a: T, b: T) => boolean;

  constructor(initialValue: T, options?: SignalOptions<T>) {
    this._value = initialValue;
    this._initialValue = initialValue;
    this._equalityFn = options?.equalityFn ?? Object.is;
  }

  get value(): T {
    if (currentTracker) {
      currentTracker.add(this);
    }
    return this._value;
  }

  set value(newValue: T) {
    if (this._equalityFn(this._value, newValue)) {
      return;
    }
    this._value = newValue;

    // Mark all dependents dirty first (before notifying listeners)
    // Snapshot to prevent infinite loop if recompute modifies _dependents during iteration
    const deps = [...this._dependents];
    for (const dep of deps) {
      dep._markDirty();
    }

    if (batchDepth > 0) {
      pendingNotifications.add(this);
    } else {
      this._notifyListeners();
    }
  }

  peek(): T {
    return this._value;
  }

  getInitialValue(): T {
    return this._initialValue;
  }

  reset(): void {
    this.value = this._initialValue;
  }

  _notifyListeners(): void {
    const snapshot = [...this._listeners];
    for (const listener of snapshot) {
      listener();
    }
  }

  _addDependent(computed: Computed<any>): void {
    this._dependents.add(computed);
  }

  _removeDependent(computed: Computed<any>): void {
    this._dependents.delete(computed);
  }

  subscribe(listener: () => void): Subscription {
    this._listeners.add(listener);
    return {
      unsubscribe: () => {
        this._listeners.delete(listener);
      },
    };
  }

  getSubscriberCount(): number {
    return this._listeners.size;
  }
}

// ─── Computed (Derived Reactive Value) ─────────────────────────
export type ComputedOptions<T> = {
  equalityFn?: (a: T, b: T) => boolean;
  onError?: (error: Error) => void;
};

export class Computed<T> {
  private _cachedValue: T | undefined = undefined;
  private _dirty: boolean = true;
  private _computing: boolean = false;
  private _listeners: Set<() => void> = new Set();
  private _deps: Set<Signal<any>> = new Set();
  private _error: Error | null = null;
  private _equalityFn: (a: T, b: T) => boolean;
  private _onError?: (error: Error) => void;

  constructor(
    private _readFn: () => T,
    options?: ComputedOptions<T>
  ) {
    this._equalityFn = options?.equalityFn ?? Object.is;
    this._onError = options?.onError;
  }

  initialize(): void {
    this._recompute();
  }

  private _recompute(): void {
    if (this._computing) {
      throw new Error('Circular dependency detected in computed signal');
    }

    this._computing = true;

    // Unsubscribe from old dependencies
    for (const dep of this._deps) {
      dep._removeDependent(this);
    }

    // Track new dependencies
    const tracked = startTracking();

    try {
      const newValue = this._readFn();

      this._deps = tracked;
      this._dirty = false;
      this._error = null;

      // Subscribe to new dependencies
      for (const dep of this._deps) {
        dep._addDependent(this);
      }

      // Only notify if value actually changed
      if (this._cachedValue !== undefined && this._equalityFn(this._cachedValue, newValue)) {
        this._cachedValue = newValue;
        return;
      }

      this._cachedValue = newValue;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Circular dependency')) {
        this._deps = tracked;
        // Let finally block handle stopTracking and _computing reset
        throw err;
      }

      this._error = err instanceof Error ? err : new Error(String(err));
      this._dirty = false;
      this._deps = tracked;

      if (this._onError) {
        this._onError(this._error);
      }

      // Still subscribe to deps so we can recover
      for (const dep of this._deps) {
        dep._addDependent(this);
      }
    } finally {
      stopTracking();
      this._computing = false;
    }
  }

  _markDirty(): void {
    if (this._dirty) return;
    this._dirty = true;

    if (batchDepth > 0) {
      pendingNotifications.add(this);
    } else {
      this._notifyListeners();
    }
  }

  _notifyListeners(): void {
    const snapshot = [...this._listeners];
    for (const listener of snapshot) {
      listener();
    }
  }

  get value(): T {
    if (currentTracker) {
      // Computed can also be tracked by other computeds
      // We register the underlying signals transitively
      if (this._dirty) {
        this._recompute();
      }
      // Add our deps to current tracker so parent computed tracks them
      for (const dep of this._deps) {
        currentTracker.add(dep);
      }
    } else if (this._dirty) {
      this._recompute();
    }

    if (this._error) {
      throw this._error;
    }
    return this._cachedValue as T;
  }

  peek(): T {
    if (this._dirty) {
      this._recompute();
    }
    if (this._error) {
      throw this._error;
    }
    return this._cachedValue as T;
  }

  hasError(): boolean {
    if (this._dirty) {
      this._recompute();
    }
    return this._error !== null;
  }

  getError(): Error | null {
    if (this._dirty) {
      this._recompute();
    }
    return this._error;
  }

  getDependencyCount(): number {
    return this._deps.size;
  }

  subscribe(listener: () => void): Subscription {
    this._listeners.add(listener);
    return {
      unsubscribe: () => {
        this._listeners.delete(listener);
      },
    };
  }

  getSubscriberCount(): number {
    return this._listeners.size;
  }

  dispose(): void {
    for (const dep of this._deps) {
      dep._removeDependent(this);
    }
    this._deps.clear();
    this._listeners.clear();
  }
}

// ─── Effect ────────────────────────────────────────────────────
export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void;
  let deps = new Set<Signal<any>>();
  let disposed = false;

  const run = () => {
    if (disposed) return;

    // Run previous cleanup
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }

    // Unsubscribe from old deps
    for (const dep of deps) {
      dep._removeDependent(effectComputed);
    }

    // Track new deps
    const tracked = startTracking();
    try {
      cleanup = fn() ?? undefined;
    } finally {
      stopTracking();
    }

    deps = tracked;
    for (const dep of deps) {
      dep._addDependent(effectComputed);
    }
  };

  // Use a lightweight Computed-like object for dependency tracking
  const effectComputed = {
    _markDirty() {
      if (disposed) return;
      if (batchDepth > 0) {
        pendingNotifications.add(effectComputedAsNotifiable);
      } else {
        run();
      }
    },
    _notifyListeners() {
      run();
    },
  } as unknown as Computed<any>;

  const effectComputedAsNotifiable = effectComputed as any;
  effectComputedAsNotifiable._notifyListeners = () => run();

  // Initial run
  run();

  // Return dispose function
  return () => {
    disposed = true;
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
    for (const dep of deps) {
      dep._removeDependent(effectComputed);
    }
    deps.clear();
  };
}

// ─── Factory Functions ─────────────────────────────────────────
export function signal<T>(
  initialValue: T,
  options?: SignalOptions<T>
): Signal<T> {
  return new Signal(initialValue, options);
}

export function computed<T>(
  readFn: () => T,
  options?: ComputedOptions<T>
): Computed<T> {
  const c = new Computed(readFn, options);
  c.initialize();
  return c;
}
