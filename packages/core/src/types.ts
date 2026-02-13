import type { DerivedAtomConfig } from "./derived";
import type { AtomConfig } from "./atom";

export type Subscription = {
  unsubscribe: () => void;
};

export type Listener<T> = (value: T) => void;
export type AtomListener = () => void;
export type Updater<TAtoms> = (atoms: TAtoms) => Partial<TAtoms>;
export type TStateImpl = Record<string, any>;
export type TAtoms = Record<string, any>;

export const RESET: unique symbol = Symbol('RESET');
export type RESET = typeof RESET;

/** Extract the resolved value type from an atom definition */
export type ResolveAtomValue<T> =
  T extends DerivedAtomConfig<infer V> ? V :
  T extends AtomConfig<infer V> ? V :
  T;

/** Resolve all atom values in a definition record */
export type ResolvedAtoms<TDef extends Record<string, any>> = {
  [K in keyof TDef]: ResolveAtomValue<TDef[K]>;
};

/** Keys of writable (non-derived) atoms */
export type WritableAtomKeys<TDef extends Record<string, any>> = {
  [K in keyof TDef]: TDef[K] extends DerivedAtomConfig<any> ? never : K;
}[keyof TDef];

/** Keys of derived (read-only) atoms */
export type DerivedAtomKeys<TDef extends Record<string, any>> = {
  [K in keyof TDef]: TDef[K] extends DerivedAtomConfig<any> ? K : never;
}[keyof TDef];
