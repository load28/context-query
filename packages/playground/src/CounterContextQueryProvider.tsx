import { createContextQuery } from "@context-query/react";

export const {
  Provider: CounterQueryProvider,
  useContextQuery: useCounterQuery,
} = createContextQuery<{
  count1: number;
  count2: number;
  count3: number;
}>();
