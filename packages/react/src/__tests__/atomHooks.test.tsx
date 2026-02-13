import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { createContextQuery } from '../index';

type TestAtoms = { count: number; name: string };

function setup() {
  return createContextQuery<TestAtoms>();
}

describe('useContextAtom', () => {
  it('returns [value, setter] tuple', () => {
    const { ContextQueryProvider, useContextAtom } = setup();
    let result: any;

    function Child() {
      result = useContextAtom('count');
      return null;
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <Child />
      </ContextQueryProvider>
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(0);
    expect(typeof result[1]).toBe('function');
  });

  it('updates value when setter is called', () => {
    const { ContextQueryProvider, useContextAtom } = setup();

    function Child() {
      const [count, setCount] = useContextAtom('count');
      return (
        <button onClick={() => setCount(count + 1)} data-testid="btn">
          {count}
        </button>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <Child />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('btn').textContent).toBe('0');
    act(() => screen.getByTestId('btn').click());
    expect(screen.getByTestId('btn').textContent).toBe('1');
  });

  it('supports functional updater', () => {
    const { ContextQueryProvider, useContextAtom } = setup();

    function Child() {
      const [count, setCount] = useContextAtom('count');
      return (
        <button onClick={() => setCount((prev) => prev + 10)} data-testid="btn">
          {count}
        </button>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 5, name: 'hello' }}>
        <Child />
      </ContextQueryProvider>
    );

    act(() => screen.getByTestId('btn').click());
    expect(screen.getByTestId('btn').textContent).toBe('15');
  });

  it('throws outside Provider', () => {
    const { useContextAtom } = setup();

    function Orphan() {
      useContextAtom('count');
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      'Hook must be used within a ContextQueryProvider'
    );
  });
});

describe('useContextAtomValue', () => {
  it('returns read-only value', () => {
    const { ContextQueryProvider, useContextAtomValue } = setup();

    function Child() {
      const name = useContextAtomValue('name');
      return <span data-testid="name">{name}</span>;
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'world' }}>
        <Child />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('name').textContent).toBe('world');
  });

  it('re-renders when subscribed atom changes', () => {
    const { ContextQueryProvider, useContextAtomValue, useContextSetAtom } = setup();
    const renderCount = vi.fn();

    function Display() {
      const count = useContextAtomValue('count');
      renderCount();
      return <span data-testid="count">{count}</span>;
    }

    function Button() {
      const setCount = useContextSetAtom('count');
      return (
        <button onClick={() => setCount(42)} data-testid="btn">
          set
        </button>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <Display />
        <Button />
      </ContextQueryProvider>
    );

    renderCount.mockClear();
    act(() => screen.getByTestId('btn').click());
    expect(screen.getByTestId('count').textContent).toBe('42');
    expect(renderCount).toHaveBeenCalled();
  });
});

describe('useContextSetAtom', () => {
  it('returns a setter function', () => {
    const { ContextQueryProvider, useContextSetAtom } = setup();
    let setter: any;

    function Child() {
      setter = useContextSetAtom('count');
      return null;
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <Child />
      </ContextQueryProvider>
    );

    expect(typeof setter).toBe('function');
  });

  it('does not re-render when value changes (setter-only)', () => {
    const { ContextQueryProvider, useContextSetAtom, useContextAtom } = setup();
    const setterRenderCount = vi.fn();

    function SetterComponent() {
      const setCount = useContextSetAtom('count');
      setterRenderCount();
      return (
        <button onClick={() => setCount(99)} data-testid="setter-btn">
          set
        </button>
      );
    }

    function Display() {
      const [count] = useContextAtom('count');
      return <span data-testid="display">{count}</span>;
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <SetterComponent />
        <Display />
      </ContextQueryProvider>
    );

    setterRenderCount.mockClear();
    act(() => screen.getByTestId('setter-btn').click());
    expect(screen.getByTestId('display').textContent).toBe('99');
    // SetterComponent should NOT re-render because it doesn't subscribe to value
    expect(setterRenderCount).not.toHaveBeenCalled();
  });

  it('only re-renders subscribers of the changed atom', () => {
    const { ContextQueryProvider, useContextAtomValue, useContextSetAtom } = setup();
    const countRender = vi.fn();
    const nameRender = vi.fn();

    function CountDisplay() {
      const count = useContextAtomValue('count');
      countRender();
      return <span>{count}</span>;
    }

    function NameDisplay() {
      const name = useContextAtomValue('name');
      nameRender();
      return <span>{name}</span>;
    }

    function SetCount() {
      const setCount = useContextSetAtom('count');
      return (
        <button onClick={() => setCount(10)} data-testid="set-count">
          set count
        </button>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <CountDisplay />
        <NameDisplay />
        <SetCount />
      </ContextQueryProvider>
    );

    countRender.mockClear();
    nameRender.mockClear();

    act(() => screen.getByTestId('set-count').click());

    expect(countRender).toHaveBeenCalled();
    expect(nameRender).not.toHaveBeenCalled();
  });

  it('throws outside Provider', () => {
    const { useContextSetAtom } = setup();

    function Orphan() {
      useContextSetAtom('count');
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      'Hook must be used within a ContextQueryProvider'
    );
  });
});

describe('StrictMode compatibility', () => {
  it('works correctly in StrictMode', () => {
    const { ContextQueryProvider, useContextAtom } = setup();

    function Child() {
      const [count, setCount] = useContextAtom('count');
      return (
        <button onClick={() => setCount((c) => c + 1)} data-testid="btn">
          {count}
        </button>
      );
    }

    render(
      <StrictMode>
        <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
          <Child />
        </ContextQueryProvider>
      </StrictMode>
    );

    expect(screen.getByTestId('btn').textContent).toBe('0');
    act(() => screen.getByTestId('btn').click());
    expect(screen.getByTestId('btn').textContent).toBe('1');
  });
});
