import { useCallback } from "react";
import { createStoreContext } from "../context";
import { createUseStoreContext } from "../use-store-context";

export function createUseUpdateAllAtoms<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return (): ((newAtoms: Partial<TAtoms>) => void) => {
    const store = useStoreContext();

    return useCallback(
      (newAtoms: Partial<TAtoms>) => {
        store.updateAllAtoms(newAtoms);
      },
      [store]
    );
  };
}
