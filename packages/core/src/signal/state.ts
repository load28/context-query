import { ReactiveFlags } from "./types";
import type { ReactiveNode, Link, SignalOptions } from "./types";
import { propagate } from "./propagate";

export interface ReactiveState<T> extends ReactiveNode {
  _value: T;
  _equals: (a: T, b: T) => boolean;
  get(): T;
  set(value: T): void;
}

export function createState<T>(
  initialValue: T,
  options?: SignalOptions<T>,
  trackFn?: (node: ReactiveNode) => void
): ReactiveState<T> {
  const equals = options?.equals ?? Object.is;

  const state: ReactiveState<T> = {
    flags: ReactiveFlags.Mutable,
    deps: null,
    subs: null,
    _value: initialValue,
    _equals: equals,
    get() {
      if (trackFn) {
        trackFn(state);
      }
      return state._value;
    },
    set(value: T) {
      if (equals(state._value, value)) {
        return;
      }
      state._value = value;
      if (state.subs) {
        propagate(state);
      }
    },
  };

  return state;
}
