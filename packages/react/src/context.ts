import type { ContextQueryStore } from "@context-query/core";
import { createContext } from "react";

export const createStoreContext = <TAtoms extends Record<string, any>>() => {
  return createContext<ContextQueryStore<TAtoms> | null>(null);
};
