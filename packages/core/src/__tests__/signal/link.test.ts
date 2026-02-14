import { describe, it, expect } from "vitest";
import { ReactiveFlags } from "../../signal/types";
import { linkDep, unlinkDep } from "../../signal/link";
import type { ReactiveNode, Link } from "../../signal/types";

function createNode(flags = ReactiveFlags.None): ReactiveNode {
  return { flags, deps: null, subs: null };
}

function collectSubs(node: ReactiveNode): ReactiveNode[] {
  const result: ReactiveNode[] = [];
  let link = node.subs;
  while (link) {
    result.push(link.sub);
    link = link.nextSub;
  }
  return result;
}

function collectDeps(node: ReactiveNode): ReactiveNode[] {
  const result: ReactiveNode[] = [];
  let link = node.deps;
  while (link) {
    result.push(link.dep);
    link = link.nextDep;
  }
  return result;
}

describe("ReactiveFlags", () => {
  it("should define correct bit values", () => {
    expect(ReactiveFlags.None).toBe(0);
    expect(ReactiveFlags.Dirty).toBe(1);
    expect(ReactiveFlags.Pending).toBe(2);
    expect(ReactiveFlags.Mutable).toBe(4);
    expect(ReactiveFlags.Watching).toBe(8);
  });

  it("should support setting flags with |=", () => {
    const node = createNode();
    node.flags |= ReactiveFlags.Dirty;
    expect((node.flags & ReactiveFlags.Dirty) !== 0).toBe(true);
    expect((node.flags & ReactiveFlags.Pending) !== 0).toBe(false);
  });

  it("should support clearing flags with &= ~", () => {
    const node = createNode();
    node.flags |= ReactiveFlags.Dirty;
    node.flags |= ReactiveFlags.Pending;
    node.flags &= ~ReactiveFlags.Dirty;
    expect((node.flags & ReactiveFlags.Dirty) !== 0).toBe(false);
    expect((node.flags & ReactiveFlags.Pending) !== 0).toBe(true);
  });

  it("should support compound flags", () => {
    const node = createNode();
    node.flags |= ReactiveFlags.Dirty;
    node.flags |= ReactiveFlags.Mutable;
    node.flags |= ReactiveFlags.Watching;
    expect((node.flags & ReactiveFlags.Dirty) !== 0).toBe(true);
    expect((node.flags & ReactiveFlags.Mutable) !== 0).toBe(true);
    expect((node.flags & ReactiveFlags.Watching) !== 0).toBe(true);
    expect((node.flags & ReactiveFlags.Pending) !== 0).toBe(false);
  });
});

describe("linkDep", () => {
  it("should link first subscriber to empty dep", () => {
    const dep = createNode();
    const sub = createNode();

    const link = linkDep(dep, sub);

    expect(dep.subs).toBe(link);
    expect(sub.deps).toBe(link);
    expect(link.dep).toBe(dep);
    expect(link.sub).toBe(sub);
    expect(link.nextSub).toBeNull();
    expect(link.prevSub).toBeNull();
    expect(link.nextDep).toBeNull();
    expect(link.prevDep).toBeNull();
  });

  it("should prepend to subs list", () => {
    const dep = createNode();
    const sub1 = createNode();
    const sub2 = createNode();
    const sub3 = createNode();

    linkDep(dep, sub1);
    linkDep(dep, sub2);
    linkDep(dep, sub3);

    expect(collectSubs(dep)).toEqual([sub3, sub2, sub1]);
  });

  it("should prepend to deps list", () => {
    const dep1 = createNode();
    const dep2 = createNode();
    const dep3 = createNode();
    const sub = createNode();

    linkDep(dep1, sub);
    linkDep(dep2, sub);
    linkDep(dep3, sub);

    expect(collectDeps(sub)).toEqual([dep3, dep2, dep1]);
  });

  it("should maintain bidirectional references", () => {
    const dep = createNode();
    const sub = createNode();

    const link = linkDep(dep, sub);

    expect(dep.subs).toBe(link);
    expect(sub.deps).toBe(link);
    expect(link.dep).toBe(dep);
    expect(link.sub).toBe(sub);
  });

  it("should handle multiple subs per dep with correct prev/next", () => {
    const dep = createNode();
    const sub1 = createNode();
    const sub2 = createNode();

    const link1 = linkDep(dep, sub1);
    const link2 = linkDep(dep, sub2);

    expect(dep.subs).toBe(link2);
    expect(link2.nextSub).toBe(link1);
    expect(link1.prevSub).toBe(link2);
    expect(link2.prevSub).toBeNull();
    expect(link1.nextSub).toBeNull();
  });

  it("should handle multiple deps per sub with correct prev/next", () => {
    const dep1 = createNode();
    const dep2 = createNode();
    const sub = createNode();

    const link1 = linkDep(dep1, sub);
    const link2 = linkDep(dep2, sub);

    expect(sub.deps).toBe(link2);
    expect(link2.nextDep).toBe(link1);
    expect(link1.prevDep).toBe(link2);
    expect(link2.prevDep).toBeNull();
    expect(link1.nextDep).toBeNull();
  });
});

