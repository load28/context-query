import { describe, it, expect, vi } from 'vitest';
import { AtomStore } from '../atomStore';

describe('AtomStore', () => {
  describe('getValue', () => {
    it('returns the initial value', () => {
      const store = new AtomStore(42);
      expect(store.getValue()).toBe(42);
    });

    it('returns initial value for string', () => {
      const store = new AtomStore('hello');
      expect(store.getValue()).toBe('hello');
    });

    it('returns initial value for object', () => {
      const obj = { name: 'John', age: 30 };
      const store = new AtomStore(obj);
      expect(store.getValue()).toBe(obj);
    });

    it('returns initial value for array', () => {
      const arr = [1, 2, 3];
      const store = new AtomStore(arr);
      expect(store.getValue()).toBe(arr);
    });

    it('returns initial value for null', () => {
      const store = new AtomStore(null);
      expect(store.getValue()).toBeNull();
    });

    it('returns initial value for undefined', () => {
      const store = new AtomStore(undefined);
      expect(store.getValue()).toBeUndefined();
    });

    it('returns initial value for boolean', () => {
      const store = new AtomStore(false);
      expect(store.getValue()).toBe(false);
    });
  });

  describe('setValue', () => {
    it('updates the value', () => {
      const store = new AtomStore(0);
      store.setValue(10);
      expect(store.getValue()).toBe(10);
    });

    it('updates object value', () => {
      const store = new AtomStore({ name: 'John' });
      const newObj = { name: 'Jane' };
      store.setValue(newObj);
      expect(store.getValue()).toBe(newObj);
    });

    it('does not notify listeners when setting the same value (Object.is)', () => {
      const store = new AtomStore(42);
      const listener = vi.fn();
      store.subscribe(listener);

      store.setValue(42);
      expect(listener).not.toHaveBeenCalled();
    });

    it('does not notify for NaN === NaN (Object.is)', () => {
      const store = new AtomStore(NaN);
      const listener = vi.fn();
      store.subscribe(listener);

      store.setValue(NaN);
      expect(listener).not.toHaveBeenCalled();
    });

    it('notifies listeners when value changes', () => {
      const store = new AtomStore(0);
      const listener = vi.fn();
      store.subscribe(listener);

      store.setValue(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('treats different object references as different values', () => {
      const store = new AtomStore({ name: 'John' });
      const listener = vi.fn();
      store.subscribe(listener);

      store.setValue({ name: 'John' }); // same shape, different reference
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('distinguishes +0 and -0', () => {
      const store = new AtomStore(0);
      const listener = vi.fn();
      store.subscribe(listener);

      store.setValue(-0);
      // Object.is(0, -0) is false
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribe', () => {
    it('returns a subscription with unsubscribe', () => {
      const store = new AtomStore(0);
      const listener = vi.fn();
      const sub = store.subscribe(listener);

      expect(sub).toHaveProperty('unsubscribe');
      expect(typeof sub.unsubscribe).toBe('function');
    });

    it('listener is called on value change', () => {
      const store = new AtomStore(0);
      const listener = vi.fn();
      store.subscribe(listener);

      store.setValue(1);
      store.setValue(2);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('unsubscribed listener is not called', () => {
      const store = new AtomStore(0);
      const listener = vi.fn();
      const sub = store.subscribe(listener);

      sub.unsubscribe();
      store.setValue(1);
      expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple listeners', () => {
      const store = new AtomStore(0);
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      store.subscribe(listener1);
      store.subscribe(listener2);

      store.setValue(1);
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('unsubscribing one listener does not affect others', () => {
      const store = new AtomStore(0);
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const sub1 = store.subscribe(listener1);
      store.subscribe(listener2);

      sub1.unsubscribe();
      store.setValue(1);
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('double unsubscribe is safe', () => {
      const store = new AtomStore(0);
      const listener = vi.fn();
      const sub = store.subscribe(listener);

      sub.unsubscribe();
      sub.unsubscribe(); // should not throw
      store.setValue(1);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('re-entrancy', () => {
    it('handles setValue called inside a listener', () => {
      const store = new AtomStore(0);
      const values: number[] = [];

      store.subscribe(() => {
        values.push(store.getValue());
        if (store.getValue() === 1) {
          store.setValue(2);
        }
      });

      store.setValue(1);
      expect(values).toContain(1);
      expect(values).toContain(2);
      expect(store.getValue()).toBe(2);
    });
  });
});
