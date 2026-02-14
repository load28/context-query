import { describe, it, expect } from "vitest";
import { ReactiveFlags } from "../../signal/types";
import { linkDep } from "../../signal/link";
import { propagate, checkDirty } from "../../signal/propagate";
import type { ReactiveNode } from "../../signal/types";

function createNode(
  flags = ReactiveFlags.None
): ReactiveNode & { update?: () => void } {
  return { flags, deps: null, subs: null };
}

function createMutableNode(): ReactiveNode {
  return { flags: ReactiveFlags.Mutable, deps: null, subs: null };
}

describe("propagate", () => {
  it("should mark direct subscribers of Mutable node as Dirty", () => {
    const signal = createMutableNode();
    const sub1 = createNode();
    const sub2 = createNode();

    linkDep(signal, sub1);
    linkDep(signal, sub2);

    propagate(signal);

    expect((sub1.flags & ReactiveFlags.Dirty) !== 0).toBe(true);
    expect((sub2.flags & ReactiveFlags.Dirty) !== 0).toBe(true);
  });

  it("should mark subscribers of non-Mutable node as Pending", () => {
    const computed = createNode();
    const sub = createNode();

    linkDep(computed, sub);

    propagate(computed);

    expect((sub.flags & ReactiveFlags.Pending) !== 0).toBe(true);
    expect((sub.flags & ReactiveFlags.Dirty) !== 0).toBe(false);
  });

  it("should propagate through deep chain without recursion", () => {
    const nodes: ReactiveNode[] = [];
    // Create chain: signal → node1 → node2 → ... → node100
    const signal = createMutableNode();
    nodes.push(signal);

    let prev = signal;
    for (let i = 0; i < 100; i++) {
      const node = createNode();
      linkDep(prev, node);
      nodes.push(node);
      prev = node;
    }

    propagate(signal);

    // First sub should be Dirty (direct sub of Mutable)
    expect((nodes[1].flags & ReactiveFlags.Dirty) !== 0).toBe(true);
    // Deeper nodes should be Pending (subs of non-Mutable)
    for (let i = 2; i < nodes.length; i++) {
      expect((nodes[i].flags & ReactiveFlags.Pending) !== 0).toBe(true);
    }
  });

  it("should not re-mark already Dirty nodes", () => {
    const signal = createMutableNode();
    const sub = createNode();
    sub.flags |= ReactiveFlags.Dirty;

    linkDep(signal, sub);

    propagate(signal);

    // Should still be Dirty, not double-marked
    expect((sub.flags & ReactiveFlags.Dirty) !== 0).toBe(true);
  });

  it("should handle diamond shape: A → B, C → D", () => {
    const A = createMutableNode();
    const B = createNode();
    const C = createNode();
    const D = createNode();

    linkDep(A, B);
    linkDep(A, C);
    linkDep(B, D);
    linkDep(C, D);

    propagate(A);

    expect((B.flags & ReactiveFlags.Dirty) !== 0).toBe(true);
    expect((C.flags & ReactiveFlags.Dirty) !== 0).toBe(true);
    // D gets marked via B first (Pending since B is not Mutable)
    expect(
      (D.flags & (ReactiveFlags.Dirty | ReactiveFlags.Pending)) !== 0
    ).toBe(true);
  });

  it("should handle branching dependencies", () => {
    const signal = createMutableNode();
    const a = createNode();
    const b = createNode();
    const c = createNode();
    const d = createNode();

    linkDep(signal, a);
    linkDep(signal, b);
    linkDep(a, c);
    linkDep(b, d);

    propagate(signal);

    expect((a.flags & ReactiveFlags.Dirty) !== 0).toBe(true);
    expect((b.flags & ReactiveFlags.Dirty) !== 0).toBe(true);
    expect((c.flags & ReactiveFlags.Pending) !== 0).toBe(true);
    expect((d.flags & ReactiveFlags.Pending) !== 0).toBe(true);
  });

  it("should handle 100-depth chain without stack overflow", () => {
    const signal = createMutableNode();
    let prev: ReactiveNode = signal;

    for (let i = 0; i < 100; i++) {
      const node = createNode();
      linkDep(prev, node);
      prev = node;
    }

    expect(() => propagate(signal)).not.toThrow();
  });
});

describe("checkDirty", () => {
  it("should return false if no deps are dirty", () => {
    const dep = createNode();
    const node = createNode();
    node.flags |= ReactiveFlags.Pending;
    linkDep(dep, node);

    const result = checkDirty(node);

    expect(result).toBe(false);
    expect((node.flags & ReactiveFlags.Pending) !== 0).toBe(false);
  });

  it("should return true if dep is dirty and update marks node dirty", () => {
    const dep = createNode();
    dep.flags |= ReactiveFlags.Dirty;
    const node = createNode();
    node.flags |= ReactiveFlags.Pending;
    linkDep(dep, node);

    // Simulate update that marks subscriber as dirty
    (dep as any).update = () => {
      dep.flags &= ~ReactiveFlags.Dirty;
      node.flags |= ReactiveFlags.Dirty;
    };

    const result = checkDirty(node);

    expect(result).toBe(true);
  });

  it("should return false if dep was dirty but update resolved it cleanly", () => {
    const dep = createNode();
    dep.flags |= ReactiveFlags.Dirty;
    const node = createNode();
    node.flags |= ReactiveFlags.Pending;
    linkDep(dep, node);

    // Simulate update that resolves without changing value
    (dep as any).update = () => {
      dep.flags &= ~ReactiveFlags.Dirty;
      // node stays Pending, not marked Dirty
    };

    const result = checkDirty(node);

    expect(result).toBe(false);
  });

  it("should handle chain: dep(dirty) → middle(pending) → node(pending)", () => {
    const dep = createNode();
    dep.flags |= ReactiveFlags.Dirty;
    const middle = createNode();
    middle.flags |= ReactiveFlags.Pending;
    const node = createNode();
    node.flags |= ReactiveFlags.Pending;

    linkDep(dep, middle);
    linkDep(middle, node);

    // Middle's update propagates dirty to node
    (dep as any).update = () => {
      dep.flags &= ~ReactiveFlags.Dirty;
      middle.flags |= ReactiveFlags.Dirty;
      middle.flags &= ~ReactiveFlags.Pending;
    };

    (middle as any).update = () => {
      middle.flags &= ~ReactiveFlags.Dirty;
      node.flags |= ReactiveFlags.Dirty;
    };

    const result = checkDirty(node);
    // The node should have checked its deps and found middle is pending,
    // which recursed into dep being dirty
    expect(
      (node.flags & (ReactiveFlags.Dirty | ReactiveFlags.Pending)) !== 0
    ).toBe(true);
  });

  it("should clear Pending flag after clean check", () => {
    const dep = createNode();
    const node = createNode();
    node.flags |= ReactiveFlags.Pending;
    linkDep(dep, node);

    checkDirty(node);

    expect((node.flags & ReactiveFlags.Pending) !== 0).toBe(false);
    expect((dep.flags & ReactiveFlags.Pending) !== 0).toBe(false);
  });
});
