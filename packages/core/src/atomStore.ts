import { AtomListener, Subscription } from "./types";

export class AtomStore<T> {
  private value: T;
  private readonly initialValue: T;
  private listeners: Set<AtomListener>;
  private equalityFn: (a: T, b: T) => boolean;

  constructor(initialValue: T, equalityFn?: (a: T, b: T) => boolean) {
    this.value = initialValue;
    this.initialValue = initialValue;
    this.listeners = new Set();
    this.equalityFn = equalityFn ?? Object.is;
  }

  public getValue(): T {
    return this.value;
  }

  public getInitialValue(): T {
    return this.initialValue;
  }

  public setValue(newValue: T): void {
    if (this.equalityFn(this.value, newValue)) {
      return;
    }

    this.value = newValue;
    this.notifyListeners();
  }

  public reset(): void {
    this.setValue(this.initialValue);
  }

  private notifyListeners(): void {
    const snapshot = [...this.listeners];
    snapshot.forEach((listener) => listener());
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
