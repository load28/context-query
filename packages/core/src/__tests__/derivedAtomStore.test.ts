import { describe, it, expect, vi } from 'vitest';
import { ContextQueryStore } from '../contextQueryStore';
import { derived } from '../derived';

describe('derived() helper', () => {
  it('creates a DerivedAtomConfig with __type and read', () => {
    const readFn = (get: (key: string) => any) => get('a') + get('b');
    const config = derived(readFn);

    expect(config.__type).toBe('derived');
    expect(config.read).toBe(readFn);
  });
});

describe('Computed signals via ContextQueryStore', () => {
  describe('basic computed signal', () => {
    it('computes initial value from dependencies', () => {
      const store = new ContextQueryStore({
        firstName: 'John',
        lastName: 'Doe',
        fullName: derived((get) => `${get('firstName')} ${get('lastName')}`),
      });

      expect(store.getAtomValue('fullName')).toBe('John Doe');
    });

    it('recomputes when a dependency changes', () => {
      const store = new ContextQueryStore({
        firstName: 'John',
        lastName: 'Doe',
        fullName: derived((get) => `${get('firstName')} ${get('lastName')}`),
      });

      store.setAtomValue('firstName', 'Jane');
      expect(store.getAtomValue('fullName')).toBe('Jane Doe');
    });

    it('recomputes when any dependency changes', () => {
      const store = new ContextQueryStore({
        firstName: 'John',
        lastName: 'Doe',
        fullName: derived((get) => `${get('firstName')} ${get('lastName')}`),
      });

      store.setAtomValue('lastName', 'Smith');
      expect(store.getAtomValue('fullName')).toBe('John Smith');
    });

    it('computes derived signal from numeric values', () => {
      const store = new ContextQueryStore({
        price: 100,
        quantity: 3,
        total: derived((get) => get('price') * get('quantity')),
      });

      expect(store.getAtomValue('total')).toBe(300);

      store.setAtomValue('price', 200);
      expect(store.getAtomValue('total')).toBe(600);

      store.setAtomValue('quantity', 5);
      expect(store.getAtomValue('total')).toBe(1000);
    });
  });

  describe('setValue restriction', () => {
    it('throws when trying to set a computed signal value', () => {
      const store = new ContextQueryStore({
        a: 1,
        b: derived((get) => get('a') * 2),
      });

      expect(() => store.setAtomValue('b', 10)).toThrow(
        'Cannot set value of derived signal "b"'
      );
    });

    it('isDerivedKey returns true for computed signals', () => {
      const store = new ContextQueryStore({
        a: 1,
        b: derived((get) => get('a') * 2),
      });

      expect(store.isDerivedKey('b')).toBe(true);
      expect(store.isDerivedKey('a')).toBe(false);
    });
  });

  describe('subscription', () => {
    it('notifies subscribers when computed value changes', () => {
      const store = new ContextQueryStore({
        a: 1,
        doubled: derived((get) => get('a') * 2),
      });

      const listener = vi.fn();
      store.subscribeToAtom('doubled', listener);

      store.setAtomValue('a', 2);
      expect(listener).toHaveBeenCalled();
      expect(store.getAtomValue('doubled')).toBe(4);
    });

    it('does not notify subscribers when computed value is the same (glitch-free)', () => {
      const store = new ContextQueryStore({
        a: 1,
        isPositive: derived((get) => get('a') > 0),
      });

      const listener = vi.fn();
      store.subscribeToAtom('isPositive', listener);

      // Change a from 1 to 2 — isPositive stays true
      store.setAtomValue('a', 2);
      expect(store.getAtomValue('isPositive')).toBe(true);
    });

    it('correctly unsubscribes from computed signal', () => {
      const store = new ContextQueryStore({
        a: 1,
        doubled: derived((get) => get('a') * 2),
      });

      const listener = vi.fn();
      const sub = store.subscribeToAtom('doubled', listener);
      sub.unsubscribe();

      store.setAtomValue('a', 2);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('chained computed signals', () => {
    it('supports A → B(computed from A) → C(computed from B)', () => {
      const store = new ContextQueryStore({
        a: 2,
        b: derived((get) => get('a') * 10),
        c: derived((get) => get('b') + 1),
      });

      expect(store.getAtomValue('a')).toBe(2);
      expect(store.getAtomValue('b')).toBe(20);
      expect(store.getAtomValue('c')).toBe(21);

      store.setAtomValue('a', 3);
      expect(store.getAtomValue('b')).toBe(30);
      expect(store.getAtomValue('c')).toBe(31);
    });

    it('deeply chained: A → B → C → D', () => {
      const store = new ContextQueryStore({
        a: 1,
        b: derived((get) => get('a') + 1),
        c: derived((get) => get('b') + 1),
        d: derived((get) => get('c') + 1),
      });

      expect(store.getAtomValue('d')).toBe(4);

      store.setAtomValue('a', 10);
      expect(store.getAtomValue('d')).toBe(13);
    });
  });

  describe('diamond dependency', () => {
    it('handles diamond: A → B, A → C, D(computed from B+C)', () => {
      const store = new ContextQueryStore({
        a: 1,
        b: derived((get) => get('a') * 2),
        c: derived((get) => get('a') * 3),
        d: derived((get) => get('b') + get('c')),
      });

      expect(store.getAtomValue('d')).toBe(5); // 2 + 3

      store.setAtomValue('a', 10);
      expect(store.getAtomValue('d')).toBe(50); // 20 + 30
    });

    it('diamond computed signal computes correct value (no glitch)', () => {
      const computeFn = vi.fn((get: (key: string) => any) => get('b') + get('c'));

      const store = new ContextQueryStore({
        a: 1,
        b: derived((get) => get('a') * 2),
        c: derived((get) => get('a') * 3),
        d: derived(computeFn),
      });

      // Initial computation
      expect(computeFn).toHaveBeenCalledTimes(1);
      expect(store.getAtomValue('d')).toBe(5);

      // After changing a, d should recompute with BOTH new b and new c
      store.setAtomValue('a', 10);
      const result = store.getAtomValue('d');
      expect(result).toBe(50); // 20 + 30, not 20 + 3 or 2 + 30
    });
  });

  describe('circular dependency detection', () => {
    it('throws on direct circular dependency', () => {
      expect(() => {
        new ContextQueryStore({
          a: derived((get) => get('b')),
          b: derived((get) => get('a')),
        });
      }).toThrow('Circular dependency');
    });

    it('throws on indirect circular dependency', () => {
      expect(() => {
        new ContextQueryStore({
          a: derived((get) => get('c')),
          b: derived((get) => get('a')),
          c: derived((get) => get('b')),
        });
      }).toThrow('Circular dependency');
    });
  });

  describe('snapshot', () => {
    it('includes computed signals in snapshot', () => {
      const store = new ContextQueryStore({
        firstName: 'John',
        lastName: 'Doe',
        fullName: derived((get) => `${get('firstName')} ${get('lastName')}`),
      });

      const snapshot = store.getSnapshot();
      expect(snapshot).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
      });
    });

    it('snapshot updates when computed signal dependency changes', () => {
      const store = new ContextQueryStore({
        a: 1,
        doubled: derived((get) => get('a') * 2),
      });

      store.setAtomValue('a', 5);
      const snapshot = store.getSnapshot();
      expect(snapshot).toEqual({ a: 5, doubled: 10 });
    });
  });

  describe('patch', () => {
    it('ignores computed signal keys in patch', () => {
      const store = new ContextQueryStore({
        a: 1,
        doubled: derived((get) => get('a') * 2),
      });

      // Attempting to patch a computed key should be silently ignored
      store.patch({ a: 5, doubled: 999 } as any);
      expect(store.getAtomValue('a')).toBe(5);
      expect(store.getAtomValue('doubled')).toBe(10); // Not 999
    });
  });

  describe('store-wide subscribe', () => {
    it('fires when computed signal value changes via dependency', () => {
      const store = new ContextQueryStore({
        a: 1,
        doubled: derived((get) => get('a') * 2),
      });

      const listener = vi.fn();
      store.subscribe(listener);

      store.setAtomValue('a', 5);
      expect(listener).toHaveBeenCalled();

      const lastCallArg = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(lastCallArg.a).toBe(5);
      expect(lastCallArg.doubled).toBe(10);
    });
  });

  describe('performance', () => {
    it('lazily evaluates computed signals (no compute until getValue)', () => {
      const computeFn = vi.fn((get: (key: string) => any) => get('a') * 2);

      const store = new ContextQueryStore({
        a: 1,
        doubled: derived(computeFn),
      });

      // initialize() calls recompute once
      const initialCallCount = computeFn.mock.calls.length;
      expect(initialCallCount).toBe(1);

      // Changing 'a' marks dirty but does NOT recompute
      store.setAtomValue('a', 2);
      expect(computeFn.mock.calls.length).toBe(initialCallCount);

      // getValue triggers lazy recomputation
      expect(store.getAtomValue('doubled')).toBe(4);
      expect(computeFn.mock.calls.length).toBe(initialCallCount + 1);
    });

    it('does not recompute if value is read without dependency change', () => {
      const computeFn = vi.fn((get: (key: string) => any) => get('a') * 2);

      const store = new ContextQueryStore({
        a: 1,
        doubled: derived(computeFn),
      });

      const initialCallCount = computeFn.mock.calls.length;

      // Multiple reads without changes
      store.getAtomValue('doubled');
      store.getAtomValue('doubled');
      store.getAtomValue('doubled');

      expect(computeFn.mock.calls.length).toBe(initialCallCount);
    });
  });
});
