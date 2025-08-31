import { 
  createUseContextAtom, 
  createUseContextAtomValue, 
  createUseContextSetAtom 
} from "./hooks";
import { createReactContextQuery } from "./provider";

export function createContextQuery<TAtoms extends Record<string, any>>() {
  const { ContextQueryProvider, StoreContext } =
    createReactContextQuery<TAtoms>();
  
  const useContextAtom = createUseContextAtom<TAtoms>(StoreContext);
  const useContextAtomValue = createUseContextAtomValue<TAtoms>(StoreContext);
  const useContextSetAtom = createUseContextSetAtom<TAtoms>(StoreContext);
  
  return {
    ContextQueryProvider,
    useContextAtom,
    useContextAtomValue,
    useContextSetAtom,
  };
}
