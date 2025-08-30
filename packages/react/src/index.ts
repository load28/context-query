import { TStateImpl } from "@context-query/core";
import { createUseContextQuery } from "./hooks";
import { createReactContextQuery } from "./provider";

export function createContextQuery<TState extends TStateImpl>() {
  const { ContextQueryProvider, StoreContext } =
    createReactContextQuery<TState>();
  const useContextQuery = createUseContextQuery<TState>(StoreContext);
  return {
    ContextQueryProvider,
    useContextQuery,
  };
}
