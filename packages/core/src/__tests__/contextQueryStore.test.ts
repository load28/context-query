import { describe, it, expect, vi } from 'vitest';
import { ContextQueryStore } from '../contextQueryStore';

describe('ContextQueryStore', () => {
  const createStore = () =>
    new ContextQueryStore({ count: 0, name: 'hello', flag: true });

  describe('constructor', () => {
    it('creates a store from an atoms record', () => {
      const store = createStore();
      expect(store.getAtomValue('count')).toBe(0);
      expect(store.getAtomValue('name')).toBe('hello');
      expect(store.getAtomValue('flag')).toBe(true);
    });
  });

  describe('getAtomValue', () => {
    it('returns the current value for a key', () => {
      const store = createStore();
      expect(store.getAtomValue('count')).toBe(0);
    });

    it('throws for unknown key', () => {
      const store = createStore();
      expect(() =>
        (store as any).getAtomValue('unknown')
      ).toThrow('Atom with key "unknown" not found');
    });
  });

  describe('setAtomValue', () => {
    it('sets a new value for a key', () => {
      const store = createStore();
      store.setAtomValue('count', 42);
      expect(store.getAtomValue('count')).toBe(42);
    });

    it('sets value for string atom', () => {
      const store = createStore();
      store.setAtomValue('name', 'world');
      expect(store.getAtomValue('name')).toBe('world');
    });

    it('does not affect other atoms', () => {
      const store = createStore();
      store.setAtomValue('count', 10);
      expect(store.getAtomValue('name')).toBe('hello');
      expect(store.getAtomValue('flag')).toBe(true);
    });
  });

  describe('subscribeToAtom', () => {
    it('subscribes to a specific atom', () => {
      const store = createStore();
      const listener = vi.fn();
      store.subscribeToAtom('count', listener);

      store.setAtomValue('count', 1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not fire when a different atom changes', () => {
      const store = createStore();
      const listener = vi.fn();
      store.subscribeToAtom('count', listener);

      store.setAtomValue('name', 'world');
      expect(listener).not.toHaveBeenCalled();
    });

    it('unsubscribe stops notifications', () => {
      const store = createStore();
      const listener = vi.fn();
      const sub = store.subscribeToAtom('count', listener);

      sub.unsubscribe();
      store.setAtomValue('count', 1);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getSnapshot', () => {
    it('returns all atom values as an object', () => {
      const store = createStore();
      const snapshot = store.getSnapshot();
      expect(snapshot).toEqual({ count: 0, name: 'hello', flag: true });
    });

    it('returns cached snapshot when nothing changed', () => {
      const store = createStore();
      const s1 = store.getSnapshot();
      const s2 = store.getSnapshot();
      expect(s1).toBe(s2); // same reference
    });

    it('returns new snapshot after atom change', () => {
      const store = createStore();
      const s1 = store.getSnapshot();
      store.setAtomValue('count', 1);
      const s2 = store.getSnapshot();
      expect(s1).not.toBe(s2);
      expect(s2).toEqual({ count: 1, name: 'hello', flag: true });
    });

    it('reflects latest values', () => {
      const store = createStore();
      store.setAtomValue('count', 10);
      store.setAtomValue('name', 'world');
      const snapshot = store.getSnapshot();
      expect(snapshot.count).toBe(10);
      expect(snapshot.name).toBe('world');
    });
  });

  describe('patch', () => {
    it('updates multiple atoms at once', () => {
      const store = createStore();
      store.patch({ count: 5, name: 'patched' });
      expect(store.getAtomValue('count')).toBe(5);
      expect(store.getAtomValue('name')).toBe('patched');
    });

    it('only updates specified keys', () => {
      const store = createStore();
      store.patch({ count: 99 });
      expect(store.getAtomValue('count')).toBe(99);
      expect(store.getAtomValue('name')).toBe('hello');
      expect(store.getAtomValue('flag')).toBe(true);
    });

    it('triggers listeners for each changed atom', () => {
      const store = createStore();
      const countListener = vi.fn();
      const nameListener = vi.fn();
      const flagListener = vi.fn();
      store.subscribeToAtom('count', countListener);
      store.subscribeToAtom('name', nameListener);
      store.subscribeToAtom('flag', flagListener);

      store.patch({ count: 1, name: 'updated' });
      expect(countListener).toHaveBeenCalledTimes(1);
      expect(nameListener).toHaveBeenCalledTimes(1);
      expect(flagListener).not.toHaveBeenCalled();
    });

    it('ignores unknown keys silently', () => {
      const store = createStore();
      expect(() =>
        store.patch({ count: 1, unknown: 'ignored' } as any)
      ).not.toThrow();
      expect(store.getAtomValue('count')).toBe(1);
    });
  });

  describe('subscribe (store-wide)', () => {
    it('fires callback on any atom change', () => {
      const store = createStore();
      const callback = vi.fn();
      store.subscribe(callback);

      store.setAtomValue('count', 1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1, name: 'hello', flag: true })
      );
    });

    it('fires for each atom that changes', () => {
      const store = createStore();
      const callback = vi.fn();
      store.subscribe(callback);

      store.setAtomValue('count', 1);
      store.setAtomValue('name', 'changed');
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('unsubscribe stops all notifications', () => {
      const store = createStore();
      const callback = vi.fn();
      const sub = store.subscribe(callback);

      sub.unsubscribe();
      store.setAtomValue('count', 1);
      store.setAtomValue('name', 'changed');
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
