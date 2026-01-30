import type { ContextQueryStore } from "@context-query/core";
import { useCallback } from "react";
import { createStoreContext } from "../context";
import { createUseStoreContext } from "../use-store-context";
import { useAtomSubscription } from "../use-atom-subscription";

export function createUseContextAtom<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return <TKey extends keyof TAtoms>(key: TKey) => {
    const store = useStoreContext();
    const value = useAtomSubscription(store, key);

    const setAtom = useCallback(
      (newValue: TAtoms[TKey] | ((prev: TAtoms[TKey]) => TAtoms[TKey])) => {
        const currentValue = store.getAtomValue(key);
        const updatedValue =
          typeof newValue === "function"
            ? (newValue as Function)(currentValue)
            : newValue;

        store.setAtomValue(key, updatedValue);
      },
      [key, store]
    );

    return [value, setAtom] as const;
  };
}
