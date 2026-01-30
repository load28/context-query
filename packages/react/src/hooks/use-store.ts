import type { ContextQueryStore } from "@context-query/core";
import { createStoreContext } from "../context";
import { createUseStoreContext } from "../use-store-context";

export function createUseStore<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
): () => ContextQueryStore<TAtoms> {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return () => {
    return useStoreContext();
  };
}
