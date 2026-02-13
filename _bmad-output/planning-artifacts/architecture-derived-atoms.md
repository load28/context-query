# Architecture Design: 파생 Atom 및 v1.0 Core 확장

**Date**: 2026-02-13
**Status**: Draft
**Scope**: Epic 2 (파생 atom), Epic 3 (셀렉터/동등성/리셋) 의 핵심 아키텍처

---

## 1. 현재 아키텍처 분석

### 1.1 현재 데이터 흐름

```
createContextQuery<TAtoms>()
  ├── createReactContextQuery()
  │     ├── StoreContext = createContext<ContextQueryStore<TAtoms>>()
  │     └── ContextQueryProvider({ atoms })
  │           └── useMemo(() => new ContextQueryStore(atoms))
  │                 └── atoms.forEach → new AtomStore(value)
  │                       └── Map<keyof TAtoms, AtomStore<any>>
  └── hooks (7개)
        └── useStoreContext() → store
              └── useAtomSubscription(store, key)
                    └── useSyncExternalStore(subscribe, getSnapshot)
```

### 1.2 현재 클래스 구조

```
AtomStore<T>
  - value: T
  - listeners: Set<AtomListener>
  + getValue(): T
  + setValue(newValue: T): void       // Object.is 비교
  + subscribe(listener): Subscription

ContextQueryStore<TAtoms>
  - atoms: Map<keyof TAtoms, AtomStore<any>>
  - cachedSnapshot: TAtoms | null
  - snapshotStale: boolean
  + getAtomValue(key): TAtoms[key]
  + setAtomValue(key, value): void
  + subscribeToAtom(key, listener): Subscription
  + getSnapshot(): TAtoms
  + patch(partial): void
  + subscribe(callback): Subscription
```

### 1.3 핵심 관찰

1. **atoms 파라미터의 이중 역할**: `createContextQuery<TAtoms>()`에서 TAtoms는 타입 파라미터로만 존재. 실제 초기값은 `<Provider atoms={...}>`에서 전달. **atom 정의(config)와 초기값이 분리되어 있지 않음**.

2. **AtomStore는 값 컨테이너**: 순수한 값 저장 + 구독 패턴. 계산 로직 없음.

3. **ContextQueryStore의 생성자**: `Object.entries(initialValues)`로 평탄하게 AtomStore 생성. 파생 atom을 구분할 메커니즘 없음.

4. **Provider의 atoms prop**: `AtomValues<TAtoms>` 타입으로, 모든 key에 concrete 값을 기대.

---

## 2. 설계 목표

1. **하위 호환성**: 기존 `createContextQuery<TAtoms>()` + `<Provider atoms={...}>` 패턴이 그대로 동작
2. **타입 안전성**: 파생 atom은 읽기 전용으로 타입 레벨에서 강제
3. **점진적 확장**: 파생 atom, 셀렉터, 동등성, 리셋을 독립적으로 추가 가능
4. **성능**: 의존성 추적은 O(1) lookup, 재계산은 필요할 때만
5. **단순성**: Jotai의 복잡한 WeakMap 기반 구조를 피하고, context-query의 직관적 모델 유지

---

## 3. 설계 결정: Atom 정의 모델

### 3.1 선택지 비교

**Option A: Provider atoms prop에서 파생 함수 전달**
```typescript
const { Provider } = createContextQuery<{ firstName: string; lastName: string; fullName: string }>();
// Provider에서:
<Provider atoms={{
  firstName: 'John',
  lastName: 'Doe',
  fullName: derived((get) => `${get('firstName')} ${get('lastName')}`)
}}>
```
- 문제: Provider에 초기값과 파생 정의가 혼재. 파생 atom에 "초기값"이 없으므로 TAtoms 타입 불일치.

