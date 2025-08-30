import { ContextQueryStore, TStateImpl } from "@context-query/core";
import { PropsWithChildren, useMemo } from "react";
import { createStoreContext } from "./context";

export function createReactContextQuery<TState extends TStateImpl>() {
  const StoreContext = createStoreContext<TState>();
  const ContextQueryProvider = function ContextQueryProvider({
    children,
    initialState,
  }: PropsWithChildren<TState>) {
    const store = useMemo(
      () => new ContextQueryStore<TState>(initialState),
      [initialState]
    );

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  };

  return {
    ContextQueryProvider,
    StoreContext,
  };
}
