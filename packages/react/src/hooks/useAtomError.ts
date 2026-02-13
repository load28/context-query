import { useCallback, useDebugValue, useSyncExternalStore } from "react";
import { createStoreContext } from "../internals/createStoreContext";
import { createUseStoreContext } from "../internals/useStoreContext";

export function createUseAtomError<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return <TKey extends keyof TAtoms>(key: TKey): Error | null => {
    const store = useStoreContext();

    const subscribe = useCallback(
      (callback: () => void) => {
        const subscription = store.subscribeToAtom(key, callback);
        return () => subscription.unsubscribe();
      },
      [store, key]
    );

    const getSnapshot = useCallback(
      () => store.getAtomError(key),
      [store, key]
    );

    const error = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    useDebugValue(error);

    return error;
  };
}
