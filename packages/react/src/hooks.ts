import type { ContextQueryStore } from "@context-query/core";
import { useCallback, useContext, useSyncExternalStore } from "react";
import { createStoreContext } from "./context";

/**
 * 스토어 인스턴스에 직접 접근하는 훅 팩토리
 */
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

/**
 * 특정 atom의 값과 setter를 반환하는 훅 팩토리
 * useSyncExternalStore를 사용하여 React 동시성 모드에서 안전하게 동작
 */
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

    // useSyncExternalStore로 외부 스토어와 안전하게 동기화
    const value = useSyncExternalStore(
      // subscribe: 스토어 변경 구독
      useCallback(
        (onStoreChange: () => void) => {
          const subscription = store.subscribeToAtom(key, onStoreChange);
          return () => subscription.unsubscribe();
        },
        [store, key]
      ),
      // getSnapshot: 현재 값 반환 (클라이언트)
      useCallback(() => store.getAtomValue(key), [store, key]),
      // getServerSnapshot: SSR용 값 반환
      useCallback(() => store.getAtomValue(key), [store, key])
    );

    // setter 함수 (함수형 업데이트 지원)
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

/**
 * 특정 atom의 값만 반환하는 훅 팩토리 (읽기 전용)
 * useSyncExternalStore를 사용하여 React 동시성 모드에서 안전하게 동작
 */
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

    // useSyncExternalStore로 외부 스토어와 안전하게 동기화
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

    return value;
  };
}

/**
 * 특정 atom의 setter만 반환하는 훅 팩토리 (쓰기 전용)
 * 값을 구독하지 않으므로 불필요한 리렌더링 방지
 */
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

/**
 * 모든 atom의 값과 업데이터를 반환하는 훅 팩토리
 * useSyncExternalStore를 사용하여 React 동시성 모드에서 안전하게 동작
 */
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

    // 모든 atom 키를 구독하기 위한 subscribe 함수
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

/**
 * 모든 atom의 값만 반환하는 훅 팩토리 (읽기 전용)
 * useSyncExternalStore를 사용하여 React 동시성 모드에서 안전하게 동작
 */
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

/**
 * 모든 atom을 업데이트하는 함수만 반환하는 훅 팩토리 (쓰기 전용)
 * 값을 구독하지 않으므로 불필요한 리렌더링 방지
 */
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
