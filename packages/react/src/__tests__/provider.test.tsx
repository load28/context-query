import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { createContextQuery } from '../index';

type TestAtoms = { count: number; name: string };

function setup() {
  return createContextQuery<TestAtoms>();
}

describe('ContextQueryProvider', () => {
  it('provides initial atom values to children', () => {
    const { ContextQueryProvider, useContextAtomValue } = setup();

    function Child() {
      const count = useContextAtomValue('count');
      const name = useContextAtomValue('name');
      return (
        <span data-testid="values">
          {count}-{name}
        </span>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 42, name: 'test' }}>
        <Child />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('values').textContent).toBe('42-test');
  });

  it('two providers have independent state', () => {
    const { ContextQueryProvider, useContextAtom } = setup();

    function Counter({ testId }: { testId: string }) {
      const [count, setCount] = useContextAtom('count');
      return (
        <button onClick={() => setCount((c) => c + 1)} data-testid={testId}>
          {count}
        </button>
      );
    }

    render(
      <>
        <ContextQueryProvider atoms={{ count: 0, name: 'a' }}>
          <Counter testId="counter-a" />
        </ContextQueryProvider>
        <ContextQueryProvider atoms={{ count: 100, name: 'b' }}>
          <Counter testId="counter-b" />
        </ContextQueryProvider>
      </>
    );

    expect(screen.getByTestId('counter-a').textContent).toBe('0');
    expect(screen.getByTestId('counter-b').textContent).toBe('100');

    act(() => screen.getByTestId('counter-a').click());

    expect(screen.getByTestId('counter-a').textContent).toBe('1');
    expect(screen.getByTestId('counter-b').textContent).toBe('100');
  });

  it('nested providers use the closest provider', () => {
    const { ContextQueryProvider, useContextAtomValue } = setup();

    function Display({ testId }: { testId: string }) {
      const count = useContextAtomValue('count');
      return <span data-testid={testId}>{count}</span>;
    }

    render(
      <ContextQueryProvider atoms={{ count: 1, name: 'outer' }}>
        <Display testId="outer" />
        <ContextQueryProvider atoms={{ count: 2, name: 'inner' }}>
          <Display testId="inner" />
        </ContextQueryProvider>
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('outer').textContent).toBe('1');
    expect(screen.getByTestId('inner').textContent).toBe('2');
  });
});

describe('useStore', () => {
  it('returns the ContextQueryStore instance', () => {
    const { ContextQueryProvider, useStore } = setup();
    let store: any;

    function Child() {
      store = useStore();
      return null;
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <Child />
      </ContextQueryProvider>
    );

    expect(store).toBeDefined();
    expect(typeof store.getAtomValue).toBe('function');
    expect(typeof store.setAtomValue).toBe('function');
    expect(typeof store.subscribeToAtom).toBe('function');
    expect(typeof store.getSnapshot).toBe('function');
    expect(typeof store.patch).toBe('function');
  });

  it('store reflects current atom values', () => {
    const { ContextQueryProvider, useStore, useContextSetAtom } = setup();
    let store: any;

    function StoreReader() {
      store = useStore();
      return null;
    }

    function Setter() {
      const setCount = useContextSetAtom('count');
      return (
        <button onClick={() => setCount(77)} data-testid="btn">
          set
        </button>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <StoreReader />
        <Setter />
      </ContextQueryProvider>
    );

    expect(store.getAtomValue('count')).toBe(0);
    act(() => screen.getByTestId('btn').click());
    expect(store.getAtomValue('count')).toBe(77);
  });

  it('throws outside Provider', () => {
    const { useStore } = setup();

    function Orphan() {
      useStore();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      'Hook must be used within a ContextQueryProvider'
    );
  });
});
