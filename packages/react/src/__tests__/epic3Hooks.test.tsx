import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { createContextQuery } from '../index';
import { atom, derived, shallowEqual } from '@context-query/core';

describe('Story 3.2: useContextAtomSelector', () => {
  it('selects a part of atom value', () => {
    const { ContextQueryProvider, useContextAtomSelector } = createContextQuery({
      user: atom({ name: 'John', age: 30, email: 'john@test.com' }),
    });

    function Display() {
      const name = useContextAtomSelector('user', (u) => u.name);
      return <div data-testid="name">{name}</div>;
    }

    render(
      <ContextQueryProvider atoms={{ user: { name: 'John', age: 30, email: 'john@test.com' } }}>
        <Display />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('name').textContent).toBe('John');
  });

  it('re-renders only when selected value changes', () => {
    const { ContextQueryProvider, useContextAtomSelector, useContextSetAtom } = createContextQuery({
      user: { name: 'John', age: 30, email: 'john@test.com' },
    });

    const renderCount = vi.fn();

    function NameDisplay() {
      const name = useContextAtomSelector('user', (u: any) => u.name);
      renderCount();
      return <div data-testid="name">{name}</div>;
    }

    function Updater() {
      const setUser = useContextSetAtom('user');
      return (
        <div>
          <button onClick={() => setUser({ name: 'John', age: 31, email: 'john@test.com' })}>
            Change Age
          </button>
          <button onClick={() => setUser({ name: 'Jane', age: 30, email: 'john@test.com' })}>
            Change Name
          </button>
        </div>
      );
    }

    render(
      <ContextQueryProvider atoms={{ user: { name: 'John', age: 30, email: 'john@test.com' } }}>
        <NameDisplay />
        <Updater />
      </ContextQueryProvider>
    );

    const initialRenderCount = renderCount.mock.calls.length;

    // Change age only → name didn't change → should NOT re-render
    act(() => {
      screen.getByText('Change Age').click();
    });
    expect(renderCount.mock.calls.length).toBe(initialRenderCount);

    // Change name → should re-render
    act(() => {
      screen.getByText('Change Name').click();
    });
    expect(renderCount.mock.calls.length).toBe(initialRenderCount + 1);
    expect(screen.getByTestId('name').textContent).toBe('Jane');
  });

  it('supports custom equalityFn for selector result', () => {
    const { ContextQueryProvider, useContextAtomSelector, useContextSetAtom } = createContextQuery({
      data: { items: [1, 2, 3], meta: 'info' },
    });

    const renderCount = vi.fn();

    function ItemsDisplay() {
      const items = useContextAtomSelector(
        'data',
        (d: any) => d.items,
        shallowEqual
      );
      renderCount();
      return <div data-testid="items">{items.join(',')}</div>;
    }

    function Updater() {
      const setData = useContextSetAtom('data');
      return (
        <div>
          <button onClick={() => setData({ items: [1, 2, 3], meta: 'changed' })}>
            Change Meta
          </button>
          <button onClick={() => setData({ items: [4, 5, 6], meta: 'info' })}>
            Change Items
          </button>
        </div>
      );
    }

    render(
      <ContextQueryProvider atoms={{ data: { items: [1, 2, 3], meta: 'info' } }}>
        <ItemsDisplay />
        <Updater />
      </ContextQueryProvider>
    );

    const initialRenderCount = renderCount.mock.calls.length;

    // Change meta → items array is same structure → shallowEqual says equal → no re-render
    act(() => {
      screen.getByText('Change Meta').click();
    });
    expect(renderCount.mock.calls.length).toBe(initialRenderCount);

    // Change items → re-render
    act(() => {
      screen.getByText('Change Items').click();
    });
    expect(renderCount.mock.calls.length).toBe(initialRenderCount + 1);
    expect(screen.getByTestId('items').textContent).toBe('4,5,6');
  });
});

