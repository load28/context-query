import { ContextQueryStore, TStateImpl } from "@context-query/core";
import { FC, PropsWithChildren } from "react";
import { createContextQuery } from "./context";

export type ProviderProps<TState extends TStateImpl> = PropsWithChildren;

export const createContextQueryProvider = <TState extends TStateImpl>(
  contexts: ReturnType<typeof createContextQuery<TState>>,
  store: ContextQueryStore<TState>
): FC<ProviderProps<TState>> => {
  const { StoreContext } = contexts;

  return function ContextQueryProvider({ children }: ProviderProps<TState>) {
    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  };
};

export function createReactContextQuery<TState extends TStateImpl>(
  store: ContextQueryStore<TState>
) {
  const contexts = createContextQuery<TState>();
  const ContextQueryProvider = createContextQueryProvider<TState>(
    contexts,
    store
  );

  return {
    Provider: ContextQueryProvider,
    contexts,
  };
}
