import type { ContextQueryStore } from "@context-query/core";
import { useCallback, useDebugValue } from "react";
import { createStoreContext } from "../internals/createStoreContext";
import { createUseStoreContext } from "../internals/useStoreContext";
import { useAtomSubscription } from "../internals/useAtomSubscription";

export function createUseContextAtom<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return <TKey extends keyof TAtoms>(key: TKey) => {
    const store = useStoreContext();
    const value = useAtomSubscription(store, key);

    useDebugValue({ key, value });

    const setAtom = useCallback(
      (newValue: TAtoms[TKey] | ((prev: TAtoms[TKey]) => TAtoms[TKey])) => {
        if (typeof newValue === "function") {
          const currentValue = store.getAtomValue(key);
          let updatedValue: TAtoms[TKey];
          try {
            updatedValue = (newValue as Function)(currentValue);
          } catch {
            // Function updater threw — atom value stays unchanged
            return;
          }
          store.setAtomValue(key, updatedValue);
        } else {
          store.setAtomValue(key, newValue);
        }
      },
      [key, store]
    );

    return [value, setAtom] as const;
  };
}
