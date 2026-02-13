/**
 * context-query 라이브러리 통합 검증 예제
 *
 * 모든 Epic(1~4)의 주요 기능을 실제 시나리오로 검증합니다.
 * - Core: ContextQueryStore, atom(), derived(), shallowEqual, RESET, debug API, error handling
 * - React: Provider, 훅(값/세터/셀렉터/리셋/에러), Error Boundary
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React, { Component, ReactNode } from 'react';
import { createContextQuery } from '@context-query/react';
import {
  ContextQueryStore,
  atom,
  derived,
  shallowEqual,
  RESET,
} from '@context-query/core';

// ─── Part 1: Core 단독 시나리오 ──────────────────────────────

describe('Integration: Core 단독', () => {
  it('Todo 앱 — 할 일 목록 관리 시나리오', () => {
    type Todo = { id: number; text: string; done: boolean };

    const store = new ContextQueryStore({
      todos: atom<Todo[]>([], { equalityFn: shallowEqual }),
      filter: 'all' as 'all' | 'active' | 'done',
      filteredTodos: derived((get) => {
        const todos: Todo[] = get('todos');
        const filter: string = get('filter');
        if (filter === 'active') return todos.filter((t) => !t.done);
        if (filter === 'done') return todos.filter((t) => t.done);
        return todos;
      }),
      totalCount: derived((get) => (get('todos') as Todo[]).length),
      doneCount: derived((get) => (get('todos') as Todo[]).filter((t: Todo) => t.done).length),
    });

    // 초기 상태
    expect(store.getAtomValue('filteredTodos')).toEqual([]);
    expect(store.getAtomValue('totalCount')).toBe(0);

    // 할 일 추가
    store.setAtomValue('todos', [
      { id: 1, text: 'Epic 1 구현', done: true },
      { id: 2, text: 'Epic 2 구현', done: true },
      { id: 3, text: 'Epic 3 구현', done: false },
    ]);

    expect(store.getAtomValue('totalCount')).toBe(3);
    expect(store.getAtomValue('doneCount')).toBe(2);
    expect(store.getAtomValue('filteredTodos')).toHaveLength(3);

    // 필터 변경 → 파생 atom 자동 갱신
    store.setAtomValue('filter', 'active');
    expect(store.getAtomValue('filteredTodos')).toEqual([
      { id: 3, text: 'Epic 3 구현', done: false },
    ]);

    store.setAtomValue('filter', 'done');
    expect(store.getAtomValue('filteredTodos')).toHaveLength(2);

    // 리셋 → 초기값으로 복원
    store.resetAtom('todos');
    expect(store.getAtomValue('todos')).toEqual([]);
    expect(store.getAtomValue('totalCount')).toBe(0);

    // RESET 심볼로도 리셋 가능
    store.setAtomValue('filter', 'active');
    store.setAtomValue('filter', RESET as any);
    expect(store.getAtomValue('filter')).toBe('all');
  });

  it('shallowEqual — 동일 구조 객체 업데이트 시 리스너 미호출', () => {
    const store = new ContextQueryStore({
      user: atom({ name: 'Alice', age: 30 }, { equalityFn: shallowEqual }),
    });
    const listener = vi.fn();
    store.subscribeToAtom('user', listener);

    // 같은 구조 → 리스너 호출 안 됨
    store.setAtomValue('user', { name: 'Alice', age: 30 });
    expect(listener).not.toHaveBeenCalled();

    // 다른 값 → 리스너 호출
    store.setAtomValue('user', { name: 'Bob', age: 25 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('resetAll — 모든 writable atom 초기화', () => {
    const store = new ContextQueryStore({
      a: 1,
      b: 'hello',
      sum: derived((get) => `${get('a')}-${get('b')}`),
    });

    store.setAtomValue('a', 99);
    store.setAtomValue('b', 'world');
    expect(store.getAtomValue('sum')).toBe('99-world');

    store.resetAll();
    expect(store.getAtomValue('a')).toBe(1);
    expect(store.getAtomValue('b')).toBe('hello');
    expect(store.getAtomValue('sum')).toBe('1-hello');
  });

  it('디버그 API — getDebugInfo, getDependencyGraph', () => {
    const store = new ContextQueryStore({
      x: 10,
      y: 20,
      sum: derived((get) => get('x') + get('y')),
    });

    const graph = store.getDependencyGraph();
    expect(graph['sum']).toEqual(expect.arrayContaining(['x', 'y']));

    const info = store.getDebugInfo();
    expect(info['x'].value).toBe(10);
    expect(info['x'].isDerived).toBe(false);
    expect(info['sum'].value).toBe(30);
    expect(info['sum'].isDerived).toBe(true);
    expect(info['sum'].dependencies).toEqual(expect.arrayContaining(['x', 'y']));
  });

  it('에러 핸들링 — 파생 atom 에러/복구 + onError', () => {
    const onError = vi.fn();
    const store = new ContextQueryStore(
      {
        input: 'hello',
        parsed: derived((get) => {
          const v = get('input') as string;
          if (v === '') throw new Error('Input required');
          return v.toUpperCase();
        }),
      },
      { onError }
    );

    expect(store.getAtomValue('parsed')).toBe('HELLO');
    expect(store.getAtomError('parsed')).toBeNull();

    // 에러 유발
    store.setAtomValue('input', '');
    expect(() => store.getAtomValue('parsed')).toThrow('Input required');
    expect(store.getAtomError('parsed')?.message).toBe('Input required');
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Input required' }),
      expect.objectContaining({ key: 'parsed', type: 'derived' })
    );

    // 복구
    store.setAtomValue('input', 'world');
    expect(store.getAtomValue('parsed')).toBe('WORLD');
    expect(store.getAtomError('parsed')).toBeNull();
  });
});

// ─── Part 2: React 통합 시나리오 ──────────────────────────────

// Error Boundary
class TestErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">{this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

describe('Integration: React 컴포넌트', () => {
  it('쇼핑 카트 시나리오 — Provider, 값/세터/셀렉터/리셋 훅', () => {
    type CartItem = { name: string; price: number; qty: number };

    const {
      ContextQueryProvider,
      useContextAtomValue,
      useContextSetAtom,
      useContextAtomSelector,
      useResetAtom,
    } = createContextQuery({
      items: atom<CartItem[]>([], { equalityFn: shallowEqual }),
      coupon: 0,
      totalPrice: derived((get) => {
        const items: CartItem[] = get('items');
        const coupon: number = get('coupon');
        const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
        return Math.max(0, subtotal - coupon);
      }),
      itemCount: derived((get) => {
        const items: CartItem[] = get('items');
        return items.reduce((sum, i) => sum + i.qty, 0);
      }),
    });

    const renderCounts = { total: 0, count: 0 };

    function TotalPrice() {
      const total = useContextAtomValue('totalPrice');
      renderCounts.total++;
      return <div data-testid="total">{total}</div>;
    }

    function ItemCount() {
      const count = useContextAtomValue('itemCount');
      renderCounts.count++;
      return <div data-testid="count">{count}</div>;
    }

    function FirstItemName() {
      const name = useContextAtomSelector(
        'items',
        (items: CartItem[]) => items.length > 0 ? items[0].name : '(empty)'
      );
      return <div data-testid="first-item">{name}</div>;
    }

    function Controls() {
      const setItems = useContextSetAtom('items');
      const setCoupon = useContextSetAtom('coupon');
      const resetItems = useResetAtom('items');
      return (
        <div>
          <button
            data-testid="add-item"
            onClick={() =>
              setItems((prev: CartItem[]) => [
                ...prev,
                { name: 'Widget', price: 1000, qty: 2 },
              ])
            }
          >
            Add
          </button>
          <button
            data-testid="add-second"
            onClick={() =>
              setItems((prev: CartItem[]) => [
                ...prev,
                { name: 'Gadget', price: 500, qty: 1 },
              ])
            }
          >
            Add Second
          </button>
          <button data-testid="apply-coupon" onClick={() => setCoupon(300)}>
            Coupon
          </button>
          <button data-testid="reset-cart" onClick={() => resetItems()}>
            Reset
          </button>
        </div>
      );
    }

    render(
      <ContextQueryProvider atoms={{ items: [], coupon: 0 }}>
        <TotalPrice />
        <ItemCount />
        <FirstItemName />
        <Controls />
      </ContextQueryProvider>
    );

    // 초기 상태
    expect(screen.getByTestId('total').textContent).toBe('0');
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('first-item').textContent).toBe('(empty)');

    // 아이템 추가
    act(() => screen.getByTestId('add-item').click());
    expect(screen.getByTestId('total').textContent).toBe('2000');
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('first-item').textContent).toBe('Widget');

    // 두 번째 아이템
    act(() => screen.getByTestId('add-second').click());
    expect(screen.getByTestId('total').textContent).toBe('2500');
    expect(screen.getByTestId('count').textContent).toBe('3');
    expect(screen.getByTestId('first-item').textContent).toBe('Widget'); // 첫 아이템 변화 없음

    // 쿠폰 적용
    act(() => screen.getByTestId('apply-coupon').click());
    expect(screen.getByTestId('total').textContent).toBe('2200');

    // 카트 리셋
    act(() => screen.getByTestId('reset-cart').click());
    expect(screen.getByTestId('total').textContent).toBe('0');
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('first-item').textContent).toBe('(empty)');
  });

  it('셀렉터 — 불필요한 리렌더링 방지', () => {
    const {
      ContextQueryProvider,
      useContextAtomSelector,
      useContextSetAtom,
    } = createContextQuery({
      profile: { name: 'Alice', email: 'alice@test.com', bio: 'Developer' },
    });

    const nameRenders = vi.fn();

    function NameOnly() {
      const name = useContextAtomSelector('profile', (p: any) => p.name);
      nameRenders();
      return <div data-testid="name">{name}</div>;
    }

    function Updater() {
      const setProfile = useContextSetAtom('profile');
      return (
        <div>
          <button
            data-testid="change-bio"
            onClick={() =>
              setProfile((p: any) => ({ ...p, bio: 'Senior Dev' }))
            }
          >
            Bio
          </button>
          <button
            data-testid="change-name"
            onClick={() =>
              setProfile((p: any) => ({ ...p, name: 'Bob' }))
            }
          >
            Name
          </button>
        </div>
      );
    }

    render(
      <ContextQueryProvider
        atoms={{ profile: { name: 'Alice', email: 'alice@test.com', bio: 'Developer' } }}
      >
        <NameOnly />
        <Updater />
      </ContextQueryProvider>
    );

    const initial = nameRenders.mock.calls.length;

    // bio만 변경 → name selector 결과 동일 → 리렌더 X
    act(() => screen.getByTestId('change-bio').click());
    expect(nameRenders.mock.calls.length).toBe(initial);
    expect(screen.getByTestId('name').textContent).toBe('Alice');

    // name 변경 → 리렌더 O
    act(() => screen.getByTestId('change-name').click());
    expect(nameRenders.mock.calls.length).toBe(initial + 1);
    expect(screen.getByTestId('name').textContent).toBe('Bob');
  });

  it('에러 경계 통합 — 에러/복구 시나리오', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const {
      ContextQueryProvider,
      useContextAtomValue,
      useContextSetAtom,
      useAtomError,
    } = createContextQuery({
      denominator: 10,
      ratio: derived((get) => {
        const d = get('denominator') as number;
        if (d === 0) throw new Error('Cannot divide by zero');
        return 100 / d;
      }),
    });

    function RatioDisplay() {
      const ratio = useContextAtomValue('ratio');
      return <div data-testid="ratio">{ratio}</div>;
    }

    function ErrorStatus() {
      const err = useAtomError('ratio');
      return <div data-testid="error-status">{err ? err.message : 'ok'}</div>;
    }

    function Controls() {
      const setDenom = useContextSetAtom('denominator');
      return (
        <div>
          <button data-testid="set-zero" onClick={() => setDenom(0)}>Zero</button>
          <button data-testid="set-five" onClick={() => setDenom(5)}>Five</button>
        </div>
      );
    }

    render(
      <ContextQueryProvider atoms={{ denominator: 10 }}>
        <ErrorStatus />
        <TestErrorBoundary>
          <RatioDisplay />
        </TestErrorBoundary>
        <Controls />
      </ContextQueryProvider>
    );

    // 정상 상태
    expect(screen.getByTestId('ratio').textContent).toBe('10');
    expect(screen.getByTestId('error-status').textContent).toBe('ok');

    // 에러 유발 → Error Boundary 활성화
    act(() => screen.getByTestId('set-zero').click());
    expect(screen.getByTestId('error-boundary').textContent).toBe('Cannot divide by zero');
    expect(screen.getByTestId('error-status').textContent).toBe('Cannot divide by zero');

    spy.mockRestore();
  });

  it('함수 업데이터 에러 — 값 변경 없이 안전 처리', () => {
    const { ContextQueryProvider, useContextAtomValue, useContextSetAtom } =
      createContextQuery({ count: 5 });

    function Display() {
      const count = useContextAtomValue('count');
      return <div data-testid="val">{count}</div>;
    }

    function Controls() {
      const setCount = useContextSetAtom('count');
      return (
        <div>
          <button
            data-testid="bad-update"
            onClick={() => setCount(() => { throw new Error('boom'); })}
          >
            Bad
          </button>
          <button data-testid="good-update" onClick={() => setCount(99)}>
            Good
          </button>
        </div>
      );
    }

    render(
      <ContextQueryProvider atoms={{ count: 5 }}>
        <Display />
        <Controls />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('val').textContent).toBe('5');

    // 에러 업데이터 → 값 변경 없음
    act(() => screen.getByTestId('bad-update').click());
    expect(screen.getByTestId('val').textContent).toBe('5');

    // 정상 업데이트
    act(() => screen.getByTestId('good-update').click());
    expect(screen.getByTestId('val').textContent).toBe('99');
  });

  it('mixed atom()/derived()/plain — 복합 정의', () => {
    const {
      ContextQueryProvider,
      useContextAtomValue,
      useContextSetAtom,
    } = createContextQuery({
      temperature: 20,                                          // plain
      unit: atom<'C' | 'F'>('C', { equalityFn: Object.is }),   // atom()
      display: derived((get) => {                               // derived()
        const temp = get('temperature') as number;
        const unit = get('unit') as string;
        if (unit === 'F') return `${(temp * 9) / 5 + 32}°F`;
        return `${temp}°C`;
      }),
    });

    function TempDisplay() {
      const display = useContextAtomValue('display');
      return <div data-testid="temp">{display}</div>;
    }

    function Controls() {
      const setTemp = useContextSetAtom('temperature');
      const setUnit = useContextSetAtom('unit');
      return (
        <div>
          <button data-testid="set-30" onClick={() => setTemp(30)}>30</button>
          <button data-testid="set-F" onClick={() => setUnit('F')}>F</button>
        </div>
      );
    }

    render(
      <ContextQueryProvider atoms={{ temperature: 20, unit: 'C' as 'C' | 'F' }}>
        <TempDisplay />
        <Controls />
      </ContextQueryProvider>
    );

    expect(screen.getByTestId('temp').textContent).toBe('20°C');

    act(() => screen.getByTestId('set-30').click());
    expect(screen.getByTestId('temp').textContent).toBe('30°C');

    act(() => screen.getByTestId('set-F').click());
    expect(screen.getByTestId('temp').textContent).toBe('86°F');
  });
});
