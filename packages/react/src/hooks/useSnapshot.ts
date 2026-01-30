import { useCallback, useSyncExternalStore } from "react";
import { createStoreContext } from "../internals/createStoreContext";
import { createUseStoreContext } from "../internals/useStoreContext";

export function createUseSnapshot<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return (): [TAtoms, (newAtoms: Partial<TAtoms>) => void] => {
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

    const allValues = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const updateAllAtoms = useCallback(
      (newAtoms: Partial<TAtoms>) => {
        store.patch(newAtoms);
      },
      [store]
    );

    return [allValues, updateAllAtoms] as const;
  };
}
