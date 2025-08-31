import { useCallback, useContext, useEffect, useState } from "react";
import { createStoreContext } from "./context";

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
    const [value, setValue] = useState<TAtoms[TKey]>(() => store.getAtomValue(key));

    useEffect(() => {
      const handleChange = (_: TKey, newValue: TAtoms[TKey]) => {
        setValue(newValue);
      };

      const subscription = store.subscribeToAtom(key, handleChange);

      return () => {
        subscription.unsubscribe();
      };
    }, [key, store]);

    const setAtom = useCallback((newValue: TAtoms[TKey] | ((prev: TAtoms[TKey]) => TAtoms[TKey])) => {
      const currentValue = store.getAtomValue(key);
      const updatedValue = typeof newValue === "function" 
        ? (newValue as Function)(currentValue) 
        : newValue;
      
      store.setAtomValue(key, updatedValue);
    }, [key, store]);

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
    const [value, setValue] = useState<TAtoms[TKey]>(() => store.getAtomValue(key));

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
  ): ((value: TAtoms[TKey] | ((prev: TAtoms[TKey]) => TAtoms[TKey])) => void) => {
    const store = useStore();

    return useCallback((newValue: TAtoms[TKey] | ((prev: TAtoms[TKey]) => TAtoms[TKey])) => {
      const currentValue = store.getAtomValue(key);
      const updatedValue = typeof newValue === "function" 
        ? (newValue as Function)(currentValue) 
        : newValue;
      
      store.setAtomValue(key, updatedValue);
    }, [key, store]);
  };
}
