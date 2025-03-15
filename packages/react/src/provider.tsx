import { ContextQueryStore, TStateImpl } from "@context-query/core";
import { FC, PropsWithChildren, useEffect, useRef } from "react";
import { createContextQuery } from "./context";

export interface ProviderProps<TState extends TStateImpl>
  extends PropsWithChildren {
  initialState: TState;
}

export const createContextQueryProvider = <TState extends TStateImpl>(
  contexts: ReturnType<typeof createContextQuery<TState>>
): FC<ProviderProps<TState>> => {
  const { StoreContext } = contexts;

  return function ContextQueryProvider({
    children,
    initialState,
  }: ProviderProps<TState>) {
    const storeRef = useRef<ContextQueryStore<TState> | null>(null);
    const previousStateRef = useRef<TState | null>(null);

    if (!storeRef.current) {
      storeRef.current = new ContextQueryStore<TState>(initialState);
      previousStateRef.current = initialState;
    }

    useEffect(() => {
      if (
        storeRef.current &&
        !Object.is(previousStateRef.current, initialState)
      ) {
        storeRef.current.updateState(initialState);
        previousStateRef.current = initialState;
      }
    }, [initialState]);

    return (
      <StoreContext.Provider value={storeRef.current}>
        {children}
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
