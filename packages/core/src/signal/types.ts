export const enum ReactiveFlags {
  None = 0,
  Dirty = 1 << 0,
  Pending = 1 << 1,
  Mutable = 1 << 2,
  Watching = 1 << 3,
}

export interface Link {
  dep: ReactiveNode;
  sub: ReactiveNode;
  prevDep: Link | null;
  nextDep: Link | null;
  prevSub: Link | null;
  nextSub: Link | null;
}

export interface ReactiveNode {
  flags: ReactiveFlags;
  deps: Link | null;
  subs: Link | null;
}

export interface SignalOptions<T> {
  equals?: (a: T, b: T) => boolean;
}
