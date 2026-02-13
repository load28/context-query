import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { createContextQuery } from '../index';

type TestAtoms = { count: number; name: string };

function setup() {
  return createContextQuery<TestAtoms>();
}

describe('useSnapshot', () => {
  it('returns [snapshot, setter] tuple', () => {
    const { ContextQueryProvider, useSnapshot } = setup();
    let result: any;

    function Child() {
      result = useSnapshot();
      return null;
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <Child />
      </ContextQueryProvider>
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ count: 0, name: 'hello' });
    expect(typeof result[1]).toBe('function');
  });

  it('snapshot updates when any atom changes', () => {
    const { ContextQueryProvider, useSnapshot, useContextSetAtom } = setup();

    function Display() {
      const [snapshot] = useSnapshot();
      return (
        <span data-testid="snap">
          {snapshot.count}-{snapshot.name}
        </span>
      );
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

    expect(screen.getByTestId('snap').textContent).toBe('0-hello');
    act(() => screen.getByTestId('btn').click());
    expect(screen.getByTestId('snap').textContent).toBe('42-hello');
  });

  it('setter patches multiple atoms', () => {
    const { ContextQueryProvider, useSnapshot } = setup();

    function Child() {
      const [snapshot, setSnapshot] = useSnapshot();
      return (
        <>
          <span data-testid="snap">
            {snapshot.count}-{snapshot.name}
          </span>
          <button
            onClick={() => setSnapshot({ count: 10, name: 'patched' })}
            data-testid="btn"
          >
            patch
          </button>
        </>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <Child />
      </ContextQueryProvider>
    );

    act(() => screen.getByTestId('btn').click());
    expect(screen.getByTestId('snap').textContent).toBe('10-patched');
  });

  it('throws outside Provider', () => {
    const { useSnapshot } = setup();

    function Orphan() {
      useSnapshot();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      'Hook must be used within a ContextQueryProvider'
    );
  });
});

describe('useSnapshotValue', () => {
  it('returns read-only snapshot', () => {
    const { ContextQueryProvider, useSnapshotValue } = setup();

    function Child() {
      const snapshot = useSnapshotValue();
      return (
        <span data-testid="snap">
          {snapshot.count}-{snapshot.name}
        </span>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 5, name: 'world' }}>
        <Child />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('snap').textContent).toBe('5-world');
  });

  it('updates when atoms change', () => {
    const { ContextQueryProvider, useSnapshotValue, useContextSetAtom } = setup();

    function Display() {
      const snapshot = useSnapshotValue();
      return <span data-testid="snap">{snapshot.name}</span>;
    }

    function Button() {
      const setName = useContextSetAtom('name');
      return (
        <button onClick={() => setName('updated')} data-testid="btn">
          set
        </button>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'original' }}>
        <Display />
        <Button />
      </ContextQueryProvider>
    );

    act(() => screen.getByTestId('btn').click());
    expect(screen.getByTestId('snap').textContent).toBe('updated');
  });
});

describe('usePatch', () => {
  it('returns a patch function', () => {
    const { ContextQueryProvider, usePatch } = setup();
    let patchFn: any;

    function Child() {
      patchFn = usePatch();
      return null;
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <Child />
      </ContextQueryProvider>
    );

    expect(typeof patchFn).toBe('function');
  });

  it('patches multiple atoms', () => {
    const { ContextQueryProvider, usePatch, useSnapshotValue } = setup();

    function Display() {
      const snap = useSnapshotValue();
      return (
        <span data-testid="snap">
          {snap.count}-{snap.name}
        </span>
      );
    }

    function PatchButton() {
      const patch = usePatch();
      return (
        <button
          onClick={() => patch({ count: 100, name: 'batch' })}
          data-testid="btn"
        >
          patch
        </button>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <Display />
        <PatchButton />
      </ContextQueryProvider>
    );

    act(() => screen.getByTestId('btn').click());
    expect(screen.getByTestId('snap').textContent).toBe('100-batch');
  });

  it('does not re-render the component using usePatch on state change', () => {
    const { ContextQueryProvider, usePatch, useContextSetAtom } = setup();
    const patchRender = vi.fn();

    function PatchComponent() {
      usePatch();
      patchRender();
      return null;
    }

    function Setter() {
      const setCount = useContextSetAtom('count');
      return (
        <button onClick={() => setCount(999)} data-testid="btn">
          set
        </button>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
        <PatchComponent />
        <Setter />
      </ContextQueryProvider>
    );

    patchRender.mockClear();
    act(() => screen.getByTestId('btn').click());
    expect(patchRender).not.toHaveBeenCalled();
  });
});
