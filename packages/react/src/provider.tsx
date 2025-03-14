import { ContextQueryStore, TStateImpl } from "@context-query/core";
import { FC, PropsWithChildren, useEffect, useMemo, useRef } from "react";
import { createContextQuery } from "./context";

export interface ProviderProps<TState extends TStateImpl>
  extends PropsWithChildren {
  initialState: TState;
}

export const createContextQueryProvider = <TState extends TStateImpl>(
  contexts: ReturnType<typeof createContextQuery<TState>>
): FC<ProviderProps<TState>> => {
  const { StoreContext, ContextQuerySubscriptionContext } = contexts;

  return function ContextQueryProvider({
    children,
    initialState,
  }: ProviderProps<TState>) {
    const storeRef = useRef<ContextQueryStore<TState> | null>(null);

    if (!storeRef.current) {
      storeRef.current = new ContextQueryStore<TState>(initialState);
    }

    useEffect(() => {
      if (storeRef.current) {
        storeRef.current.updateState(initialState);
      }
    }, [initialState]);

    const contextQuerySubscriptionContextValue = useMemo(
      () => ({
        subscribe: storeRef.current
          ? storeRef.current.subscribe.bind(storeRef.current)
          : null,
      }),
      [storeRef.current]
    );

    return (
      <StoreContext.Provider value={storeRef.current}>
        <ContextQuerySubscriptionContext.Provider
          value={contextQuerySubscriptionContextValue}
        >
          {children}
        </ContextQuerySubscriptionContext.Provider>
      </StoreContext.Provider>
    );
  };
};

export function createReactContextQuery<TState extends TStateImpl>() {
  const contexts = createContextQuery<TState>();
  const ContextQueryProvider = createContextQueryProvider<TState>(contexts);

  return {
    Provider: ContextQueryProvider,
    contexts,
  };
}
