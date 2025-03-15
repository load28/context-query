import { createContextQuery } from "@context-query/react";

export const {
  Provider: CounterQueryProvider,
  useContextQuery: useCounterQuery,
  updateState: updateCounterState,
  setState: setCounterState,
} = createContextQuery({ count1: 0, count2: 0, count3: 0 });
