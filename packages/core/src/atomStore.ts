import { AtomListener, Subscription } from "./types";
import type { ReactiveSystem } from "./signal/system";
import type { ReactiveState } from "./signal/state";
import { createReactiveSystem } from "./signal/system";

let _defaultSystem: ReactiveSystem | null = null;
function getDefaultSystem(): ReactiveSystem {
  if (!_defaultSystem) _defaultSystem = createReactiveSystem();
  return _defaultSystem;
}

export class AtomStore<T> {
  private readonly initialValue: T;
  private listeners: Set<AtomListener>;
  private equalityFn: (a: T, b: T) => boolean;
  /** @internal Signal engine reactive state node */
  _state: ReactiveState<T>;

  constructor(
    initialValue: T,
    equalityFn?: (a: T, b: T) => boolean,
    system?: ReactiveSystem
  ) {
    this.initialValue = initialValue;
    this.listeners = new Set();
    this.equalityFn = equalityFn ?? Object.is;
    const sys = system ?? getDefaultSystem();
    this._state = sys.signal(initialValue, { equals: this.equalityFn });
  }

  public getValue(): T {
    return this._state.get();
  }

  public getInitialValue(): T {
    return this.initialValue;
  }

  public setValue(newValue: T): void {
    if (this.equalityFn(this._state.get(), newValue)) {
      return;
    }

    this._state.set(newValue);
    this.notifyListeners();
  }

  public reset(): void {
    this.setValue(this.initialValue);
  }

  private notifyListeners(): void {
    const snapshot = [...this.listeners];
    snapshot.forEach((listener) => listener());
  }

  public getSubscriberCount(): number {
    return this.listeners.size;
  }

  public subscribe(listener: AtomListener): Subscription {
    this.listeners.add(listener);

    const unsubscribe = () => {
      this.listeners.delete(listener);
    };

    return {
      unsubscribe,
    };
  }
}
