import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createContextQuery } from '../index';
import { derived } from '@context-query/core';

// Simple Error Boundary for tests
class TestErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-fallback">{this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

describe('Story 4.4: useAtomError', () => {
  it('returns null when no error', () => {
    const { ContextQueryProvider, useAtomError } = createContextQuery({
      count: 0,
    });

    function ErrorDisplay() {
      const error = useAtomError('count');
      return <div data-testid="error">{error ? error.message : 'none'}</div>;
    }

    render(
      <ContextQueryProvider atoms={{ count: 0 }}>
        <ErrorDisplay />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  it('returns error for errored derived atom', () => {
    const { ContextQueryProvider, useAtomError, useContextSetAtom } = createContextQuery({
      divisor: 1,
      result: derived((get) => {
        const d = get('divisor');
        if (d === 0) throw new Error('Division by zero');
        return 10 / d;
      }),
    });

    function ErrorDisplay() {
      const error = useAtomError('result');
      return <div data-testid="error">{error ? error.message : 'none'}</div>;
    }

    function Updater() {
      const setDivisor = useContextSetAtom('divisor');
      return <button onClick={() => setDivisor(0)}>Zero</button>;
    }

    render(
      <ContextQueryProvider atoms={{ divisor: 1 }}>
        <ErrorDisplay />
        <Updater />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('error').textContent).toBe('none');

    act(() => {
      screen.getByText('Zero').click();
    });

    expect(screen.getByTestId('error').textContent).toBe('Division by zero');
  });
});

describe('Story 4.4: Error Boundary integration', () => {
  it('derived atom error triggers Error Boundary', () => {
    const { ContextQueryProvider, useContextAtomValue } = createContextQuery({
      divisor: 0,
      result: derived((get) => {
        const d = get('divisor');
        if (d === 0) throw new Error('Division by zero');
        return 10 / d;
      }),
    });

    function ResultDisplay() {
      const result = useContextAtomValue('result');
      return <div data-testid="result">{result}</div>;
    }

    // Suppress console.error for expected error boundary logs
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ContextQueryProvider atoms={{ divisor: 0 }}>
        <TestErrorBoundary fallback={<div>Error</div>}>
          <ResultDisplay />
        </TestErrorBoundary>
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('error-fallback').textContent).toBe('Division by zero');

    spy.mockRestore();
  });

  it('normal atoms work alongside errored derived atoms', () => {
    const { ContextQueryProvider, useContextAtomValue } = createContextQuery({
      count: 42,
      divisor: 0,
      result: derived((get) => {
        const d = get('divisor');
        if (d === 0) throw new Error('Division by zero');
        return 10 / d;
      }),
    });

    function CountDisplay() {
      const count = useContextAtomValue('count');
      return <div data-testid="count">{count}</div>;
    }

    function ResultDisplay() {
      const result = useContextAtomValue('result');
      return <div data-testid="result">{result}</div>;
    }

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ContextQueryProvider atoms={{ count: 42, divisor: 0 }}>
        <CountDisplay />
        <TestErrorBoundary fallback={<div>Error</div>}>
          <ResultDisplay />
        </TestErrorBoundary>
      </ContextQueryProvider>
    );

    // Count should work fine
    expect(screen.getByTestId('count').textContent).toBe('42');
    // Result should be in error boundary
    expect(screen.getByTestId('error-fallback').textContent).toBe('Division by zero');

    spy.mockRestore();
  });
});

describe('Story 4.3: Function updater error safety (React)', () => {
  it('atom value stays unchanged when updater function throws', () => {
    const { ContextQueryProvider, useContextAtomValue, useContextSetAtom } = createContextQuery({
      count: 10,
    });

    function Display() {
      const count = useContextAtomValue('count');
      return <div data-testid="count">{count}</div>;
    }

    function Updater() {
      const setCount = useContextSetAtom('count');
      return (
        <div>
          <button onClick={() => setCount((prev: number) => {
            throw new Error('updater error');
          })}>
            Bad Update
          </button>
          <button onClick={() => setCount(20)}>Good Update</button>
        </div>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 10 }}>
        <Display />
        <Updater />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('count').textContent).toBe('10');

    // Bad updater → value should remain 10
    act(() => {
      screen.getByText('Bad Update').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('10');

    // Good update → value should change to 20
    act(() => {
      screen.getByText('Good Update').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('20');
  });
});
