import { TStateImpl } from "@context-query/core";
import { createUseContextQuery } from "./hooks";
import { createReactContextQuery } from "./provider";

export function createContextQuery<TState extends TStateImpl>() {
  const { Provider, contexts } = createReactContextQuery<TState>();

  const useContextQuery = createUseContextQuery<TState>(contexts);

  return {
    Provider,
    useContextQuery,
  };
}