describe("unlinkDep", () => {
  it("should remove sole link from dep and sub", () => {
    const dep = createNode();
    const sub = createNode();

    const link = linkDep(dep, sub);
    unlinkDep(link);

    expect(dep.subs).toBeNull();
    expect(sub.deps).toBeNull();
  });

  it("should remove head link from subs list", () => {
    const dep = createNode();
    const sub1 = createNode();
    const sub2 = createNode();

    linkDep(dep, sub1);
    const link2 = linkDep(dep, sub2);

    unlinkDep(link2);

    expect(collectSubs(dep)).toEqual([sub1]);
    expect(dep.subs!.prevSub).toBeNull();
  });

  it("should remove tail link from subs list", () => {
    const dep = createNode();
    const sub1 = createNode();
    const sub2 = createNode();

    const link1 = linkDep(dep, sub1);
    linkDep(dep, sub2);

    unlinkDep(link1);

    expect(collectSubs(dep)).toEqual([sub2]);
    expect(dep.subs!.nextSub).toBeNull();
  });

  it("should remove middle link from subs list", () => {
    const dep = createNode();
    const sub1 = createNode();
    const sub2 = createNode();
    const sub3 = createNode();

    linkDep(dep, sub1);
    const link2 = linkDep(dep, sub2);
    linkDep(dep, sub3);

    unlinkDep(link2);

    expect(collectSubs(dep)).toEqual([sub3, sub1]);
  });

  it("should remove head link from deps list", () => {
    const dep1 = createNode();
    const dep2 = createNode();
    const sub = createNode();

    linkDep(dep1, sub);
    const link2 = linkDep(dep2, sub);

    unlinkDep(link2);

    expect(collectDeps(sub)).toEqual([dep1]);
    expect(sub.deps!.prevDep).toBeNull();
  });

  it("should remove tail link from deps list", () => {
    const dep1 = createNode();
    const dep2 = createNode();
    const sub = createNode();

    const link1 = linkDep(dep1, sub);
    linkDep(dep2, sub);

    unlinkDep(link1);

    expect(collectDeps(sub)).toEqual([dep2]);
    expect(sub.deps!.nextDep).toBeNull();
  });

  it("should clear link pointers after removal", () => {
    const dep = createNode();
    const sub = createNode();

    const link = linkDep(dep, sub);
    unlinkDep(link);

    expect(link.prevSub).toBeNull();
    expect(link.nextSub).toBeNull();
    expect(link.prevDep).toBeNull();
    expect(link.nextDep).toBeNull();
  });

  it("should handle removing all links one by one", () => {
    const dep = createNode();
    const sub1 = createNode();
    const sub2 = createNode();
    const sub3 = createNode();

    const link1 = linkDep(dep, sub1);
    const link2 = linkDep(dep, sub2);
    const link3 = linkDep(dep, sub3);

    unlinkDep(link2);
    expect(collectSubs(dep)).toEqual([sub3, sub1]);

    unlinkDep(link3);
    expect(collectSubs(dep)).toEqual([sub1]);

    unlinkDep(link1);
    expect(dep.subs).toBeNull();
  });

  it("should maintain integrity with complex graph", () => {
    const depA = createNode();
    const depB = createNode();
    const sub1 = createNode();
    const sub2 = createNode();

    const linkA1 = linkDep(depA, sub1);
    const linkA2 = linkDep(depA, sub2);
    const linkB1 = linkDep(depB, sub1);
    const linkB2 = linkDep(depB, sub2);

    unlinkDep(linkA2);

    expect(collectSubs(depA)).toEqual([sub1]);
    expect(collectSubs(depB)).toEqual([sub2, sub1]);
    expect(collectDeps(sub1)).toEqual([depB, depA]);
    expect(collectDeps(sub2)).toEqual([depB]);

    unlinkDep(linkB1);

    expect(collectSubs(depB)).toEqual([sub2]);
    expect(collectDeps(sub1)).toEqual([depA]);
  });
});
