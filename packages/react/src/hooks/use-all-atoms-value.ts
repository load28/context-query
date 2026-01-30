import { useCallback, useSyncExternalStore } from "react";
import { createStoreContext } from "../context";
import { createUseStoreContext } from "../use-store-context";

export function createUseAllAtomsValue<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return (): TAtoms => {
    const store = useStoreContext();

    const subscribe = useCallback(
      (callback: () => void) => {
        const subscription = store.subscribeAll(() => {
          callback();
        });
        return () => subscription.unsubscribe();
      },
      [store]
    );

    const getSnapshot = useCallback(
      () => store.getAllAtomValues(),
      [store]
    );

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  };
}
