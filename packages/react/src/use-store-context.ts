import type { ContextQueryStore } from "@context-query/core";
import { useContext } from "react";
import { createStoreContext } from "./context";

export function createUseStoreContext<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
): () => ContextQueryStore<TAtoms> {
  return (): ContextQueryStore<TAtoms> => {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error("Hook must be used within a ContextQueryProvider");
    }

    return store;
  };
}
