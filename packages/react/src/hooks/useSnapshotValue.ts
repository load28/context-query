import { useCallback, useSyncExternalStore } from "react";
import { createStoreContext } from "../internals/createStoreContext";
import { createUseStoreContext } from "../internals/useStoreContext";

export function createUseSnapshotValue<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return (): TAtoms => {
    const store = useStoreContext();

    const subscribe = useCallback(
      (callback: () => void) => {
        const subscription = store.subscribe(() => {
          callback();
        });
        return () => subscription.unsubscribe();
      },
      [store]
    );

    const getSnapshot = useCallback(
      () => store.getSnapshot(),
      [store]
    );

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  };
}
