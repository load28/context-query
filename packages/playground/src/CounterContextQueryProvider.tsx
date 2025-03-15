import { createContextQuery } from "@context-query/react";

export const {
  Provider: CounterQueryProvider,
  useContextQuery: useCounterQuery,
  useContextBatchQuery: useCounterBatchQuery,
} = createContextQuery<{
  count1: number;
  count2: number;
  count3: number;
}>();
