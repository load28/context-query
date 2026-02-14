import { describe, it, expect, vi } from 'vitest';
import { Signal } from '../signal';

describe('Signal', () => {
  describe('value (get)', () => {
    it('returns the initial value', () => {
      const sig = new Signal(42);
      expect(sig.value).toBe(42);
    });

    it('returns initial value for string', () => {
      const sig = new Signal('hello');
      expect(sig.value).toBe('hello');
    });

    it('returns initial value for object', () => {
      const obj = { name: 'John', age: 30 };
      const sig = new Signal(obj);
      expect(sig.value).toBe(obj);
    });

    it('returns initial value for array', () => {
      const arr = [1, 2, 3];
      const sig = new Signal(arr);
      expect(sig.value).toBe(arr);
    });

    it('returns initial value for null', () => {
      const sig = new Signal(null);
      expect(sig.value).toBeNull();
    });

    it('returns initial value for undefined', () => {
      const sig = new Signal(undefined);
      expect(sig.value).toBeUndefined();
    });

    it('returns initial value for boolean', () => {
      const sig = new Signal(false);
      expect(sig.value).toBe(false);
    });
  });

  describe('value (set)', () => {
    it('updates the value', () => {
      const sig = new Signal(0);
      sig.value = 10;
      expect(sig.value).toBe(10);
    });

    it('updates object value', () => {
      const sig = new Signal({ name: 'John' });
      const newObj = { name: 'Jane' };
      sig.value = newObj;
      expect(sig.value).toBe(newObj);
    });

    it('does not notify listeners when setting the same value (Object.is)', () => {
      const sig = new Signal(42);
      const listener = vi.fn();
      sig.subscribe(listener);

      sig.value = 42;
      expect(listener).not.toHaveBeenCalled();
    });

    it('does not notify for NaN === NaN (Object.is)', () => {
      const sig = new Signal(NaN);
      const listener = vi.fn();
      sig.subscribe(listener);

      sig.value = NaN;
      expect(listener).not.toHaveBeenCalled();
    });

    it('notifies listeners when value changes', () => {
      const sig = new Signal(0);
      const listener = vi.fn();
      sig.subscribe(listener);

      sig.value = 1;
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('treats different object references as different values', () => {
      const sig = new Signal({ name: 'John' });
      const listener = vi.fn();
      sig.subscribe(listener);

      sig.value = { name: 'John' }; // same shape, different reference
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('distinguishes +0 and -0', () => {
      const sig = new Signal(0);
      const listener = vi.fn();
      sig.subscribe(listener);

      sig.value = -0;
      // Object.is(0, -0) is false
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('peek', () => {
    it('returns value without tracking', () => {
      const sig = new Signal(42);
      expect(sig.peek()).toBe(42);
    });
  });

  describe('subscribe', () => {
    it('returns a subscription with unsubscribe', () => {
      const sig = new Signal(0);
      const listener = vi.fn();
      const sub = sig.subscribe(listener);

      expect(sub).toHaveProperty('unsubscribe');
      expect(typeof sub.unsubscribe).toBe('function');
    });

    it('listener is called on value change', () => {
      const sig = new Signal(0);
      const listener = vi.fn();
      sig.subscribe(listener);

      sig.value = 1;
      sig.value = 2;
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('unsubscribed listener is not called', () => {
      const sig = new Signal(0);
      const listener = vi.fn();
      const sub = sig.subscribe(listener);

      sub.unsubscribe();
      sig.value = 1;
      expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple listeners', () => {
      const sig = new Signal(0);
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      sig.subscribe(listener1);
      sig.subscribe(listener2);

      sig.value = 1;
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('unsubscribing one listener does not affect others', () => {
      const sig = new Signal(0);
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const sub1 = sig.subscribe(listener1);
      sig.subscribe(listener2);

      sub1.unsubscribe();
      sig.value = 1;
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('double unsubscribe is safe', () => {
      const sig = new Signal(0);
      const listener = vi.fn();
      const sub = sig.subscribe(listener);

      sub.unsubscribe();
      sub.unsubscribe(); // should not throw
      sig.value = 1;
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('re-entrancy', () => {
    it('handles setValue called inside a listener', () => {
      const sig = new Signal(0);
      const values: number[] = [];

      sig.subscribe(() => {
        values.push(sig.peek());
        if (sig.peek() === 1) {
          sig.value = 2;
        }
      });

      sig.value = 1;
      expect(values).toContain(1);
      expect(values).toContain(2);
      expect(sig.value).toBe(2);
    });
  });
});
