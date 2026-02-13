import type { FC, PropsWithChildren } from "react";
import type {
  ContextQueryStore,
  DerivedAtomConfig,
  ResolvedAtoms,
  WritableAtomKeys,
} from "@context-query/core";
import { isDerivedAtom, isAtomConfig } from "@context-query/core";
import {
  createUseContextAtom,
  createUseContextAtomValue,
  createUseContextSetAtom,
  createUseContextAtomSelector,
  createUseStore,
  createUseSnapshot,
  createUseSnapshotValue,
  createUsePatch,
  createUseResetAtom,
} from "./hooks";
import { createReactContextQuery } from "./createProvider";

type Setter<T> = (value: T | ((prev: T) => T)) => void;

/** Result type for the legacy API (no definitions, no derived atoms) */
type LegacyResult<TAtoms extends Record<string, any>> = {
  ContextQueryProvider: FC<PropsWithChildren<{ atoms: TAtoms }>>;
  useContextAtom: <K extends keyof TAtoms & string>(key: K) => [TAtoms[K], Setter<TAtoms[K]>];
  useContextAtomValue: <K extends keyof TAtoms & string>(key: K) => TAtoms[K];
  useContextSetAtom: <K extends keyof TAtoms & string>(key: K) => Setter<TAtoms[K]>;
  useContextAtomSelector: <K extends keyof TAtoms & string, R>(
    key: K,
    selector: (value: TAtoms[K]) => R,
    equalityFn?: (a: R, b: R) => boolean
  ) => R;
  useStore: () => ContextQueryStore<TAtoms>;
  useSnapshot: () => [TAtoms, (newAtoms: Partial<TAtoms>) => void];
  useSnapshotValue: () => TAtoms;
  usePatch: () => (newAtoms: Partial<TAtoms>) => void;
  useResetAtom: <K extends keyof TAtoms & string>(key: K) => () => void;
};

/** Result type for the definitions API (with derived/atom config support) */
type DefinitionsResult<TDef extends Record<string, any>> = {
  ContextQueryProvider: FC<PropsWithChildren<{
    atoms: { [K in WritableAtomKeys<TDef>]: ResolvedAtoms<TDef>[K] };
  }>>;
  useContextAtom: <K extends WritableAtomKeys<TDef> & string>(
    key: K
  ) => [ResolvedAtoms<TDef>[K], Setter<ResolvedAtoms<TDef>[K]>];
  useContextAtomValue: <K extends keyof ResolvedAtoms<TDef> & string>(
    key: K
  ) => ResolvedAtoms<TDef>[K];
  useContextSetAtom: <K extends WritableAtomKeys<TDef> & string>(
    key: K
  ) => Setter<ResolvedAtoms<TDef>[K]>;
  useContextAtomSelector: <K extends keyof ResolvedAtoms<TDef> & string, R>(
    key: K,
    selector: (value: ResolvedAtoms<TDef>[K]) => R,
    equalityFn?: (a: R, b: R) => boolean
  ) => R;
  useStore: () => ContextQueryStore<ResolvedAtoms<TDef>>;
  useSnapshot: () => [
    ResolvedAtoms<TDef>,
    (newAtoms: Partial<{ [K in WritableAtomKeys<TDef>]: ResolvedAtoms<TDef>[K] }>) => void
  ];
  useSnapshotValue: () => ResolvedAtoms<TDef>;
  usePatch: () => (
    newAtoms: Partial<{ [K in WritableAtomKeys<TDef>]: ResolvedAtoms<TDef>[K] }>
  ) => void;
  useResetAtom: <K extends WritableAtomKeys<TDef> & string>(key: K) => () => void;
};

// Overload 1: Legacy API — no arguments, explicit type parameter
export function createContextQuery<TAtoms extends Record<string, any>>(): LegacyResult<TAtoms>;

// Overload 2: Definitions API — pass atom definitions including derived()/atom()
export function createContextQuery<TDef extends Record<string, any>>(
  definitions: TDef
): DefinitionsResult<TDef>;

// Implementation
export function createContextQuery(definitions?: Record<string, any>) {
  // Extract config definitions (derived + atom with options)
  let configDefs: Record<string, any> | undefined;

  if (definitions) {
    configDefs = {};
    for (const [key, value] of Object.entries(definitions)) {
      if (isDerivedAtom(value) || isAtomConfig(value)) {
        configDefs[key] = value;
      }
    }
    if (Object.keys(configDefs).length === 0) {
      configDefs = undefined;
    }
  }

  const { ContextQueryProvider, StoreContext } =
    createReactContextQuery<any>(configDefs);

  const useContextAtom = createUseContextAtom<any>(StoreContext);
  const useContextAtomValue = createUseContextAtomValue<any>(StoreContext);
  const useContextSetAtom = createUseContextSetAtom<any>(StoreContext);
  const useContextAtomSelector = createUseContextAtomSelector<any>(StoreContext);
  const useStore = createUseStore<any>(StoreContext);
  const useSnapshot = createUseSnapshot<any>(StoreContext);
  const useSnapshotValue = createUseSnapshotValue<any>(StoreContext);
  const usePatch = createUsePatch<any>(StoreContext);
  const useResetAtom = createUseResetAtom<any>(StoreContext);

  return {
    ContextQueryProvider,
    useContextAtom,
    useContextAtomValue,
    useContextSetAtom,
    useContextAtomSelector,
    useStore,
    useSnapshot,
    useSnapshotValue,
    usePatch,
    useResetAtom,
  };
}
