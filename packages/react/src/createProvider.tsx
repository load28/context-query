import { ContextQueryStore, isAtomConfig, atom as atomHelper } from "@context-query/core";
import { isDerivedAtom } from "@context-query/core";
import { PropsWithChildren, useMemo } from "react";
import { createStoreContext } from "./internals/createStoreContext";

type AtomValues<T extends Record<string, any>> = {
  [K in keyof T]: T[K];
};

export function createReactContextQuery<TAtoms extends Record<string, any>>(
  configDefs?: Record<string, any>
) {
  const StoreContext = createStoreContext<TAtoms>();

  const ContextQueryProvider = function ContextQueryProvider({
    children,
    atoms,
  }: PropsWithChildren<{ atoms: AtomValues<TAtoms> }>) {
    const store = useMemo(
      () => {
        if (!configDefs) {
          return new ContextQueryStore<TAtoms>(atoms);
        }

        const storeValues: Record<string, any> = { ...atoms };

        for (const [key, config] of Object.entries(configDefs)) {
          if (isDerivedAtom(config)) {
            storeValues[key] = config;
          } else if (isAtomConfig(config)) {
            // Use Provider's value if available, otherwise definition's initial value
            const initialVal = key in atoms ? (atoms as any)[key] : config.initialValue;
            storeValues[key] = atomHelper(initialVal, {
              equalityFn: config.equalityFn,
            });
          }
        }

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
