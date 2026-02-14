import { ReactiveFlags } from "./types";
import type { ReactiveNode, Link } from "./types";

/**
 * Non-recursive propagation of Dirty/Pending flags through the dependency graph.
 * Uses iterative while-loop to avoid stack overflow on deep dependency chains.
 *
 * When a signal value changes, propagate() walks all subscribers:
 * - Direct subscribers of a Mutable node → Dirty
 * - Subscribers of a non-Mutable (Computed) node → Pending
 *
 * If onNotify is provided, it is called for every leaf node (no subs) or
 * node with Watching flag that gets marked Dirty or Pending.
 */
export function propagate(
  node: ReactiveNode,
  onNotify?: (node: ReactiveNode) => void
): void {
  let link = node.subs;
  let stack: Link | null = null;

  while (link) {
    const sub = link.sub;
    const prevFlags = sub.flags;

    if (
      !(
        prevFlags & (ReactiveFlags.Dirty | ReactiveFlags.Pending)
      )
    ) {
      if ((node.flags & ReactiveFlags.Mutable) !== 0) {
        sub.flags |= ReactiveFlags.Dirty;
      } else {
        sub.flags |= ReactiveFlags.Pending;
      }

      if (sub.subs) {
        // Has subscribers — descend unless it's a Watching node (effect)
        if ((sub.flags & ReactiveFlags.Watching) !== 0 && onNotify) {
          onNotify(sub);
        } else {
          if (link.nextSub) {
            link.nextSub.prevSub = null;
            (link as any)._stackNext = stack;
            stack = link;
          }
          node = sub;
          link = sub.subs;
          continue;
        }
      } else {
        // Leaf node — notify if watching
        if ((sub.flags & ReactiveFlags.Watching) !== 0 && onNotify) {
          onNotify(sub);
        }
      }
    }

    link = link.nextSub;

    while (!link && stack) {
      const saved = stack;
      stack = (saved as any)._stackNext ?? null;
      (saved as any)._stackNext = undefined;
      if (saved.nextSub) {
        saved.nextSub.prevSub = saved;
      }
      node = saved.dep;
      link = saved.nextSub;
    }
  }
}

/**
 * Non-recursive check if a Pending node is actually Dirty.
 * Walks up the dependency chain pulling fresh values from Computed nodes.
 * Returns true if the node needs recomputation.
 */
export function checkDirty(node: ReactiveNode): boolean {
  let link = node.deps;
  let stack: Link | null = null;

  while (link) {
    const dep = link.dep;

    if ((dep.flags & ReactiveFlags.Dirty) !== 0) {
      if ((dep as any).update) {
        (dep as any).update();
      }
      if ((node.flags & ReactiveFlags.Dirty) !== 0) {
        clearPendingUp(stack);
        return true;
      }
    } else if ((dep.flags & ReactiveFlags.Pending) !== 0) {
      if (dep.deps) {
        if (link.nextDep) {
          (link as any)._stackNext = stack;
          stack = link;
        }
        node = dep;
        link = dep.deps;
        continue;
      }
    }

    dep.flags &= ~ReactiveFlags.Pending;

    link = link.nextDep;

    while (!link && stack) {
      const saved = stack;
      stack = (saved as any)._stackNext ?? null;
      (saved as any)._stackNext = undefined;
      node = saved.sub;
      const savedDep = saved.dep;
      savedDep.flags &= ~ReactiveFlags.Pending;
      link = saved.nextDep;
    }
  }

  node.flags &= ~ReactiveFlags.Pending;
  return false;
}

function clearPendingUp(stack: Link | null): void {
  while (stack) {
    const saved = stack;
    stack = (saved as any)._stackNext ?? null;
    (saved as any)._stackNext = undefined;
    saved.dep.flags &= ~ReactiveFlags.Pending;
  }
}
