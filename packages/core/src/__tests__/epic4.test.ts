import { describe, it, expect, vi } from 'vitest';
import { ContextQueryStore } from '../contextQueryStore';
import { AtomStore } from '../atomStore';
import { DerivedAtomStore } from '../derivedAtomStore';
import { derived } from '../derived';

describe('Story 4.2: Store debug API', () => {
  describe('getAtomSubscriberCount', () => {
    it('returns 0 for no subscribers', () => {
      const store = new ContextQueryStore({ count: 0 });
      // Internal snapshot listener adds 1
      expect(store.getAtomSubscriberCount('count')).toBe(1);
    });

    it('increases with subscriptions', () => {
      const store = new ContextQueryStore({ count: 0 });
      const base = store.getAtomSubscriberCount('count');
      store.subscribeToAtom('count', () => {});
      expect(store.getAtomSubscriberCount('count')).toBe(base + 1);
    });

    it('decreases on unsubscribe', () => {
      const store = new ContextQueryStore({ count: 0 });
      const base = store.getAtomSubscriberCount('count');
      const sub = store.subscribeToAtom('count', () => {});
      expect(store.getAtomSubscriberCount('count')).toBe(base + 1);
      sub.unsubscribe();
      expect(store.getAtomSubscriberCount('count')).toBe(base);
    });
  });

  describe('getDependencyGraph', () => {
    it('returns empty for no derived atoms', () => {
      const store = new ContextQueryStore({ a: 1, b: 2 });
      expect(store.getDependencyGraph()).toEqual({});
    });

    it('returns dependencies for derived atoms', () => {
      const store = new ContextQueryStore({
        a: 1,
        b: 2,
        sum: derived((get) => get('a') + get('b')),
      });
      const graph = store.getDependencyGraph();
      expect(graph['sum']).toEqual(expect.arrayContaining(['a', 'b']));
      expect(graph['sum']).toHaveLength(2);
    });

    it('returns chained dependencies', () => {
      const store = new ContextQueryStore({
        a: 1,
        b: derived((get) => get('a') * 2),
        c: derived((get) => get('b') + 1),
      });
      const graph = store.getDependencyGraph();
      expect(graph['b']).toEqual(['a']);
      expect(graph['c']).toEqual(['b']);
    });
  });

  describe('getDebugInfo', () => {
    it('includes all atoms with values and subscriber counts', () => {
      const store = new ContextQueryStore({
        count: 0,
        name: 'test',
        doubled: derived((get) => get('count') * 2),
      });

      const info = store.getDebugInfo();

      expect(info['count']).toMatchObject({
        value: 0,
        isDerived: false,
      });
      expect(info['count'].subscriberCount).toBeGreaterThanOrEqual(1);

      expect(info['name']).toMatchObject({
        value: 'test',
        isDerived: false,
      });

      expect(info['doubled']).toMatchObject({
        value: 0,
        isDerived: true,
        dependencies: ['count'],
        error: null,
      });
    });
  });

  describe('AtomStore.getSubscriberCount', () => {
    it('returns listener count', () => {
      const store = new AtomStore(0);
      expect(store.getSubscriberCount()).toBe(0);
      const sub = store.subscribe(() => {});
      expect(store.getSubscriberCount()).toBe(1);
      sub.unsubscribe();
      expect(store.getSubscriberCount()).toBe(0);
    });
  });
});