**Option B: createContextQuery에서 atom 정의 전달 (선택)**
```typescript
const { Provider, useContextAtomValue } = createContextQuery({
  firstName: 'John',
  lastName: 'Doe',
  fullName: derived((get) => `${get('firstName')} ${get('lastName')}`),
});
// Provider에서:
<Provider>  // 기본값 사용
<Provider atoms={{ firstName: 'Jane' }}>  // 부분 오버라이드
```
- 장점: atom 정의와 초기값이 한 곳에. 타입 추론 자연스러움. Provider는 오버라이드만 담당.
- **API 변경**: `createContextQuery<TAtoms>()` → `createContextQuery(atomDefs)`. **Breaking change이지만 더 직관적.**

**Option C: 하이브리드 (하위 호환 + 확장)**
```typescript
// 기존 방식 유지
const q1 = createContextQuery<{ count: number }>();
<Provider atoms={{ count: 0 }}>

// 새 방식 추가
const q2 = createContextQuery({
  count: 0,
  double: derived((get) => get('count') * 2),
});
<Provider>  // 기본값 사용
<Provider atoms={{ count: 10 }}>  // writable atoms만 오버라이드
```

### 3.2 결정: **Option B** (+ 마이그레이션 경로)

**이유**:
1. Jotai도 `atom(initialValue)`로 정의와 값을 한 곳에 둠. 익숙한 패턴
2. 타입 추론이 가장 자연스러움 — TAtoms를 인자에서 직접 추론
3. Provider에서 전체 초기값을 매번 전달하는 현재 패턴이 비효율적 (같은 값을 반복)
4. 파생 atom은 초기값이 없으므로 Provider atoms prop에서 제외해야 하는데, Option B가 이를 가장 깔끔하게 처리

**마이그레이션**: v0.6에서 Option B를 도입하고, 기존 `createContextQuery<TAtoms>()` + `atoms` prop은 deprecated 경고 후 v1.0에서 제거.

---

## 4. 타입 시스템 설계

### 4.1 Atom 정의 타입

```typescript
// ─── Marker Types ───

const DERIVED_MARKER = Symbol('derived');
const ATOM_CONFIG_MARKER = Symbol('atom_config');

interface DerivedAtomDef<TValue> {
  [DERIVED_MARKER]: true;
  read: (get: AtomGetter) => TValue;
}

interface AtomConfigDef<TValue> {
  [ATOM_CONFIG_MARKER]: true;
  initialValue: TValue;
  equalityFn?: (a: TValue, b: TValue) => boolean;
  onMount?: (setValue: (v: TValue | ((prev: TValue) => TValue)) => void) => (() => void) | void;
}

// ─── Helper Functions ───

function derived<TValue>(read: (get: AtomGetter) => TValue): DerivedAtomDef<TValue>;
function atom<TValue>(initialValue: TValue, options?: AtomOptions<TValue>): AtomConfigDef<TValue>;

// ─── Atom Definitions Record ───

type AtomDefs = Record<string,
  | unknown                      // plain value (sugar for atom(value))
  | DerivedAtomDef<unknown>      // derived((get) => ...)
  | AtomConfigDef<unknown>       // atom(value, { equalityFn, onMount })
>;
```

### 4.2 값 타입 추론

```typescript
// AtomDefs에서 실제 값 타입을 추출
type ResolveAtomValue<T> =
  T extends DerivedAtomDef<infer V> ? V :
  T extends AtomConfigDef<infer V> ? V :
  T;  // plain value

type ResolveAtomValues<TDefs extends AtomDefs> = {
  [K in keyof TDefs]: ResolveAtomValue<TDefs[K]>;
};

// Writable atom keys만 추출 (파생 atom 제외)
type WritableKeys<TDefs extends AtomDefs> = {
  [K in keyof TDefs]: TDefs[K] extends DerivedAtomDef<any> ? never : K;
}[keyof TDefs];

// Provider atoms prop 타입: writable atoms만, 모두 optional
type ProviderAtoms<TDefs extends AtomDefs> = Partial<{
  [K in WritableKeys<TDefs>]: ResolveAtomValue<TDefs[K]>;
}>;
```

### 4.3 Getter 타입