describe('Story 3.3: useResetAtom', () => {
  it('resets atom to initial value', () => {
    const { ContextQueryProvider, useContextAtomValue, useContextSetAtom, useResetAtom } =
      createContextQuery({
        count: 0,
      });

    function Display() {
      const count = useContextAtomValue('count');
      return <div data-testid="count">{count}</div>;
    }

    function Controls() {
      const setCount = useContextSetAtom('count');
      const resetCount = useResetAtom('count');
      return (
        <div>
          <button onClick={() => setCount(42)}>Set 42</button>
          <button onClick={() => resetCount()}>Reset</button>
        </div>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 0 }}>
        <Display />
        <Controls />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('count').textContent).toBe('0');

    act(() => {
      screen.getByText('Set 42').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('42');

    act(() => {
      screen.getByText('Reset').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('useResetAtom does not cause re-renders on value change', () => {
    const { ContextQueryProvider, useContextSetAtom, useResetAtom } =
      createContextQuery({
        count: 0,
      });

    const renderCount = vi.fn();

    function ResetButton() {
      const resetCount = useResetAtom('count');
      renderCount();
      return <button onClick={() => resetCount()}>Reset</button>;
    }

    function Setter() {
      const setCount = useContextSetAtom('count');
      return <button onClick={() => setCount(42)}>Set</button>;
    }

    render(
      <ContextQueryProvider atoms={{ count: 0 }}>
        <ResetButton />
        <Setter />
      </ContextQueryProvider>
    );

    const initialRenderCount = renderCount.mock.calls.length;

    act(() => {
      screen.getByText('Set').click();
    });

    // ResetButton should NOT re-render when count changes
    expect(renderCount.mock.calls.length).toBe(initialRenderCount);
  });
});

describe('Story 3.4: atom() with React createContextQuery', () => {
  it('atom() with shallowEqual prevents unnecessary re-renders', () => {
    const { ContextQueryProvider, useContextAtomValue, useContextSetAtom } = createContextQuery({
      user: atom({ name: 'John', age: 30 }, { equalityFn: shallowEqual }),
    });

    const renderCount = vi.fn();

    function UserDisplay() {
      const user = useContextAtomValue('user');
      renderCount();
      return <div data-testid="user">{user.name}</div>;
    }

    function Updater() {
      const setUser = useContextSetAtom('user');
      return (
        <div>
          <button onClick={() => setUser({ name: 'John', age: 30 })}>
            Same Value
          </button>
          <button onClick={() => setUser({ name: 'Jane', age: 30 })}>
            Different Value
          </button>
        </div>
      );
    }

    render(
      <ContextQueryProvider atoms={{ user: { name: 'John', age: 30 } }}>
        <UserDisplay />
        <Updater />
      </ContextQueryProvider>
    );

    const initialRenderCount = renderCount.mock.calls.length;

    // Same structure → shallowEqual → no re-render
    act(() => {
      screen.getByText('Same Value').click();
    });
    expect(renderCount.mock.calls.length).toBe(initialRenderCount);

    // Different value → re-render
    act(() => {
      screen.getByText('Different Value').click();
    });
    expect(renderCount.mock.calls.length).toBe(initialRenderCount + 1);
    expect(screen.getByTestId('user').textContent).toBe('Jane');
  });

  it('mixed plain, atom(), and derived() work together', () => {
    const { ContextQueryProvider, useContextAtomValue, useContextSetAtom } = createContextQuery({
      count: 0,
      user: atom({ name: 'John' }, { equalityFn: shallowEqual }),
      greeting: derived((get) => `Hello, ${get('user').name}! Count: ${get('count')}`),
    });

    function Display() {
      const greeting = useContextAtomValue('greeting');
      return <div data-testid="greeting">{greeting}</div>;
    }

    function Controls() {
      const setCount = useContextSetAtom('count');
      const setUser = useContextSetAtom('user');
      return (
        <div>
          <button onClick={() => setCount(1)}>Inc</button>
          <button onClick={() => setUser({ name: 'Jane' })}>Rename</button>
        </div>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, user: { name: 'John' } }}>
        <Display />
        <Controls />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('greeting').textContent).toBe('Hello, John! Count: 0');

    act(() => {
      screen.getByText('Inc').click();
    });
    expect(screen.getByTestId('greeting').textContent).toBe('Hello, John! Count: 1');

    act(() => {
      screen.getByText('Rename').click();
    });
    expect(screen.getByTestId('greeting').textContent).toBe('Hello, Jane! Count: 1');
  });
});