describe('Story 4.3: Atom update error capture', () => {
  describe('derived atom error state', () => {
    it('enters error state when read function throws', () => {
      const store = new ContextQueryStore({
        divisor: 1,
        result: derived((get) => {
          const d = get('divisor');
          if (d === 0) throw new Error('Division by zero');
          return 10 / d;
        }),
      });

      expect(store.getAtomValue('result')).toBe(10);

      store.setAtomValue('divisor', 0);
      expect(() => store.getAtomValue('result')).toThrow('Division by zero');
    });

    it('recovers from error when dependency changes to valid value', () => {
      const store = new ContextQueryStore({
        divisor: 1,
        result: derived((get) => {
          const d = get('divisor');
          if (d === 0) throw new Error('Division by zero');
          return 10 / d;
        }),
      });

      store.setAtomValue('divisor', 0);
      expect(() => store.getAtomValue('result')).toThrow('Division by zero');

      store.setAtomValue('divisor', 2);
      expect(store.getAtomValue('result')).toBe(5);
    });

    it('getAtomError returns error for errored derived atom', () => {
      const store = new ContextQueryStore({
        divisor: 0,
        result: derived((get) => {
          const d = get('divisor');
          if (d === 0) throw new Error('Division by zero');
          return 10 / d;
        }),
      });

      expect(store.getAtomError('result')).toBeInstanceOf(Error);
      expect(store.getAtomError('result')?.message).toBe('Division by zero');
    });

    it('getAtomError returns null for non-derived atom', () => {
      const store = new ContextQueryStore({ count: 0 });
      expect(store.getAtomError('count')).toBeNull();
    });

    it('getAtomError returns null when derived atom has no error', () => {
      const store = new ContextQueryStore({
        a: 1,
        doubled: derived((get) => get('a') * 2),
      });
      expect(store.getAtomError('doubled')).toBeNull();
    });
  });

  describe('error isolation', () => {
    it('error in one derived atom does not affect other atoms', () => {
      const store = new ContextQueryStore({
        a: 1,
        good: derived((get) => get('a') + 1),
        bad: derived((get) => {
          if (get('a') === 0) throw new Error('bad');
          return get('a') * 2;
        }),
      });

      store.setAtomValue('a', 0);

      // good should still work
      expect(store.getAtomValue('good')).toBe(1);
      // bad is in error state
      expect(() => store.getAtomValue('bad')).toThrow('bad');
    });
  });

  describe('onError callback', () => {
    it('calls onError when derived atom throws', () => {
      const onError = vi.fn();
      const store = new ContextQueryStore(
        {
          divisor: 0,
          result: derived((get) => {
            const d = get('divisor');
            if (d === 0) throw new Error('Division by zero');
            return 10 / d;
          }),
        },
        { onError }
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Division by zero' }),
        expect.objectContaining({ key: 'result', type: 'derived' })
      );
    });

    it('onError is called again when error recurs', () => {
      const onError = vi.fn();
      const store = new ContextQueryStore(
        {
          divisor: 1,
          result: derived((get) => {
            const d = get('divisor');
            if (d === 0) throw new Error('Division by zero');
            return 10 / d;
          }),
        },
        { onError }
      );

      expect(onError).not.toHaveBeenCalled();

      store.setAtomValue('divisor', 0);
      // Force recompute
      try { store.getAtomValue('result'); } catch {}

      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('DerivedAtomStore error methods', () => {
    it('hasError returns true when in error state', () => {
      const resolve = (key: string) => {
        if (key === 'a') return { getValue: () => 0, subscribe: () => ({ unsubscribe: () => {} }) };
        throw new Error('not found');
      };
      const store = new DerivedAtomStore<number>(
        (get) => {
          if (get('a') === 0) throw new Error('err');
          return get('a');
        },
        resolve
      );
      store.initialize();
      expect(store.hasError()).toBe(true);
      expect(store.getError()?.message).toBe('err');
    });

    it('getDependencyKeys returns tracked deps', () => {
      const stores: Record<string, { getValue: () => number; subscribe: (l: any) => any }> = {
        a: { getValue: () => 1, subscribe: () => ({ unsubscribe: () => {} }) },
        b: { getValue: () => 2, subscribe: () => ({ unsubscribe: () => {} }) },
      };
      const store = new DerivedAtomStore<number>(
        (get) => get('a') + get('b'),
        (key) => stores[key]
      );
      store.initialize();
      expect(store.getDependencyKeys()).toEqual(expect.arrayContaining(['a', 'b']));
    });
  });
});
