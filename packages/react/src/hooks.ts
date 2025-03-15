import { TStateImpl } from "@context-query/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { createContextQuery } from "./context";

/**
 * Context Query 훅 생성 함수
 * @template TState 상태 타입
 * @param contexts Context Query 컨텍스트
 * @returns Context Query 관련 훅 모음
 */
export function createUseContextQuery<TState extends TStateImpl>(
  contexts: ReturnType<typeof createContextQuery<TState>>
) {
  const { StoreContext } = contexts;

  /**
   * 스토어 컨텍스트 접근 훅
   * @throws 컨텍스트 제공자 외부에서 사용 시 에러
   */
  const useStore = () => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(
        "useContextQuery must be used within a ContextQueryProvider"
      );
    }

    return store;
  };

  /**
   * 전체 상태 일괄 업데이트 훅
   * @returns 전체 상태 업데이트 함수
   */
  const useContextBatchQuery = () => {
    const store = useStore();

    return useCallback(
      (value: TState | ((prev: TState) => TState)) => {
        if (typeof value === "function") {
          const updateFn = value as (prev: TState) => TState;
          const currentValue = store.getState();
          return store.updateState(updateFn(currentValue));
        }
        return store.updateState(value);
      },
      [store]
    );
  };

  /**
   * 단일 상태 조회 및 업데이트 훅
   * @template TKey 상태 키 타입
   * @param key 상태 키
   * @returns [상태값, 상태 업데이트 함수]
   */
  const useContextQuery = <TKey extends keyof TState>(
    key: TKey
  ): [
    TState[TKey],
    (value: TState[TKey] | ((prev: TState[TKey]) => TState[TKey])) => boolean,
  ] => {
    const store = useStore();
    const [state, setLocalState] = useState<TState[TKey]>(() =>
      store.getStateByKey(key)
    );

    // 상태 변경 구독
    useEffect(() => {
      const handleChange = (_: TKey, newValue: TState[TKey]) => {
        setLocalState(newValue);
      };

      const subscription = store.subscribe(key, handleChange);

      return () => {
        subscription.unsubscribe();
      };
    }, [key, store]);

    // 상태 업데이트 함수
    const setState = useCallback(
      (value: TState[TKey] | ((prev: TState[TKey]) => TState[TKey])) => {
        if (typeof value === "function") {
          const updateFn = value as (prev: TState[TKey]) => TState[TKey];
          const currentValue = store.getStateByKey(key);
          return store.setState(key, updateFn(currentValue));
        }
        return store.setState(key, value);
      },
      [key, store]
    );

    return [state, setState];
  };

  /**
   * 다중 상태 조회 및 업데이트 훅
   * @template TKey 상태 키 타입
   * @param keys 상태 키 배열
   * @returns [상태 객체, 상태 업데이트 함수]
   */
  const useContextMultiQuery = <TKey extends keyof TState>(keys: TKey[]) => {
    const store = useStore();

    // 상태 객체 타입
    type StateSubset = { [K in TKey]: TState[K] };

    // 초기 상태 생성 함수
    const getStateSubset = (): StateSubset => {
      return keys.reduce(
        (acc, key) => ({ ...acc, [key]: store.getStateByKey(key) }),
        {} as StateSubset
      );
    };

    const [state, setLocalState] = useState<StateSubset>(getStateSubset);

    // 상태 변경 구독
    useEffect(() => {
      const handleChange = (key: TKey, newValue: TState[TKey]) => {
        setLocalState((prev) => ({ ...prev, [key]: newValue }));
      };

      const subscriptions = keys.map((key) =>
        store.subscribe(key, handleChange)
      );

      return () => {
        subscriptions.forEach((sub) => sub.unsubscribe());
      };
    }, [keys, store]);

    // 상태 업데이트 함수
    const setState = useCallback(
      (value: StateSubset | ((prev: StateSubset) => StateSubset)) => {
        const currentValue = getStateSubset();
        const updatedValue =
          typeof value === "function"
            ? (value as Function)(currentValue)
            : value;

        // 각 키별로 상태 업데이트
        Object.entries(updatedValue).forEach(([k, v]) => {
          store.setState(k as TKey, v as TState[TKey]);
        });

        return true;
      },
      [keys, store]
    );

    return [state, setState] as const;
  };

  return {
    useContextBatchQuery,
    useContextQuery,
    useContextMultiQuery,
  };
}
