import { createContextQuery } from "@context-query/react";

type CounterAtoms = {
  primaryCounter: {
    name: string;
    value: number;
    description: string;
    dependencies: string[];
  };
  secondaryCounter: {
    name: string;
    value: number;
    description: string;
  };
  tertiaryCounter: {
    name: string;
    value: number;
    description: string;
  };
};

export const {
  ContextQueryProvider: CounterQueryProvider,
  useContextAtom: useCounterAtom,
  useContextAtomValue: useCounterAtomValue,
  useContextSetAtom: useCounterSetAtom,
} = createContextQuery<CounterAtoms>();
