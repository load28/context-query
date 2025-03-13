import { createContextQuery } from "@context-query/react";

export const {
  Provider: CounterQueryProvider,
  useContextQuery: useCounterQuery,
} = createContextQuery({
  initialState: {
    count1: 0,
    count2: 0,
    count3: 0,
  },
});
