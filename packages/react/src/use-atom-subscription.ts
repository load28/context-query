import type { ContextQueryStore } from "@context-query/core";
import { useCallback, useSyncExternalStore } from "react";

export function useAtomSubscription<
  TAtoms extends Record<string, any>,
  TKey extends keyof TAtoms,
>(store: ContextQueryStore<TAtoms>, key: TKey): TAtoms[TKey] {
  const subscribe = useCallback(
    (callback: () => void) => {
      const subscription = store.subscribeToAtom(key, () => {
        callback();
      });
      return () => subscription.unsubscribe();
    },
    [store, key]
  );

  const getSnapshot = useCallback(
    () => store.getAtomValue(key),
    [store, key]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
