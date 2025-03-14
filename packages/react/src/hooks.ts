import { TStateImpl } from "@context-query/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { createContextQuery } from "./context";

export function createUseContextQuery<TState extends TStateImpl>(
  contexts: ReturnType<typeof createContextQuery<TState>>
) {
  const { StoreContext, ContextQuerySubscriptionContext } = contexts;

  return function useContextQuery<TKey extends keyof TState>(
    key: TKey
  ): [
    TState[TKey],
    (value: TState[TKey] | ((prev: TState[TKey]) => TState[TKey])) => boolean,
  ] {
    const store = useContext(StoreContext);
    const subscription = useContext(ContextQuerySubscriptionContext);

    if (!store) {
      throw new Error(
        "useContextQuery must be used within a ContextQueryProvider"
      );
    }

    if (!subscription || !subscription.subscribe) {
      throw new Error(
        "ContextQuerySubscriptionContext not properly initialized"
      );
    }

    const [state, setLocalState] = useState<TState[TKey]>(() =>
      store.getStateByKey(key)
    );

    useEffect(() => {
      const handleChange = (_: TKey, newValue: TState[TKey]) => {
        setLocalState(newValue);
      };

      if (!subscription.subscribe) return;

      const sub = subscription.subscribe(key, handleChange);

      return () => {
        sub.unsubscribe();
      };
    }, [key, subscription.subscribe, store]);

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
}
