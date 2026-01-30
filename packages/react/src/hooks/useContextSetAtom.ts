import { useCallback } from "react";
import { createStoreContext } from "../internals/createStoreContext";
import { createUseStoreContext } from "../internals/useStoreContext";

export function createUseContextSetAtom<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return <TKey extends keyof TAtoms>(
    key: TKey
  ): ((
    value: TAtoms[TKey] | ((prev: TAtoms[TKey]) => TAtoms[TKey])
  ) => void) => {
    const store = useStoreContext();

    return useCallback(
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
  };
}