```typescript
type AtomGetter = <K extends keyof TDefs>(key: K) => ResolveAtomValue<TDefs[K]>;
```

**제약**: Getter는 store 스코프 내의 key만 접근 가능. 타입 레벨에서 자동 제한.

### 4.4 훅 반환 타입 변경

```typescript
// useContextAtom — 파생 atom이면 setter 없음
useContextAtom<K extends keyof TDefs>(key: K):
  TDefs[K] extends DerivedAtomDef<any>
    ? readonly [ResolveAtomValue<TDefs[K]>]  // read-only tuple
    : readonly [ResolveAtomValue<TDefs[K]>, Setter<TDefs[K]>];

// useContextSetAtom — 파생 atom key는 타입 에러
useContextSetAtom<K extends WritableKeys<TDefs>>(key: K): Setter<TDefs[K]>;

// usePatch — 파생 atom key는 자동 제외
usePatch(): (update: ProviderAtoms<TDefs>) => void;
```

---

## 5. Core 아키텍처 변경

### 5.1 새로운 클래스 구조

```
AtomStore<T>                          (기존 + 확장)
  - value: T
  - initialValue: T                   (NEW: 리셋용)
  - listeners: Set<AtomListener>
  - equalityFn: (a: T, b: T) => boolean  (NEW)
  + getValue(): T
  + setValue(newValue: T): void
  + reset(): void                     (NEW)
  + subscribe(listener): Subscription
  + getSubscriberCount(): number      (NEW: 디버그)

DerivedAtomStore<T> extends AtomStore<T>  (NEW)
  - readFn: (get: AtomGetter) => T
  - dependencies: Set<string>         (추적된 의존성 키)
  - stale: boolean                    (재계산 필요 여부)
  + getValue(): T                     (override: lazy 재계산)
  + setValue(): never                  (override: throw)
  + recompute(): void                 (의존성 변경 시 호출)
  + getDependencies(): Set<string>

ContextQueryStore<TDefs>              (확장)
  - atomDefs: TDefs                   (NEW: 원본 정의)
  - atoms: Map<string, AtomStore<any>>
  - derivedAtoms: Map<string, DerivedAtomStore<any>>  (NEW)
  - dependencyGraph: Map<string, Set<string>>         (NEW: key → dependents)
  + getAtomValue(key): ResolveAtomValue<TDefs[key]>
  + setAtomValue(key, value): void    (파생 atom이면 throw)
  + resetAtom(key): void              (NEW)
  + resetAll(): void                  (NEW)
  + getDebugInfo(): DebugInfo         (NEW)
```

### 5.2 의존성 추적 메커니즘

```
┌─────────────────────────────────────────────────────┐
│  ContextQueryStore                                  │
│                                                     │
│  atoms:     { firstName: AtomStore('John')       }  │
│             { lastName:  AtomStore('Doe')         }  │
│  derived:   { fullName:  DerivedAtomStore(...)    }  │
│                                                     │
│  depGraph:  { firstName: Set['fullName']          }  │
│             { lastName:  Set['fullName']           }  │
│                                                     │
│  ┌─ firstName.setValue('Jane') ──────────────────┐  │
│  │  1. AtomStore.setValue('Jane')                │  │
│  │  2. notifyListeners()                         │  │
│  │  3. ContextQueryStore가 depGraph 확인          │  │
│  │  4. fullName이 firstName에 의존 → stale=true   │  │
│  │  5. fullName.recompute()                      │  │
│  │  6. readFn 실행: get('firstName') + get('lastName')│
│  │  7. 결과 비교 (Object.is) → 변경됨 → notify   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 5.3 의존성 추적 구현 전략

**Phase 1: 정적 의존성 추적 (초기 실행 시 결정)**

```typescript
class DerivedAtomStore<T> extends AtomStore<T> {
  private readFn: (get: AtomGetter) => T;
  private dependencies: Set<string> = new Set();
  private stale: boolean = true;

