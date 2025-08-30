import type { ContextQueryStore, TStateImpl } from "@context-query/core";
import { createContext } from "react";

export const createStoreContext = <TState extends TStateImpl>() => {
  return createContext<ContextQueryStore<TState> | null>(null);
};
