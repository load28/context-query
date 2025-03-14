import { Listener, Subscription, TStateImpl } from "./types";

export class ContextQueryStore<TState extends TStateImpl> {
  private state: TState;
  private listeners: Map<keyof TState, Set<Listener<any>>>;

  constructor(initialState: TState) {
    this.state = initialState;
    this.listeners = new Map();
  }

  public getState(): TState {
    return this.state;
  }

  public getStateByKey<TKey extends keyof TState>(key: TKey): TState[TKey] {
    return this.state[key];
  }

  public updateState<TKey extends keyof TState>(state: TState): boolean {
    const prevState = { ...this.state };
    this.state = { ...state };
    const keys = Object.keys(state) as TKey[];

    keys.forEach((key: TKey) => {
      if (prevState[key] !== this.state[key]) {
        this.notifyListeners(key);
      }
    });

    return true;
  }

  public setState<TKey extends keyof TState>(
    key: TKey,
    value: TState[TKey]
  ): boolean {
    if (this.state[key] === value) {
      return false;
    }

    this.state = { ...this.state, [key]: value };

    this.notifyListeners(key);

    return true;
  }

  private notifyListeners<TKey extends keyof TState>(key: TKey) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      const value = this.state[key];
      listeners.forEach((listener) => listener(value));
    }
  }

  public subscribe<TKey extends keyof TState>(
    key: TKey,
    listener: (key: TKey, value: TState[TKey]) => void
  ): Subscription {
    const keyListener = (value: TState[TKey]) => {
      listener(key, value);
    };

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(keyListener);

    const unsubscribe = () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(keyListener);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };

    return {
      unsubscribe,
    };
  }
}