  constructor(readFn: (get: AtomGetter) => T, getAtomValue: (key: string) => any) {
    // 초기 계산으로 의존성 수집
    const trackedGet = (key: string) => {
      this.dependencies.add(key);
      return getAtomValue(key);
    };
    const initialValue = readFn(trackedGet);
    super(initialValue);
    this.readFn = readFn;
  }

  recompute(getAtomValue: (key: string) => any): void {
    // 매 재계산 시 의존성 재수집 (동적 의존성 지원)
    const newDeps = new Set<string>();
    const trackedGet = (key: string) => {
      newDeps.add(key);
      return getAtomValue(key);
    };

    const newValue = this.readFn(trackedGet);

    // 의존성이 변경되었으면 depGraph 업데이트
    if (!setsEqual(this.dependencies, newDeps)) {
      this.dependencies = newDeps;
      // → ContextQueryStore에 depGraph 업데이트 요청
    }

    // setValue는 equalityFn으로 비교 후 리스너 호출
    this.forceSetValue(newValue);
  }
}
```

**왜 동적 의존성 추적이 필요한가**:
```typescript
derived((get) => {
  const showDetails = get('showDetails');
  if (showDetails) {
    return get('detailedInfo');  // 조건부 의존성
  }
  return get('summary');
});
```

### 5.4 순환 의존성 감지

```typescript
private detectCycle(key: string, visiting: Set<string> = new Set()): void {
  if (visiting.has(key)) {
    throw new Error(
      `Circular dependency detected: ${[...visiting, key].join(' → ')}`
    );
  }
  visiting.add(key);
  const deps = this.dependencyGraph.get(key);
  if (deps) {
    for (const dep of deps) {
      if (this.derivedAtoms.has(dep)) {
        this.detectCycle(dep, new Set(visiting));
      }
    }
  }
}
```

### 5.5 다이아몬드 의존성 처리

```
    A (writable)
   / \
  B   C  (both derived from A)
   \ /
    D    (derived from B + C)
```

A 변경 시 D가 2번 재계산되는 것을 방지:

**전략: Topological sort + batch**

```typescript
private propagateDependencyChange(changedKey: string): void {
  // 1. 변경된 key에 영향받는 모든 derived atoms 수집
  const affected = this.collectAffectedDerived(changedKey);

  // 2. 위상 정렬 (의존성 순서대로)
  const sorted = this.topologicalSort(affected);

  // 3. 순서대로 한 번씩만 재계산
  for (const derivedKey of sorted) {
    this.derivedAtoms.get(derivedKey)!.recompute(
      (k) => this.getAtomValue(k)
    );
  }
}
```

### 5.6 글리치 프리 보장

"글리치"란 중간 상태가 일시적으로 노출되는 현상.

```typescript
// 예: A=1, B=derived(A*2)=2, C=derived(A+B)=3
// A를 2로 변경하면:
// 글리치 있는 경우: C가 A=2, B=2(아직 업데이트 전)로 계산 → C=4 (잘못됨)
// 글리치 없는 경우: B 먼저 재계산(=4), 그 다음 C 재계산 → C=6 (정확)
```

위상 정렬 기반 재계산이 글리치를 방지:
1. B는 A에만 의존 → 먼저 재계산
2. C는 A, B에 의존 → B 이후 재계산
3. 모든 값이 최신 상태에서 C 계산 → 글리치 없음

---

## 6. React 레이어 변경

### 6.1 createContextQuery 시그니처 변경

```typescript
// Before (v0.5.1)
function createContextQuery<TAtoms extends Record<string, any>>(): {
  ContextQueryProvider: FC<PropsWithChildren<{ atoms: TAtoms }>>;
  useContextAtom: <K extends keyof TAtoms>(key: K) => [TAtoms[K], Setter<K>];
  // ...
};

