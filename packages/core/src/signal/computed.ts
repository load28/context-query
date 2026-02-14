import { ReactiveFlags } from "./types";
import type { ReactiveNode, Link, SignalOptions } from "./types";
import { linkDep, unlinkDep } from "./link";
import { propagate, checkDirty } from "./propagate";

export interface ReactiveComputed<T> extends ReactiveNode {
  _value: T | undefined;
  _fn: () => T;
  _equals: (a: T, b: T) => boolean;
  _version: number;
  error: Error | null;
  get(): T;
  update(): void;
}

export function createComputed<T>(
  fn: () => T,
  options?: SignalOptions<T>,
  trackFn?: (node: ReactiveNode) => void,
  startTrack?: () => Link | null,
  endTrack?: (node: ReactiveNode, prevDeps: Link | null) => void
): ReactiveComputed<T> {
  const equals = options?.equals ?? Object.is;

  const computed: ReactiveComputed<T> = {
    flags: ReactiveFlags.Dirty,
    deps: null,
    subs: null,
    _value: undefined,
    _fn: fn,
    _equals: equals,
    _version: 0,
    error: null,
    get() {
      if (trackFn) {
        trackFn(computed);
      }
      if ((computed.flags & ReactiveFlags.Dirty) !== 0) {
        computed.update();
      } else if ((computed.flags & ReactiveFlags.Pending) !== 0) {
        if (checkDirty(computed)) {
          computed.update();
        }
      }
      return computed._value as T;
    },
    update() {
      const prevDeps = startTrack ? startTrack() : null;
      let newValue: T;
      try {
        newValue = fn();
        computed.error = null;
      } catch (e) {
        computed.error = e instanceof Error ? e : new Error(String(e));
        computed.flags &= ~(ReactiveFlags.Dirty | ReactiveFlags.Pending);
        if (endTrack) {
          endTrack(computed, prevDeps);
        }
        return;
      }

      if (endTrack) {
        endTrack(computed, prevDeps);
      }

      const oldValue = computed._value;
      if (oldValue === undefined || !equals(oldValue, newValue)) {
        computed._value = newValue;
        computed._version++;
        computed.flags &= ~(ReactiveFlags.Dirty | ReactiveFlags.Pending);
        if (computed.subs) {
          // Mark subs as dirty since our value actually changed
          let link = computed.subs;
          while (link) {
            link.sub.flags |= ReactiveFlags.Dirty;
            link.sub.flags &= ~ReactiveFlags.Pending;
            link = link.nextSub;
          }
        }
      } else {
        computed.flags &= ~(ReactiveFlags.Dirty | ReactiveFlags.Pending);
      }
    },
  };

  return computed;
}
