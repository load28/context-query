import { useCallback } from "react";
import { createStoreContext } from "../internals/createStoreContext";
import { createUseStoreContext } from "../internals/useStoreContext";

export function createUseResetAtom<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return <TKey extends keyof TAtoms>(key: TKey): (() => void) => {
    const store = useStoreContext();

    return useCallback(() => {
      store.resetAtom(key);
    }, [store, key]);
  };
}
