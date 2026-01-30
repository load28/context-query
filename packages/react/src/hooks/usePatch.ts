import { useCallback } from "react";
import { createStoreContext } from "../internals/createStoreContext";
import { createUseStoreContext } from "../internals/useStoreContext";

export function createUsePatch<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return (): ((newAtoms: Partial<TAtoms>) => void) => {
    const store = useStoreContext();

    return useCallback(
      (newAtoms: Partial<TAtoms>) => {
        store.patch(newAtoms);
      },
      [store]
    );
  };
}
