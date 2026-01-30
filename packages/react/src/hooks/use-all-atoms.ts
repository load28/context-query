import { useCallback, useSyncExternalStore } from "react";
import { createStoreContext } from "../context";
import { createUseStoreContext } from "../use-store-context";

export function createUseAllAtoms<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return (): [TAtoms, (newAtoms: Partial<TAtoms>) => void] => {
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

    const allValues = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const updateAllAtoms = useCallback(
      (newAtoms: Partial<TAtoms>) => {
        store.updateAllAtoms(newAtoms);
      },
      [store]
    );

    return [allValues, updateAllAtoms] as const;
  };
}
