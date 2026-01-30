import { createStoreContext } from "../context";
import { createUseStoreContext } from "../use-store-context";
import { useAtomSubscription } from "../use-atom-subscription";

export function createUseContextAtomValue<TAtoms extends Record<string, any>>(
  StoreContext: ReturnType<typeof createStoreContext<TAtoms>>
) {
  const useStoreContext = createUseStoreContext<TAtoms>(StoreContext);

  return <TKey extends keyof TAtoms>(key: TKey): TAtoms[TKey] => {
    const store = useStoreContext();
    return useAtomSubscription(store, key);
  };
}
