import type { Link, ReactiveNode } from "./types";

export function linkDep(dep: ReactiveNode, sub: ReactiveNode): Link {
  const link: Link = {
    dep,
    sub,
    prevDep: null,
    nextDep: null,
    prevSub: null,
    nextSub: null,
  };

  if (dep.subs) {
    dep.subs.prevSub = link;
  }
  link.nextSub = dep.subs;
  dep.subs = link;

  if (sub.deps) {
    sub.deps.prevDep = link;
  }
  link.nextDep = sub.deps;
  sub.deps = link;

  return link;
}

export function unlinkDep(link: Link): void {
  const { dep, sub, prevSub, nextSub, prevDep, nextDep } = link;

  if (prevSub) {
    prevSub.nextSub = nextSub;
  } else {
    dep.subs = nextSub;
  }
  if (nextSub) {
    nextSub.prevSub = prevSub;
  }

  if (prevDep) {
    prevDep.nextDep = nextDep;
  } else {
    sub.deps = nextDep;
  }
  if (nextDep) {
    nextDep.prevDep = prevDep;
  }

  link.prevSub = null;
  link.nextSub = null;
  link.prevDep = null;
  link.nextDep = null;
}
