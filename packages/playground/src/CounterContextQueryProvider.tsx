import { createContextQuery } from "@context-query/react";
import { atom, derived } from "@context-query/core";

const definitions = {
  count: atom(0),
  step: atom(1),
  label: atom("Counter"),
  doubleCount: derived((get) => (get("count") as number) * 2),
  total: derived((get) => (get("count") as number) * (get("step") as number)),
};

export const {
  ContextQueryProvider: PlaygroundProvider,
  useContextAtom,
  useContextAtomValue,
  useContextSetAtom,
  useContextAtomSelector,
  useStore,
  useSnapshot,
  useSnapshotValue,
  usePatch,
  useResetAtom,
  useAtomError,
} = createContextQuery(definitions);

// Legacy simple provider for comparison demo
type SimpleCounterAtoms = {
  counterA: number;
  counterB: number;
  counterC: number;
};

export const {
  ContextQueryProvider: SimpleProvider,
  useContextAtom: useSimpleAtom,
  useContextAtomValue: useSimpleValue,
  useContextSetAtom: useSimpleSetAtom,
} = createContextQuery<SimpleCounterAtoms>();
