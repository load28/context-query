export type Subscription = {
  unsubscribe: () => void;
};

export type Listener<T> = (value: T) => void;
/** useSyncExternalStore 호환을 위해 인자 없이 호출되는 리스너 */
export type AtomListener = () => void;
export type Updater<TAtoms> = (atoms: TAtoms) => Partial<TAtoms>;
export type TStateImpl = Record<string, any>;
export type TAtoms = Record<string, any>;
