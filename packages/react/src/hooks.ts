import type { ContextQueryStore } from "@context-query/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { createStoreContext } from "./context";

export function createUseStore<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
): () => ContextQueryStore<TAtoms> {
  return () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error("useStore must be used within a ContextQueryProvider");
    }

    return store;
  };
}

export function createUseContextAtom<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStore = () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(
        "useContextAtom must be used within a ContextQueryProvider"
      );
    }

    return store;
  };

  return <TKey extends keyof TAtoms>(key: TKey) => {
    const store = useStore();
    const [value, setValue] = useState<TAtoms[TKey]>(() =>
      store.getAtomValue(key)
    );

    useEffect(() => {
      setValue(store.getAtomValue(key));
    }, [store, key]);

    useEffect(() => {
      const handleChange = (_: TKey, newValue: TAtoms[TKey]) => {
        setValue(newValue);
      };

      const subscription = store.subscribeToAtom(key, handleChange);

      return () => {
        subscription.unsubscribe();
      };
    }, [key, store]);

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
  const useStore = () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(
        "useContextAtomValue must be used within a ContextQueryProvider"
      );
    }

    return store;
  };

  return <TKey extends keyof TAtoms>(key: TKey): TAtoms[TKey] => {
    const store = useStore();
    const [value, setValue] = useState<TAtoms[TKey]>(() =>
      store.getAtomValue(key)
    );

    useEffect(() => {
      setValue(store.getAtomValue(key));
    }, [store, key]);

    useEffect(() => {
      const handleChange = (_: TKey, newValue: TAtoms[TKey]) => {
        setValue(newValue);
      };

      const subscription = store.subscribeToAtom(key, handleChange);

      return () => {
        subscription.unsubscribe();
      };
    }, [key, store]);

    return value;
  };
}

export function createUseContextSetAtom<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStore = () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(
        "useContextSetAtom must be used within a ContextQueryProvider"
      );
    }

    return store;
  };

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
  const useStore = () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error("useAllAtoms must be used within a ContextQueryProvider");
    }

    return store;
  };

  return (): [TAtoms, (newAtoms: Partial<TAtoms>) => void] => {
    const store = useStore();
    const [allValues, setAllValues] = useState<TAtoms>(() =>
      store.getAllAtomValues()
    );

    useEffect(() => {
      setAllValues(store.getAllAtomValues());
    }, [store]);

    useEffect(() => {
      const subscriptions: Array<{ unsubscribe: () => void }> = [];
      const currentAtoms = store.getAllAtomValues();

      Object.keys(currentAtoms).forEach((key) => {
        const subscription = store.subscribeToAtom(key as keyof TAtoms, () => {
          setAllValues(store.getAllAtomValues());
        });
        subscriptions.push(subscription);
      });

      return () => {
        subscriptions.forEach((sub) => sub.unsubscribe());
      };
    }, [store]);

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
  const useStore = () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(
        "useAllAtomsValue must be used within a ContextQueryProvider"
      );
    }

    return store;
  };

  return (): TAtoms => {
    const store = useStore();
    const [allValues, setAllValues] = useState<TAtoms>(() =>
      store.getAllAtomValues()
    );

    useEffect(() => {
      setAllValues(store.getAllAtomValues());
    }, [store]);

    useEffect(() => {
      const subscriptions: Array<{ unsubscribe: () => void }> = [];
      const currentAtoms = store.getAllAtomValues();

      Object.keys(currentAtoms).forEach((key) => {
        const subscription = store.subscribeToAtom(key as keyof TAtoms, () => {
          setAllValues(store.getAllAtomValues());
        });
        subscriptions.push(subscription);
      });

      return () => {
        subscriptions.forEach((sub) => sub.unsubscribe());
      };
    }, [store]);

    return allValues;
  };
}

export function createUseUpdateAllAtoms<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStore = () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(
        "useUpdateAllAtoms must be used within a ContextQueryProvider"
      );
    }

    return store;
  };

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
