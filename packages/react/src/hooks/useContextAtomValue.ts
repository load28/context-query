import { useDebugValue } from "react";
import { createStoreContext } from "../internals/createStoreContext";
import { createUseStoreContext } from "../internals/useStoreContext";
import { useAtomSubscription } from "../internals/useAtomSubscription";

export function createUseContextAtomValue<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return <TKey extends keyof TAtoms>(key: TKey): TAtoms[TKey] => {
    const store = useStoreContext();
    const value = useAtomSubscription(store, key);

    useDebugValue({ key, value });

    return value;
  };
}
