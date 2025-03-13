import { ContextQueryStore, TStateImpl } from "@context-query/core";
import { FC, PropsWithChildren, useMemo } from "react";
import { createContextQuery } from "./context";

export interface ProviderProps<TState extends TStateImpl>
  extends PropsWithChildren {
  initialState?: Partial<TState>;
}

export type StoreCreator<TState extends TStateImpl> = (
  initialState?: TState
) => ContextQueryStore<TState>;

export const createContextQueryProvider = <TState extends TStateImpl>(
  contexts: ReturnType<typeof createContextQuery<TState>>,
  createStore: StoreCreator<TState>
): FC<ProviderProps<TState>> => {
  const { StoreContext, ContextQuerySubscriptionContext } = contexts;

  return function ContextQueryProvider({
    children,
    initialState = {},
  }: ProviderProps<TState>) {
    const store = useMemo(() => createStore(initialState as TState), []);

    const contextQuerySubscriptionContextValue = useMemo(
      () => ({
        subscribe: store.subscribe ? store.subscribe.bind(store) : null,
      }),
      [store]
    );

    return (
      <StoreContext.Provider value={store}>
        <ContextQuerySubscriptionContext.Provider
          value={contextQuerySubscriptionContextValue}
        >
          {children}
        </ContextQuerySubscriptionContext.Provider>
      </StoreContext.Provider>
    );
  };
};

export function createReactContextQuery<TState extends TStateImpl>(
  createStore: StoreCreator<TState>
) {
  const contexts = createContextQuery<TState>();
  const ContextQueryProvider = createContextQueryProvider<TState>(
    contexts,
    createStore
  );

  return {
    Provider: ContextQueryProvider,
    contexts,
  };
}
