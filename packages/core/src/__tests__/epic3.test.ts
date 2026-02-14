import { describe, it, expect, vi } from 'vitest';
import { Signal } from '../signal';
import { ContextQueryStore } from '../contextQueryStore';
import { atom } from '../atom';
import { derived } from '../derived';
import { shallowEqual } from '../shallowEqual';
import { RESET } from '../types';

describe('Story 3.1: Custom equality', () => {
  describe('shallowEqual utility', () => {
    it('returns true for identical references', () => {
      const obj = { a: 1 };
      expect(shallowEqual(obj, obj)).toBe(true);
    });

    it('returns true for shallow-equal objects', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('returns false for different values', () => {
      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('returns false for different keys', () => {
      expect(shallowEqual({ a: 1 }, { b: 1 } as any)).toBe(false);
    });

    it('returns false for different key counts', () => {
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 } as any)).toBe(false);
    });

    it('returns false for nested object changes', () => {
      expect(
        shallowEqual({ a: { x: 1 } }, { a: { x: 1 } })
      ).toBe(false); // different nested references
    });

    it('handles primitives', () => {
      expect(shallowEqual(1, 1)).toBe(true);
      expect(shallowEqual(1, 2)).toBe(false);
      expect(shallowEqual('a', 'a')).toBe(true);
    });

    it('handles null/undefined', () => {
      expect(shallowEqual(null, null)).toBe(true);
      expect(shallowEqual(null, {})).toBe(false);
      expect(shallowEqual(undefined, undefined)).toBe(true);
    });
  });

  describe('Signal with equalityFn', () => {
    it('uses Object.is by default', () => {
      const sig = new Signal({ name: 'John', age: 30 });
      const listener = vi.fn();
      sig.subscribe(listener);

      // Different reference but same structure → should notify (Object.is)
      sig.value = { name: 'John', age: 30 };
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('uses custom equalityFn when provided', () => {
      const sig = new Signal({ name: 'John', age: 30 }, { equalityFn: shallowEqual });
      const listener = vi.fn();
      sig.subscribe(listener);

      // Same structure → should NOT notify (shallowEqual)
      sig.value = { name: 'John', age: 30 };
      expect(listener).not.toHaveBeenCalled();
    });

    it('notifies when shallowEqual detects change', () => {
      const sig = new Signal({ name: 'John', age: 30 }, { equalityFn: shallowEqual });
      const listener = vi.fn();
      sig.subscribe(listener);

      sig.value = { name: 'Jane', age: 30 };
      expect(listener).toHaveBeenCalledTimes(1);
      expect(sig.value).toEqual({ name: 'Jane', age: 30 });
    });
  });

  describe('ContextQueryStore with atom() equalityFn', () => {
    it('uses shallowEqual via atom() config', () => {
      const store = new ContextQueryStore({
        user: atom({ name: 'John', age: 30 }, { equalityFn: shallowEqual }),
        count: 0,
      });

      const userListener = vi.fn();
      const countListener = vi.fn();
      store.subscribeToAtom('user', userListener);
      store.subscribeToAtom('count', countListener);

      // Same structure → no notification
      store.setAtomValue('user', { name: 'John', age: 30 });
      expect(userListener).not.toHaveBeenCalled();

      // Different value → notification
      store.setAtomValue('user', { name: 'Jane', age: 30 });
      expect(userListener).toHaveBeenCalledTimes(1);

      // count still uses Object.is
      store.setAtomValue('count', 0);
      expect(countListener).not.toHaveBeenCalled();
    });
  });
});

describe('Story 3.3: Atom reset', () => {
  describe('RESET symbol', () => {
    it('is a unique symbol', () => {
      expect(typeof RESET).toBe('symbol');
    });
  });

  describe('ContextQueryStore.resetAtom', () => {
    it('resets atom to initial value', () => {
      const store = new ContextQueryStore({ count: 0, name: 'initial' });
      store.setAtomValue('count', 42);
      store.setAtomValue('name', 'changed');

      store.resetAtom('count');
      expect(store.getAtomValue('count')).toBe(0);
      expect(store.getAtomValue('name')).toBe('changed');
    });

    it('notifies listeners on reset when value differs', () => {
      const store = new ContextQueryStore({ count: 0 });
      store.setAtomValue('count', 42);

      const listener = vi.fn();
      store.subscribeToAtom('count', listener);

      store.resetAtom('count');
      expect(listener).toHaveBeenCalled();
      expect(store.getAtomValue('count')).toBe(0);
    });

    it('does not notify if value equals initial', () => {
      const store = new ContextQueryStore({ count: 0 });
      const listener = vi.fn();
      store.subscribeToAtom('count', listener);

      store.resetAtom('count');
      expect(listener).not.toHaveBeenCalled();
    });

    it('throws when trying to reset derived signal', () => {
      const store = new ContextQueryStore({
        a: 1,
        doubled: derived((get) => get('a') * 2),
      });

      expect(() => store.resetAtom('doubled')).toThrow('Cannot reset derived signal');
    });
  });

  describe('ContextQueryStore.resetAll', () => {
    it('resets all writable atoms to initial values', () => {
      const store = new ContextQueryStore({ count: 0, name: 'init' });
      store.setAtomValue('count', 42);
      store.setAtomValue('name', 'changed');

      store.resetAll();
      expect(store.getAtomValue('count')).toBe(0);
      expect(store.getAtomValue('name')).toBe('init');
    });

    it('derived atoms recompute after resetAll', () => {
      const store = new ContextQueryStore({
        a: 1,
        doubled: derived((get) => get('a') * 2),
      });

      store.setAtomValue('a', 10);
      expect(store.getAtomValue('doubled')).toBe(20);

      store.resetAll();
      expect(store.getAtomValue('a')).toBe(1);
      expect(store.getAtomValue('doubled')).toBe(2);
    });
  });

  describe('setAtomValue with RESET', () => {
    it('resets atom when RESET symbol is passed', () => {
      const store = new ContextQueryStore({ count: 0 });
      store.setAtomValue('count', 42);

      store.setAtomValue('count', RESET as any);
      expect(store.getAtomValue('count')).toBe(0);
    });
  });

  describe('atom() with reset', () => {
    it('resets atom created via atom() config', () => {
      const store = new ContextQueryStore({
        user: atom({ name: 'John', age: 30 }, { equalityFn: shallowEqual }),
      });

      store.setAtomValue('user', { name: 'Jane', age: 25 });
      store.resetAtom('user');
      expect(store.getAtomValue('user')).toEqual({ name: 'John', age: 30 });
    });
  });
});

describe('Story 3.4: atom() helper', () => {
  it('creates AtomConfig with __type and initialValue', () => {
    const config = atom(42);
    expect(config.__type).toBe('atom');
    expect(config.initialValue).toBe(42);
    expect(config.equalityFn).toBeUndefined();
  });

  it('creates AtomConfig with equalityFn option', () => {
    const config = atom({ name: '' }, { equalityFn: shallowEqual });
    expect(config.__type).toBe('atom');
    expect(config.initialValue).toEqual({ name: '' });
    expect(config.equalityFn).toBe(shallowEqual);
  });

  it('mixed atom(), derived(), and plain values work together', () => {
    const store = new ContextQueryStore({
      count: 0,
      user: atom({ name: 'John', age: 30 }, { equalityFn: shallowEqual }),
      fullName: derived((get) => get('user').name),
    });

    expect(store.getAtomValue('count')).toBe(0);
    expect(store.getAtomValue('user')).toEqual({ name: 'John', age: 30 });
    expect(store.getAtomValue('fullName')).toBe('John');

    store.setAtomValue('user', { name: 'Jane', age: 25 });
    expect(store.getAtomValue('fullName')).toBe('Jane');
  });
});
