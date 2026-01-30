import {
  createUseContextAtom,
  createUseContextAtomValue,
  createUseContextSetAtom,
  createUseStore,
  createUseSnapshot,
  createUseSnapshotValue,
  createUsePatch
} from "./hooks";
import { createReactContextQuery } from "./createProvider";

export function createContextQuery<TAtoms extends Record<string, any>>() {
  const { ContextQueryProvider, StoreContext } =
    createReactContextQuery<TAtoms>();

  const useContextAtom = createUseContextAtom<TAtoms>(StoreContext);
  const useContextAtomValue = createUseContextAtomValue<TAtoms>(StoreContext);
  const useContextSetAtom = createUseContextSetAtom<TAtoms>(StoreContext);
  const useStore = createUseStore<TAtoms>(StoreContext);
  const useSnapshot = createUseSnapshot<TAtoms>(StoreContext);
  const useSnapshotValue = createUseSnapshotValue<TAtoms>(StoreContext);
  const usePatch = createUsePatch<TAtoms>(StoreContext);

  return {
    ContextQueryProvider,
    useContextAtom,
    useContextAtomValue,
    useContextSetAtom,
    useStore,
    useSnapshot,
    useSnapshotValue,
    usePatch,
  };
}
