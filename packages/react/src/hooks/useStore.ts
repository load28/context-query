import type { ContextQueryStore } from "@context-query/core";
import { createStoreContext } from "../internals/createStoreContext";
import { createUseStoreContext } from "../internals/useStoreContext";

export function createUseStore<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
): () => ContextQueryStore<TAtoms> {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return () => {
    return useStoreContext();
  };
}
