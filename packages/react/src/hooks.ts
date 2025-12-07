import type { ContextQueryStore } from "@context-query/core";
import { useCallback, useContext, useSyncExternalStore } from "react";
import { createStoreContext } from "./context";

function createUseStoreInternal<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>,
  hookName: string
): () => ContextQueryStore<TAtoms> {
  return () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(`${hookName} must be used within a ContextQueryProvider`);
    }

    return store;
  };
}

export function createUseStore<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
): () => ContextQueryStore<TAtoms> {
  return createUseStoreInternal(StoreContext, "useStore");
}

export function createUseContextAtom<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStore = createUseStoreInternal(StoreContext, "useContextAtom");

  return <TKey extends keyof TAtoms>(key: TKey) => {
    const store = useStore();

    const value = useSyncExternalStore(
      useCallback(
        (onStoreChange: () => void) => {
          const subscription = store.subscribeToAtom(key, onStoreChange);
          return () => subscription.unsubscribe();
        },
        [store, key]
      ),
      useCallback(() => store.getAtomValue(key), [store, key]),
      useCallback(() => store.getAtomValue(key), [store, key])
    );

    const setAtom = useCallback(
      (newValue: TAtoms[TKey] | ((prev: TAtoms[TKey]) => TAtoms[TKey])) => {
        const currentValue = store.getAtomValue(key);
        const updatedValue =
          typeof newValue === "function"
            ? (newValue as Function)(currentValue)
            : newValue;

        store.setAtomValue(key, updatedValue);
      },
      [key, store]
    );

    return [value, setAtom] as const;
  };
}

export function createUseContextAtomValue<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStore = createUseStoreInternal(StoreContext, "useContextAtomValue");

  return <TKey extends keyof TAtoms>(key: TKey): TAtoms[TKey] => {
    const store = useStore();

    return useSyncExternalStore(
      useCallback(
        (onStoreChange: () => void) => {
          const subscription = store.subscribeToAtom(key, onStoreChange);
          return () => subscription.unsubscribe();
        },
        [store, key]
      ),
      useCallback(() => store.getAtomValue(key), [store, key]),
      useCallback(() => store.getAtomValue(key), [store, key])
    );
  };
}

export function createUseContextSetAtom<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStore = createUseStoreInternal(StoreContext, "useContextSetAtom");

  return <TKey extends keyof TAtoms>(
    key: TKey
  ): ((
    value: TAtoms[TKey] | ((prev: TAtoms[TKey]) => TAtoms[TKey])
  ) => void) => {
    const store = useStore();

    return useCallback(
      (newValue: TAtoms[TKey] | ((prev: TAtoms[TKey]) => TAtoms[TKey])) => {
        const currentValue = store.getAtomValue(key);
        const updatedValue =
          typeof newValue === "function"
            ? (newValue as Function)(currentValue)
            : newValue;

        store.setAtomValue(key, updatedValue);
      },
      [key, store]
    );
  };
}

export function createUseAllAtoms<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStore = createUseStoreInternal(StoreContext, "useAllAtoms");

  return (): [TAtoms, (newAtoms: Partial<TAtoms>) => void] => {
    const store = useStore();

    const subscribe = useCallback(
      (onStoreChange: () => void) => {
        const currentAtoms = store.getAllAtomValues();
        const subscriptions = Object.keys(currentAtoms).map((key) =>
          store.subscribeToAtom(key as keyof TAtoms, onStoreChange)
        );

        return () => {
          subscriptions.forEach((sub) => sub.unsubscribe());
        };
      },
      [store]
    );

    const getSnapshot = useCallback(() => store.getAllAtomValues(), [store]);

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

export function createUseAllAtomsValue<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStore = createUseStoreInternal(StoreContext, "useAllAtomsValue");

  return (): TAtoms => {
    const store = useStore();

    const subscribe = useCallback(
      (onStoreChange: () => void) => {
        const currentAtoms = store.getAllAtomValues();
        const subscriptions = Object.keys(currentAtoms).map((key) =>
          store.subscribeToAtom(key as keyof TAtoms, onStoreChange)
        );

        return () => {
          subscriptions.forEach((sub) => sub.unsubscribe());
        };
      },
      [store]
    );

    const getSnapshot = useCallback(() => store.getAllAtomValues(), [store]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  };
}

export function createUseUpdateAllAtoms<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStore = createUseStoreInternal(StoreContext, "useUpdateAllAtoms");

  return (): ((newAtoms: Partial<TAtoms>) => void) => {
    const store = useStore();

    return useCallback(
      (newAtoms: Partial<TAtoms>) => {
        store.updateAllAtoms(newAtoms);
      },
      [store]
    );
  };
}
