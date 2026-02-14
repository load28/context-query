import { ReactiveFlags } from "./types";
import type { ReactiveNode, Link } from "./types";
import { unlinkDep } from "./link";

export interface ReactiveEffect extends ReactiveNode {
  _fn: () => void | (() => void);
  _cleanup: (() => void) | null;
  _active: boolean;
  run(): void;
  dispose(): void;
}

export function createEffect(
  fn: () => void | (() => void),
  trackFn?: (node: ReactiveNode) => void,
  startTrack?: () => Link | null,
  endTrack?: (node: ReactiveNode, prevDeps: Link | null) => void,
  notifyFn?: (effect: ReactiveEffect) => void
): ReactiveEffect {
  const effect: ReactiveEffect = {
    flags: ReactiveFlags.Dirty | ReactiveFlags.Watching,
    deps: null,
    subs: null,
    _fn: fn,
    _cleanup: null,
    _active: true,
    run() {
      if (!effect._active) return;

      if (effect._cleanup) {
        effect._cleanup();
        effect._cleanup = null;
      }

      const prevDeps = startTrack ? startTrack() : null;
      try {
        const cleanup = fn();
        if (typeof cleanup === "function") {
          effect._cleanup = cleanup;
        }
      } finally {
        if (endTrack) {
          endTrack(effect, prevDeps);
        }
      }

      effect.flags &= ~ReactiveFlags.Dirty;
    },
    dispose() {
      effect._active = false;
      if (effect._cleanup) {
        effect._cleanup();
        effect._cleanup = null;
      }
      // Remove all dependency links
      let link = effect.deps;
      while (link) {
        const next = link.nextDep;
        unlinkDep(link);
        link = next;
      }
      effect.deps = null;
      effect.flags &= ~ReactiveFlags.Watching;
    },
  };

  return effect;
}
