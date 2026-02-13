import { ContextQueryStore } from "@context-query/core";
import { PropsWithChildren, useMemo } from "react";
import { createStoreContext } from "./internals/createStoreContext";

type AtomValues<T extends Record<string, any>> = {
  [K in keyof T]: T[K];
};

export function createReactContextQuery<TAtoms extends Record<string, any>>(
  derivedDefs?: Record<string, any>
) {
  const StoreContext = createStoreContext<TAtoms>();

  const ContextQueryProvider = function ContextQueryProvider({
    children,
    atoms,
  }: PropsWithChildren<{ atoms: AtomValues<TAtoms> }>) {
    const store = useMemo(
      () => {
        const storeValues = derivedDefs
          ? { ...atoms, ...derivedDefs }
          : atoms;
        return new ContextQueryStore<TAtoms>(storeValues);
      },
      [atoms]
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
