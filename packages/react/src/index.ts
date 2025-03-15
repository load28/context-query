import { ContextQueryStore, TStateImpl } from "@context-query/core";
import { createUseContextQuery } from "./hooks";
import { createReactContextQuery } from "./provider";

export function createContextQuery<TState extends TStateImpl>(
  initialState: TState
) {
  const store = new ContextQueryStore<TState>(initialState);

  const { Provider, contexts } = createReactContextQuery<TState>(store);
  const useContextQuery = createUseContextQuery<TState>(contexts);

  const updateState = (state: TState | ((prev: TState) => TState)) => {
    if (typeof state === "function") {
      const updateFn = state as (prev: TState) => TState;
      const currentValue = store.getState();
      store.updateState(updateFn(currentValue));
    } else {
      store.updateState(state);
    }
  };

  const setState = <TKey extends keyof TState>(
    key: TKey,
    value: TState[TKey] | ((prev: TState[TKey]) => TState[TKey])
  ) => {
    if (typeof value === "function") {
      const updateFn = value as (prev: TState[TKey]) => TState[TKey];
      const currentValue = store.getStateByKey(key);
      store.setState(key, updateFn(currentValue));
    } else {
      store.setState(key, value);
    }
  };

  return {
    Provider,
    useContextQuery,
    updateState,
    setState,
  };
}
