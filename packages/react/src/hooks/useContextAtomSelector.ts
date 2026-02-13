import { useCallback, useDebugValue, useRef, useSyncExternalStore } from "react";
import { createStoreContext } from "../internals/createStoreContext";
import { createUseStoreContext } from "../internals/useStoreContext";

export function createUseContextAtomSelector<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return <TKey extends keyof TAtoms, TResult>(
    key: TKey,
    selector: (value: TAtoms[TKey]) => TResult,
    equalityFn?: (a: TResult, b: TResult) => boolean
  ): TResult => {
    const store = useStoreContext();
    const equality = equalityFn ?? Object.is;
    const prevResultRef = useRef<TResult | undefined>(undefined);
    const prevInitialized = useRef(false);

    const subscribe = useCallback(
      (callback: () => void) => {
        const subscription = store.subscribeToAtom(key, () => {
          callback();
        });
        return () => subscription.unsubscribe();
      },
      [store, key]
    );

    const getSnapshot = useCallback(() => {
      const atomValue = store.getAtomValue(key);
      const nextResult = selector(atomValue);

      if (
        prevInitialized.current &&
        equality(prevResultRef.current as TResult, nextResult)
      ) {
        return prevResultRef.current as TResult;
      }

      prevResultRef.current = nextResult;
      prevInitialized.current = true;
      return nextResult;
    }, [store, key, selector, equality]);

    const result = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    useDebugValue(result);

    return result;
  };
}