// After (v0.6+)
function createContextQuery<TDefs extends AtomDefs>(defs: TDefs): {
  ContextQueryProvider: FC<PropsWithChildren<{ atoms?: ProviderAtoms<TDefs> }>>;
  useContextAtom: <K extends keyof TDefs>(key: K) => /* 파생 여부에 따라 다른 반환 */;
  useContextAtomValue: <K extends keyof TDefs>(key: K) => ResolveAtomValue<TDefs[K]>;
  useContextSetAtom: <K extends WritableKeys<TDefs>>(key: K) => Setter<TDefs[K]>;
  useContextAtomSelector: <K extends keyof TDefs, R>(
    key: K,
    selector: (value: ResolveAtomValue<TDefs[K]>) => R,
    equalityFn?: (a: R, b: R) => boolean
  ) => R;
  useResetAtom: <K extends WritableKeys<TDefs>>(key: K) => () => void;
  // ... 기존 훅들
};
```

### 6.2 Provider 변경

```typescript
// Before: atoms가 필수, 전체 값 전달
<Provider atoms={{ firstName: 'John', lastName: 'Doe' }}>

// After: atoms가 선택적, writable atoms만 오버라이드
<Provider>                                    // 기본값 사용
<Provider atoms={{ firstName: 'Jane' }}>      // 부분 오버라이드
```

Provider 내부에서:
```typescript
const ContextQueryProvider = ({ children, atoms }: Props) => {
  const store = useMemo(
    () => new ContextQueryStore(defs, atoms),  // defs는 클로저에서 캡처
    [] // 마운트 시 한 번만 생성
  );

  // atoms 오버라이드가 변경되면 store에 patch
  useEffect(() => {
    if (atoms) {
      store.patch(atoms);
    }
  }, [atoms, store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};
```

### 6.3 useContextAtomSelector 구현 개요

```typescript
function useContextAtomSelector<K extends keyof TDefs, R>(
  key: K,
  selector: (value: ResolveAtomValue<TDefs[K]>) => R,
  equalityFn: (a: R, b: R) => boolean = Object.is
): R {
  const store = useStoreContext();
  const prevRef = useRef<R>();

  const subscribe = useCallback(
    (callback: () => void) => {
      const sub = store.subscribeToAtom(key, () => {
        const newSelected = selector(store.getAtomValue(key));
        if (!equalityFn(prevRef.current!, newSelected)) {
          prevRef.current = newSelected;
          callback();
        }
      });
      return () => sub.unsubscribe();
    },
    [store, key, selector, equalityFn]
  );

  const getSnapshot = useCallback(() => {
    const selected = selector(store.getAtomValue(key));
    prevRef.current = selected;
    return selected;
  }, [store, key, selector]);

  useDebugValue(prevRef.current);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

---

## 7. 파일 구조 변경 계획

### 7.1 Core 패키지

```
packages/core/src/
├── index.ts                      (exports 추가)
├── types.ts                      (타입 확장)
├── atomStore.ts                  (equalityFn, initialValue, reset 추가)
├── derivedAtomStore.ts           (NEW)
├── contextQueryStore.ts          (파생 atom 해석, depGraph 추가)
├── helpers/
│   ├── derived.ts                (NEW: derived() 헬퍼)
│   ├── atom.ts                   (NEW: atom() 헬퍼)
│   ├── shallowEqual.ts           (NEW)
│   └── reset.ts                  (NEW: RESET 심볼)
└── __tests__/
    ├── atomStore.test.ts         (NEW)
    ├── derivedAtomStore.test.ts  (NEW)
    ├── contextQueryStore.test.ts (NEW)
    ├── depGraph.test.ts          (NEW)
    └── types.test.ts             (NEW)
```

### 7.2 React 패키지

```
packages/react/src/
├── index.ts                      (createContextQuery 시그니처 변경)
├── createProvider.tsx            (atoms prop 선택적으로 변경)
├── hooks/
│   ├── index.ts
│   ├── useContextAtom.ts         (파생 atom 분기)
│   ├── useContextAtomValue.ts    (useDebugValue 추가)
│   ├── useContextSetAtom.ts      (WritableKeys 타입 제한)
│   ├── useContextAtomSelector.ts (NEW)
│   ├── useResetAtom.ts           (NEW)
│   ├── useStore.ts
│   ├── useSnapshot.ts            (파생 atom 포함)
│   ├── useSnapshotValue.ts
│   └── usePatch.ts               (WritableKeys만 + 함수 업데이터)
├── internals/
│   ├── createStoreContext.ts
│   ├── useStoreContext.ts
│   └── useAtomSubscription.ts
└── __tests__/
    ├── atomHooks.test.tsx        (NEW)
    ├── derivedHooks.test.tsx     (NEW)
    ├── selectorHooks.test.tsx    (NEW)
    ├── snapshotHooks.test.tsx    (NEW)
    ├── provider.test.tsx         (NEW)
    └── types.test.ts             (NEW)
```

---

## 8. 마이그레이션 전략

### 8.1 v0.5.1 → v0.6 Breaking Changes

| 변경 | Before | After |
|------|--------|-------|
| `createContextQuery` | `createContextQuery<TAtoms>()` (타입 파라미터) | `createContextQuery(defs)` (인자에서 추론) |
| Provider `atoms` prop | 필수, 전체 값 | 선택적, 부분 오버라이드 |

### 8.2 마이그레이션 코드

```typescript
// Before (v0.5.1)
const { ContextQueryProvider, useContextAtom } = createContextQuery<{
  count: number;
  name: string;
}>();

function App() {
  return (
    <ContextQueryProvider atoms={{ count: 0, name: 'hello' }}>
      <Child />
    </ContextQueryProvider>
  );
}

// After (v0.6)
const { ContextQueryProvider, useContextAtom } = createContextQuery({
  count: 0,
  name: 'hello',
});

function App() {
  return (
    <ContextQueryProvider>  {/* 기본값 사용 */}
      <Child />
    </ContextQueryProvider>
  );
}
```

### 8.3 점진적 마이그레이션 지원

v0.6에서 기존 패턴을 경고와 함께 지원하는 것은 **하지 않음**. 이유:
1. 타입 시스템이 근본적으로 다름 (타입 파라미터 vs 인자 추론)
2. 두 패턴을 동시 지원하면 타입 복잡도 폭증
3. v0.5 → v0.6 마이그레이션은 기계적 치환 (단순)

---

## 9. 성능 고려사항

### 9.1 메모리

- 의존성 그래프: `Map<string, Set<string>>` — atom 수에 비례, O(N)
- DerivedAtomStore: AtomStore + readFn + dependencies Set — 오버헤드 미미
- 위상 정렬: 재계산 시마다 임시 배열 생성 — 파생 atom 수에 비례

### 9.2 계산

- 단일 writable atom 변경: O(D) where D = 직접/간접 의존하는 파생 atom 수
- 위상 정렬: O(V + E) where V = 영향받는 파생 atom, E = 의존성 간선
- 일반적인 사용 (10~20 atoms, 5~10 derived): < 0.1ms

### 9.3 리렌더링 최적화

- 파생 atom 재계산 결과가 이전과 동일하면 리스너 미호출 → 리렌더링 없음
- 셀렉터는 atom 값 변경 시에만 selector 함수 실행, 결과 비교 후 리렌더링 결정
- `useContextSetAtom` / `usePatch` / `useResetAtom`은 값 구독 없음 → 상태 변경으로 리렌더링 안 됨

---

## 10. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| 파생 atom readFn에서 side effect | 예측 불가한 동작 | 문서에서 순수 함수만 사용하도록 강조. DEV 모드에서 경고 |
| 큰 의존성 그래프에서 성능 저하 | 재계산 지연 | 위상 정렬 캐싱, lazy 재계산 |
| 동적 의존성으로 depGraph 불일치 | 구독 누락 | 매 재계산 시 의존성 재수집 |
| Breaking change로 기존 사용자 이탈 | 채택 감소 | 명확한 마이그레이션 가이드, 변경이 기계적으로 간단함을 강조 |
| equalityFn 잘못 사용 | 리렌더링 누락/과다 | shallowEqual 기본 제공, 문서에서 패턴 안내 |
