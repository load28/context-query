import { AtomListener, Subscription } from "./types";

export class AtomStore<T> {
  private value: T;
  private listeners: Set<AtomListener<T>>;

  constructor(initialValue: T) {
    this.value = initialValue;
    this.listeners = new Set();
  }

  public getValue(): T {
    return this.value;
  }

  public setValue(newValue: T): void {
    if (Object.is(this.value, newValue)) {
      return;
    }

    this.value = newValue;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.value));
  }

  public subscribe(listener: AtomListener<T>): Subscription {
    this.listeners.add(listener);

    const unsubscribe = () => {
      this.listeners.delete(listener);
    };

    return {
      unsubscribe,
    };
  }
}