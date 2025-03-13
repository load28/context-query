import { ContextQueryStore, TStateImpl } from "@context-query/core";
import { createUseContextQuery } from "./hooks";
import { createReactContextQuery } from "./provider";

export type ContextQueryOptions<TState extends TStateImpl> = {
  initialState: TState;
};

export function createContextQuery<TState extends TStateImpl>(
  options: ContextQueryOptions<TState> = { initialState: {} as TState }
) {
  const initialState = options.initialState || ({} as TState);
  const store = new ContextQueryStore<TState>(initialState);

  const { Provider, contexts } = createReactContextQuery<TState>(() => store);

  const useContextQuery = createUseContextQuery<TState>(contexts);

  return {
    Provider,
    useContextQuery,
  };
}
