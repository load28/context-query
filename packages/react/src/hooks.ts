import { TStateImpl } from "@context-query/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { createContextQuery } from "./context";

export function createUseContextQuery<TState extends TStateImpl>(
  contexts: ReturnType<typeof createContextQuery<TState>>
) {
  const { StoreContext } = contexts;

  const useLocalContexts = () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(
        "useContextQuery must be used within a ContextQueryProvider"
      );
    }

    return { store };
  };

  const useContextBatchQuery = () => {
    const { store } = useLocalContexts();
    const setState = useCallback(
      (value: TState | ((prev: TState) => TState)) => {
        if (typeof value === "function") {
          const updateFn = value as (prev: TState) => TState;
          const currentValue = store.getState();
          return store.updateState(updateFn(currentValue));
        }
        return store.updateState(value);
      },
      [store]
    );

    return setState;
  };

  const useContextQuery = <TKey extends keyof TState>(
    key: TKey
  ): [
    TState[TKey],
    (value: TState[TKey] | ((prev: TState[TKey]) => TState[TKey])) => boolean,
  ] => {
    const { store } = useLocalContexts();
    const [state, setLocalState] = useState<TState[TKey]>(() =>
      store.getStateByKey(key)
    );

    useEffect(() => {
      const handleChange = (_: TKey, newValue: TState[TKey]) => {
        setLocalState(newValue);
      };

      const sub = store.subscribe(key, handleChange);

      return () => {
        sub.unsubscribe();
      };
    }, [key, store]);

    const setState = useCallback(
      (value: TState[TKey] | ((prev: TState[TKey]) => TState[TKey])) => {
        if (typeof value === "function") {
          const updateFn = value as (prev: TState[TKey]) => TState[TKey];
          const currentValue = store.getStateByKey(key);
          return store.setState(key, updateFn(currentValue));
        }
        return store.setState(key, value);
      },
      [key, store]
    );

    return [state, setState];
  };

  return {
    useContextBatchQuery,
    useContextQuery,
  };
}
