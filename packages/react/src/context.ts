import type { ContextQueryStore, TStateImpl } from "@context-query/core";
import { createContext } from "react";

export const createContextQuery = <TState extends TStateImpl>() => {
  const StoreContext = createContext<ContextQueryStore<TState> | null>(null);
  return {
    StoreContext,
  };
};
