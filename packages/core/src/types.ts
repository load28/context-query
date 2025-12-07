export type Subscription = {
  unsubscribe: () => void;
};

export type Listener<T> = (value: T) => void;
export type AtomListener = () => void;
export type Updater<TAtoms> = (atoms: TAtoms) => Partial<TAtoms>;
export type TStateImpl = Record<string, any>;
export type TAtoms = Record<string, any>;
