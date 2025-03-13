export type Subscription = {
  unsubscribe: () => void;
};

export type Listener<T> = (value: T) => void;
export type Updater<TState> = (state: TState) => Partial<TState>;
export type TStateImpl = Record<string, unknown>;
