import { TStateImpl } from "@context-query/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { createContextQuery } from "./context";

export function createUseContextQuery<TState extends TStateImpl>(
  contexts: ReturnType<typeof createContextQuery<TState>>
) {
  const { StoreContext, ContextQuerySubscriptionContext } = contexts;

  return function useContextQuery<K extends keyof TState>(
    key: K
  ): [
    TState[K],
    (value: TState[K] | ((prev: TState[K]) => TState[K])) => boolean,
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

    const [state, setLocalState] = useState<TState[K]>(() =>
      store.getStateByKey(key)
    );

    useEffect(() => {
      const handleChange = (_: keyof TState, newValue: TState[K]) => {
        setLocalState(newValue);
      };

      if (!subscription.subscribe) return;

      const sub = subscription.subscribe(key, handleChange);

      return () => {
        sub.unsubscribe();
      };
    }, [key, subscription.subscribe, store]);

    const setState = useCallback(
      (value: TState[K] | ((prev: TState[K]) => TState[K])) => {
        if (typeof value === "function") {
          const updateFn = value as (prev: TState[K]) => TState[K];
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
