import { 
  createUseContextAtom, 
  createUseContextAtomValue, 
  createUseContextSetAtom,
  createUseStore,
  createUseAllAtoms,
  createUseAllAtomsValue,
  createUseUpdateAllAtoms
} from "./hooks";
import { createReactContextQuery } from "./provider";

export function createContextQuery<TAtoms extends Record<string, any>>() {
  const { ContextQueryProvider, StoreContext } =
    createReactContextQuery<TAtoms>();
  
  const useContextAtom = createUseContextAtom<TAtoms>(StoreContext);
  const useContextAtomValue = createUseContextAtomValue<TAtoms>(StoreContext);
  const useContextSetAtom = createUseContextSetAtom<TAtoms>(StoreContext);
  const useStore = createUseStore<TAtoms>(StoreContext);
  const useAllAtoms = createUseAllAtoms<TAtoms>(StoreContext);
  const useAllAtomsValue = createUseAllAtomsValue<TAtoms>(StoreContext);
  const useUpdateAllAtoms = createUseUpdateAllAtoms<TAtoms>(StoreContext);
  
  return {
    ContextQueryProvider,
    useContextAtom,
    useContextAtomValue,
    useContextSetAtom,
    useStore,
    useAllAtoms,
    useAllAtomsValue,
    useUpdateAllAtoms,
  };
}
