import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { createContextQuery } from '../index';
import { derived } from '@context-query/core';

describe('Derived atoms with React hooks', () => {
  const setup = () =>
    createContextQuery({
      firstName: 'John',
      lastName: 'Doe',
      fullName: derived(
        (get) => `${get('firstName')} ${get('lastName')}`
      ),
    });

  describe('useContextAtomValue with derived atoms', () => {
    it('reads derived atom value', () => {
      const { ContextQueryProvider, useContextAtomValue } = setup();

      function Display() {
        const fullName = useContextAtomValue('fullName');
        return <div data-testid="name">{fullName}</div>;
      }

      render(
        <ContextQueryProvider atoms={{ firstName: 'John', lastName: 'Doe' }}>
          <Display />
        </ContextQueryProvider>
      );

      expect(screen.getByTestId('name').textContent).toBe('John Doe');
    });

    it('updates when dependency changes via useContextAtom', () => {
      const { ContextQueryProvider, useContextAtom, useContextAtomValue } = setup();

      function Display() {
        const fullName = useContextAtomValue('fullName');
        return <div data-testid="name">{fullName}</div>;
      }

      function Updater() {
        const [, setFirstName] = useContextAtom('firstName');
        return (
          <button onClick={() => setFirstName('Jane')}>
            Change
          </button>
        );
      }

      render(
        <ContextQueryProvider atoms={{ firstName: 'John', lastName: 'Doe' }}>
          <Display />
          <Updater />
        </ContextQueryProvider>
      );

      expect(screen.getByTestId('name').textContent).toBe('John Doe');

      act(() => {
        screen.getByText('Change').click();
      });

      expect(screen.getByTestId('name').textContent).toBe('Jane Doe');
    });

    it('updates when dependency changes via useContextSetAtom', () => {
      const { ContextQueryProvider, useContextSetAtom, useContextAtomValue } = setup();

      function Display() {
        const fullName = useContextAtomValue('fullName');
        return <div data-testid="name">{fullName}</div>;
      }

      function Updater() {
        const setLastName = useContextSetAtom('lastName');
        return (
          <button onClick={() => setLastName('Smith')}>
            Change
          </button>
        );
      }

      render(
        <ContextQueryProvider atoms={{ firstName: 'John', lastName: 'Doe' }}>
          <Display />
          <Updater />
        </ContextQueryProvider>
      );

      expect(screen.getByTestId('name').textContent).toBe('John Doe');

      act(() => {
        screen.getByText('Change').click();
      });

      expect(screen.getByTestId('name').textContent).toBe('John Smith');
    });
  });

  describe('useSnapshot with derived atoms', () => {
    it('includes derived atom values in snapshot', () => {
      const { ContextQueryProvider, useSnapshotValue } = setup();

      function Display() {
        const snapshot = useSnapshotValue();
        return (
          <div>
            <span data-testid="first">{snapshot.firstName}</span>
            <span data-testid="last">{snapshot.lastName}</span>
            <span data-testid="full">{snapshot.fullName}</span>
          </div>
        );
      }

      render(
        <ContextQueryProvider atoms={{ firstName: 'Alice', lastName: 'Wonder' }}>
          <Display />
        </ContextQueryProvider>
      );

      expect(screen.getByTestId('first').textContent).toBe('Alice');
      expect(screen.getByTestId('last').textContent).toBe('Wonder');
      expect(screen.getByTestId('full').textContent).toBe('Alice Wonder');
    });

    it('snapshot updates when dependency changes', () => {
      const { ContextQueryProvider, useSnapshot } = setup();

      function Display() {
        const [snapshot, patch] = useSnapshot();
        return (
          <div>
            <span data-testid="full">{snapshot.fullName}</span>
            <button onClick={() => patch({ firstName: 'Bob' })}>
              Change
            </button>
          </div>
        );
      }

      render(
        <ContextQueryProvider atoms={{ firstName: 'Alice', lastName: 'Wonder' }}>
          <Display />
        </ContextQueryProvider>
      );

      expect(screen.getByTestId('full').textContent).toBe('Alice Wonder');

      act(() => {
        screen.getByText('Change').click();
      });

      expect(screen.getByTestId('full').textContent).toBe('Bob Wonder');
    });
  });

  describe('usePatch with derived atoms', () => {
    it('patch ignores derived atom keys', () => {
      const { ContextQueryProvider, usePatch, useContextAtomValue } = setup();

      function Display() {
        const fullName = useContextAtomValue('fullName');
        return <div data-testid="name">{fullName}</div>;
      }

      function Updater() {
        const patch = usePatch();
        return (
          <button onClick={() => patch({ firstName: 'Bob', fullName: 'WRONG' } as any)}>
            Patch
          </button>
        );
      }

      render(
        <ContextQueryProvider atoms={{ firstName: 'Alice', lastName: 'Wonder' }}>
          <Display />
          <Updater />
        </ContextQueryProvider>
      );

      act(() => {
        screen.getByText('Patch').click();
      });

      // Derived atom should reflect computed value, not the patched one
      expect(screen.getByTestId('name').textContent).toBe('Bob Wonder');
    });
  });

  describe('useStore with derived atoms', () => {
    it('store.isDerivedKey works correctly', () => {
      const { ContextQueryProvider, useStore } = setup();
      let storeRef: any;

      function StoreAccessor() {
        storeRef = useStore();
        return null;
      }

      render(
        <ContextQueryProvider atoms={{ firstName: 'A', lastName: 'B' }}>
          <StoreAccessor />
        </ContextQueryProvider>
      );

      expect(storeRef.isDerivedKey('fullName')).toBe(true);
      expect(storeRef.isDerivedKey('firstName')).toBe(false);
    });

    it('store.setAtomValue throws for derived atoms', () => {
      const { ContextQueryProvider, useStore } = setup();
      let storeRef: any;

      function StoreAccessor() {
        storeRef = useStore();
        return null;
      }

      render(
        <ContextQueryProvider atoms={{ firstName: 'A', lastName: 'B' }}>
          <StoreAccessor />
        </ContextQueryProvider>
      );

      expect(() => storeRef.setAtomValue('fullName', 'WRONG')).toThrow(
        'Cannot set value of derived signal'
      );
    });
  });

  describe('chained derived atoms in React', () => {
    it('chained derived atoms update correctly', () => {
      const { ContextQueryProvider, useContextAtomValue, useContextSetAtom } =
        createContextQuery({
          base: 10,
          doubled: derived((get) => get('base') * 2),
          quadrupled: derived((get) => get('doubled') * 2),
        });

      function Display() {
        const quadrupled = useContextAtomValue('quadrupled');
        return <div data-testid="val">{quadrupled}</div>;
      }

      function Updater() {
        const setBase = useContextSetAtom('base');
        return (
          <button onClick={() => setBase(5)}>Change</button>
        );
      }

      render(
        <ContextQueryProvider atoms={{ base: 10 }}>
          <Display />
          <Updater />
        </ContextQueryProvider>
      );

      expect(screen.getByTestId('val').textContent).toBe('40');

      act(() => {
        screen.getByText('Change').click();
      });

      expect(screen.getByTestId('val').textContent).toBe('20');
    });
  });

  describe('independent providers with derived atoms', () => {
    it('two providers have independent derived values', () => {
      const { ContextQueryProvider, useContextAtomValue } = setup();

      function Display({ testId }: { testId: string }) {
        const fullName = useContextAtomValue('fullName');
        return <div data-testid={testId}>{fullName}</div>;
      }

      render(
        <>
          <ContextQueryProvider atoms={{ firstName: 'Alice', lastName: 'A' }}>
            <Display testId="p1" />
          </ContextQueryProvider>
          <ContextQueryProvider atoms={{ firstName: 'Bob', lastName: 'B' }}>
            <Display testId="p2" />
          </ContextQueryProvider>
        </>
      );

      expect(screen.getByTestId('p1').textContent).toBe('Alice A');
      expect(screen.getByTestId('p2').textContent).toBe('Bob B');
    });
  });

  describe('StrictMode compatibility', () => {
    it('works correctly in React.StrictMode', () => {
      const { ContextQueryProvider, useContextAtomValue, useContextSetAtom } = setup();

      function Display() {
        const fullName = useContextAtomValue('fullName');
        return <div data-testid="name">{fullName}</div>;
      }

      function Updater() {
        const setFirstName = useContextSetAtom('firstName');
        return <button onClick={() => setFirstName('Strict')}>Change</button>;
      }

      render(
        <React.StrictMode>
          <ContextQueryProvider atoms={{ firstName: 'John', lastName: 'Doe' }}>
            <Display />
            <Updater />
          </ContextQueryProvider>
        </React.StrictMode>
      );

      expect(screen.getByTestId('name').textContent).toBe('John Doe');

      act(() => {
        screen.getByText('Change').click();
      });

      expect(screen.getByTestId('name').textContent).toBe('Strict Doe');
    });
  });
});
