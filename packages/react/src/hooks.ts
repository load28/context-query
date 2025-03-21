import { TStateImpl } from "@context-query/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { createContextQuery } from "./context";

export function createUseContextQuery<TState extends TStateImpl>(
  contexts: ReturnType<typeof createContextQuery<TState>>
) {
  const { StoreContext } = contexts;

  const useStore = () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(
        "useContextQuery must be used within a ContextQueryProvider"
      );
    }

    return store;
  };

  return <TKey extends keyof TState>(keys?: TKey[]) => {
    const store = useStore();
    const localKeys = keys ?? (Object.keys(store.getState()) as TKey[]);

    type StateSubset = { [K in TKey]: TState[K] };

    const getStateSubset = (): StateSubset => {
      return localKeys.reduce(
        (acc, key) => ({ ...acc, [key]: store.getStateByKey(key) }),
        {} as StateSubset
      );
    };

    const [state, setLocalState] = useState<StateSubset>(getStateSubset);

    useEffect(() => {
      const handleChange = (key: TKey, newValue: TState[TKey]) => {
        setLocalState((prev) => ({ ...prev, [key]: newValue }));
      };

      const subscriptions = localKeys.map((key) =>
        store.subscribe(key, handleChange)
      );

      return () => {
        subscriptions.forEach((sub) => sub.unsubscribe());
      };
    }, [localKeys, store]);

    const setState = useCallback(
      (value: StateSubset | ((prev: StateSubset) => StateSubset)) => {
        const currentValue = getStateSubset();
        const updatedValue =
          typeof value === "function"
            ? (value as Function)(currentValue)
            : value;

        Object.entries(updatedValue).forEach(([k, v]) => {
          store.setState(k as TKey, v as TState[TKey]);
        });
      },
      [localKeys, store]
    );

    return [state, setState] as const;
  };
}
