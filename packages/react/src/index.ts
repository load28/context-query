import type { FC, PropsWithChildren } from "react";
import type {
  ContextQueryStore,
  DerivedAtomConfig,
  ResolvedAtoms,
  WritableAtomKeys,
} from "@context-query/core";
import { isDerivedAtom } from "@context-query/core";
import {
  createUseContextAtom,
  createUseContextAtomValue,
  createUseContextSetAtom,
  createUseStore,
  createUseSnapshot,
  createUseSnapshotValue,
  createUsePatch
} from "./hooks";
import { createReactContextQuery } from "./createProvider";

type Setter<T> = (value: T | ((prev: T) => T)) => void;

/** Result type for the legacy API (no definitions, no derived atoms) */
type LegacyResult<TAtoms extends Record<string, any>> = {
  ContextQueryProvider: FC<PropsWithChildren<{ atoms: TAtoms }>>;
  useContextAtom: <K extends keyof TAtoms & string>(key: K) => [TAtoms[K], Setter<TAtoms[K]>];
  useContextAtomValue: <K extends keyof TAtoms & string>(key: K) => TAtoms[K];
  useContextSetAtom: <K extends keyof TAtoms & string>(key: K) => Setter<TAtoms[K]>;
  useStore: () => ContextQueryStore<TAtoms>;
  useSnapshot: () => [TAtoms, (newAtoms: Partial<TAtoms>) => void];
  useSnapshotValue: () => TAtoms;
  usePatch: () => (newAtoms: Partial<TAtoms>) => void;
};

/** Result type for the definitions API (with derived atom support) */
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
  useStore: () => ContextQueryStore<ResolvedAtoms<TDef>>;
  useSnapshot: () => [
    ResolvedAtoms<TDef>,
    (newAtoms: Partial<{ [K in WritableAtomKeys<TDef>]: ResolvedAtoms<TDef>[K] }>) => void
  ];
  useSnapshotValue: () => ResolvedAtoms<TDef>;
  usePatch: () => (
    newAtoms: Partial<{ [K in WritableAtomKeys<TDef>]: ResolvedAtoms<TDef>[K] }>
  ) => void;
};

// Overload 1: Legacy API — no arguments, explicit type parameter
export function createContextQuery<TAtoms extends Record<string, any>>(): LegacyResult<TAtoms>;

// Overload 2: Definitions API — pass atom definitions including derived()
export function createContextQuery<TDef extends Record<string, any>>(
  definitions: TDef
): DefinitionsResult<TDef>;

// Implementation
export function createContextQuery(definitions?: Record<string, any>) {
  // Split derived configs from definitions
  let derivedDefs: Record<string, any> | undefined;

  if (definitions) {
    derivedDefs = {};
    for (const [key, value] of Object.entries(definitions)) {
      if (isDerivedAtom(value)) {
        derivedDefs[key] = value;
      }
    }
    if (Object.keys(derivedDefs).length === 0) {
      derivedDefs = undefined;
    }
  }

  const { ContextQueryProvider, StoreContext } =
    createReactContextQuery<any>(derivedDefs);

  const useContextAtom = createUseContextAtom<any>(StoreContext);
  const useContextAtomValue = createUseContextAtomValue<any>(StoreContext);
  const useContextSetAtom = createUseContextSetAtom<any>(StoreContext);
  const useStore = createUseStore<any>(StoreContext);
  const useSnapshot = createUseSnapshot<any>(StoreContext);
  const useSnapshotValue = createUseSnapshotValue<any>(StoreContext);
  const usePatch = createUsePatch<any>(StoreContext);

  return {
    ContextQueryProvider,
    useContextAtom,
    useContextAtomValue,
    useContextSetAtom,
    useStore,
    useSnapshot,
    useSnapshotValue,
    usePatch,
  };
}
