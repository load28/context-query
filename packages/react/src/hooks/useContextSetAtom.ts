import { useCallback, useDebugValue } from "react";
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

    useDebugValue({ key, type: 'setter' });

    return useCallback(
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
  };
}
