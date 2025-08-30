import { createContextQuery } from "@context-query/react";

export const {
  ContextQueryProvider: CounterQueryProvider,
  useContextQuery: useCounterQuery,
  useContextSetter: useCounterSetter,
} = createContextQuery();
