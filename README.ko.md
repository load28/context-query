# Context Query

[English Documentation](./README.md)

리액트 애플리케이션을 위한 가볍고 효율적인 상태 관리 라이브러리로, 컴포넌트 트리 범위의 상태를 최적화된 렌더링과 함께 제공합니다.

## Context Query를 개발한 이유

리액트는 상태 관리를 위한 여러 방법을 제공하지만, 각각은 특정 시나리오에서 한계가 있습니다:

1. **전역 상태(Redux, Zustand)**는 애플리케이션 전체 데이터 공유를 목적으로 하기 때문에 특정 컴포넌트 트리 내에서 상태를 공유하기에 적합하지 않습니다. 또한 컴포넌트 라이프사이클에 따라 상태를 관리하는 것은 매우 어렵습니다.

2. **React Context API**는 컴포넌트 트리 내에서 스코프를 가지는 상태를 생성하지만, 컨텍스트의 어떤 부분이 변경되더라도 모든 하위 컴포넌트에 불필요한 리렌더링을 발생시킵니다.

3. **React Query**는 서버 상태 관리에 탁월하지만 전역적인 키 기반 접근 방식을 사용하여 컴포넌트 범위의 클라이언트 상태에는 이상적이지 않습니다.

Context Query는 이러한 접근 방식의 장점을 결합합니다:

- **컴포넌트 트리 스코핑**: Context API처럼 상태가 컴포넌트 라이프사이클과 연결됩니다
- **구독 모델**: React Query처럼 특정 상태 키를 구독하는 컴포넌트만 리렌더링됩니다
- **간단한 API**: React의 `useState`와 유사한 친숙한 훅 기반 패턴을 제공합니다

## Context Query 사용 시기

Context Query는 다음과 같은 경우에 이상적입니다:

- **컴포넌트 그룹화**: 프롭스 드릴링 없이 여러 컴포넌트 간에 상태를 공유해야 할 때
- **컴포넌트 범위 상태**: 상태가 특정 컴포넌트 트리의 라이프사이클과 연결되어야 할 때
- **성능이 중요한 UI**: 복잡한 컴포넌트 계층에서 리렌더링을 최소화해야 할 때

### 상태 관리 도구의 올바른 선택

Context Query는 모든 상황에 적합한 만능 솔루션이 아닙니다. 최적의 성능과 아키텍처를 위해 용도에 맞는 상태 관리 도구를 선택하세요:

- **전역 상태 관리(Redux, Zustand)**: 앱 전체에 걸쳐 유지되어야 하는 진정한 애플리케이션 전체 상태에 사용하세요
- **React Query**: 주 목적인 서버 상태 관리 및 데이터 페칭에 사용하세요
- **Context API**: 테마 변경, 로케일 설정 또는 모든 하위 컴포넌트의 리렌더링을 의도적으로 원하는 경우에 사용하세요
- **Context Query**: 프롭스 드릴링 없이 컴포넌트 트리 범위의 상태 공유가 필요하면서 불필요한 형제 컴포넌트 리렌더링은 방지하고 싶을 때 사용하세요

## 특징

- 🚀 **세밀한 리렌더링**: 구독한 특정 상태가 변경될 때만 컴포넌트가 리렌더링됩니다
- ⚡ **시그널 기반 반응형 엔진**: [TC39 Signals](https://github.com/tc39/proposal-signals) 및 [Alien Signals](https://github.com/nicepkg/alien-signals)에서 영감받은 Push-Pull 하이브리드 반응성
- 🔄 **컴포넌트 라이프사이클 통합**: 프로바이더 컴포넌트가 언마운트되면 상태가 자동으로 정리됩니다
- 🧮 **파생 상태**: Diamond Problem 해결 및 지연 평가를 지원하는 자동 계산 값
- 🔌 **간단한 API**: React의 `useState`와 유사한 친숙한 훅 기반 API
- 🧩 **타입스크립트 지원**: 타입스크립트로 완전한 타입 안전성 제공
- 📦 **경량**: ~2.8KB gzipped (core), 의존성 없음
- 🔧 **호환성**: 기존 상태 관리 솔루션과 함께 사용 가능

## 설치

```bash
# npm 사용
npm install @context-query/react

# yarn 사용
yarn add @context-query/react

# pnpm 사용
pnpm add @context-query/react
```

## 사용법

### 1. Context Query Provider 생성

```tsx
// CounterContextQueryProvider.tsx
import { createContextQuery } from "@context-query/react";

type CounterAtoms = {
  primaryCounter: {
    name: string;
    value: number;
    description: string;
  };
  secondaryCounter: {
    name: string;
    value: number;
    description: string;
  };
};

export const {
  ContextQueryProvider: CounterQueryProvider,
  useContextAtom: useCounterAtom,
  useContextAtomValue: useCounterAtomValue,
  useContextSetAtom: useCounterSetAtom,
} = createContextQuery<CounterAtoms>();
```

### 2. Provider로 컴포넌트 트리 감싸기 및 Atom 초기화

```tsx
// CounterApp.tsx
import { CounterQueryProvider } from "./CounterContextQueryProvider";

function CounterApp() {
  return (
    <CounterQueryProvider
      atoms={{
        primaryCounter: {
          name: "메인 카운터",
          value: 0,
          description: "다른 카운터들을 제어하는 메인 카운터",
        },
        secondaryCounter: {
          name: "보조 카운터",
          value: 0,
          description: "메인 카운터와 연동되는 보조 카운터",
        },
      }}
    >
      <CounterContent />
    </CounterQueryProvider>
  );
}

function CounterContent() {
  return (
    <div className="counter-app">
      <PrimaryCounterComponent />
      <SecondaryCounterComponent />
    </div>
  );
}
```

### 3. 컴포넌트에서 Atom 사용하기

```tsx
// PrimaryCounterComponent.tsx
import { useCounterAtom, useCounterSetAtom } from "./CounterContextQueryProvider";

function PrimaryCounterComponent() {
  // primary counter atom만 구독
  const [primaryCounter, setPrimaryCounter] = useCounterAtom("primaryCounter");
  const setSecondaryCounter = useCounterSetAtom("secondaryCounter");

  const increment = () => {
    setPrimaryCounter((prev) => ({ ...prev, value: prev.value + 1 }));
    // 보조 카운터도 함께 업데이트
    setSecondaryCounter((prev) => ({ ...prev, value: prev.value + 1 }));
  };

  const decrement = () => {
    setPrimaryCounter((prev) => ({ ...prev, value: prev.value - 1 }));
  };

  const reset = () => {
    setPrimaryCounter((prev) => ({ ...prev, value: 0 }));
  };

  return (
    <div className="counter">
      <h2>{primaryCounter.name}</h2>
      <p>{primaryCounter.description}</p>
      <div className="counter-controls">
        <span>{primaryCounter.value}</span>
        <button onClick={decrement}>-</button>
        <button onClick={increment}>+</button>
        <button onClick={reset}>초기화</button>
      </div>
    </div>
  );
}

// SecondaryCounterComponent.tsx
import { useCounterAtomValue } from "./CounterContextQueryProvider";

function SecondaryCounterComponent() {
  // secondary counter atom에 대한 읽기 전용 액세스
  const secondaryCounter = useCounterAtomValue("secondaryCounter");

  return (
    <div className="counter secondary">
      <h3>{secondaryCounter.name}</h3>
      <p>{secondaryCounter.description}</p>
      <div className="counter-display">
        <span>{secondaryCounter.value}</span>
      </div>
    </div>
  );
}

// BatchUpdateComponent.tsx
import { useCounterSetAtom } from "./CounterContextQueryProvider";

function BatchUpdateComponent() {
  const setPrimaryCounter = useCounterSetAtom("primaryCounter");
  const setSecondaryCounter = useCounterSetAtom("secondaryCounter");

  const resetAll = () => {
    setPrimaryCounter((prev) => ({ ...prev, value: 0 }));
    setSecondaryCounter((prev) => ({ ...prev, value: 0 }));
  };

  const incrementAll = () => {
    setPrimaryCounter((prev) => ({ ...prev, value: prev.value + 1 }));
    setSecondaryCounter((prev) => ({ ...prev, value: prev.value + 1 }));
  };

  return (
    <div className="batch-controls">
      <button onClick={resetAll}>모든 카운터 초기화</button>
      <button onClick={incrementAll}>모든 카운터 증가</button>
    </div>
  );
}
```

이 예시는 다음을 보여줍니다:

1. **Atom 기반 아키텍처**: 각 상태 조각이 별도의 atom으로 관리됨
2. **세밀한 구독**: 컴포넌트는 필요한 atom만 구독하여 리렌더링을 최적화
3. **읽기-쓰기 분리**: 읽기-쓰기 액세스는 `useContextAtom`, 읽기 전용은 `useContextAtomValue`, 쓰기 전용은 `useContextSetAtom` 사용
4. **Atom 간 업데이트**: 컴포넌트는 여러 atom을 독립적으로 업데이트 가능

## 아키텍처

Context Query는 **시그널 기반 반응형 엔진**을 통해 효율적인 상태 전파를 제공합니다:

```
┌─────────────────────────────────────────────────┐
│  React Hooks 계층 (@context-query/react)         │
│  useContextAtom, useSnapshot, usePatch, ...      │
├─────────────────────────────────────────────────┤
│  Store 계층 (@context-query/core)                │
│  ContextQueryStore, AtomStore, DerivedAtomStore   │
├─────────────────────────────────────────────────┤
│  Signal Engine (내부)                            │
│  signal → computed → effect (push-pull hybrid)   │
│  Diamond problem 해결, 배치 업데이트              │
└─────────────────────────────────────────────────┘
```

각 `ContextQueryProvider`는 독립된 반응형 시스템을 생성하여, 여러 프로바이더가 서로 간섭하지 않습니다.

## 파생 상태 (Derived State)

`derived()`를 사용하여 의존성이 변경될 때 자동으로 업데이트되는 계산된 atom을 만들 수 있습니다:

```tsx
import { createContextQuery } from "@context-query/react";
import { derived } from "@context-query/core";

type CartAtoms = {
  items: Array<{ name: string; price: number; qty: number }>;
  discount: number;
  totalPrice: number;
  finalPrice: number;
};

const { ContextQueryProvider, useContextAtomValue } = createContextQuery<CartAtoms>();

function CartApp() {
  return (
    <ContextQueryProvider
      atoms={{
        items: [
          { name: "노트북", price: 1200000, qty: 1 },
          { name: "마우스", price: 35000, qty: 2 },
        ],
        discount: 0.1,
        totalPrice: derived((get) => {
          const items = get("items");
          return items.reduce((sum, item) => sum + item.price * item.qty, 0);
        }),
        finalPrice: derived((get) => {
          return Math.round(get("totalPrice") * (1 - get("discount")));
        }),
      }}
    >
      <CartSummary />
    </ContextQueryProvider>
  );
}

function CartSummary() {
  const total = useContextAtomValue("totalPrice");    // 자동 계산
  const final = useContextAtomValue("finalPrice");    // 자동 계산
  return <div>합계: {total}원 → 최종가: {final}원</div>;
}
```

파생 atom은 **지연 평가**(읽을 때만 계산)되며, **효율적**(다이아몬드 의존성이 한 번의 패스로 해결)입니다.

## Atom 설정

`atom()`을 사용하여 커스텀 동등성 비교를 설정하면 불필요한 리렌더링을 방지할 수 있습니다:

```tsx
import { atom } from "@context-query/core";
import { shallowEqual } from "@context-query/core";

<ContextQueryProvider
  atoms={{
    // shallowEqual을 사용하면 { name: "John", age: 30 }을 다시 설정해도 리렌더링되지 않습니다
    user: atom({ name: "John", age: 30 }, { equalityFn: shallowEqual }),
    label: derived((get) => `안녕하세요, ${get("user").name}님`),
  }}
>
  {children}
</ContextQueryProvider>
```

## 고급 사용법

### 사용 가능한 훅들

`createContextQuery` 함수는 Provider와 7개의 훅을 반환합니다:

```tsx
const {
  ContextQueryProvider,
  useContextAtom,        // atom에 대한 읽기-쓰기 액세스
  useContextAtomValue,   // atom에 대한 읽기 전용 액세스
  useContextSetAtom,     // atom에 대한 쓰기 전용 액세스
  useStore,              // 스토어 직접 액세스
  useSnapshot,           // 모든 atom에 대한 읽기-쓰기 액세스
  useSnapshotValue,      // 모든 atom에 대한 읽기 전용 액세스
  usePatch,              // 모든 atom에 대한 쓰기 전용 액세스
} = createContextQuery<YourAtomTypes>();
```

### 훅 사용 패턴

#### `useContextAtom` - 읽기 & 쓰기
```tsx
function CounterComponent() {
  const [counter, setCounter] = useContextAtom("counter");
  
  const increment = () => {
    setCounter((prev) => ({ ...prev, value: prev.value + 1 }));
  };
  
  return (
    <div>
      <span>{counter.value}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

#### `useContextAtomValue` - 읽기 전용
```tsx
function DisplayComponent() {
  const counter = useContextAtomValue("counter");
  
  return <div>현재 값: {counter.value}</div>;
}
```

#### `useContextSetAtom` - 쓰기 전용
```tsx
function ControlComponent() {
  const setCounter = useContextSetAtom("counter");

  const reset = () => {
    setCounter((prev) => ({ ...prev, value: 0 }));
  };

  return <button onClick={reset}>초기화</button>;
}
```

#### `useStore` - 스토어 직접 액세스
```tsx
function AdvancedComponent() {
  const store = useStore();

  // 고급 사용 사례를 위한 스토어 API 직접 액세스
  const value = store.getAtomValue("counter");
  store.setAtomValue("counter", newValue);
}
```

#### `useSnapshot` - 모든 Atom 읽기 & 쓰기
```tsx
function BatchComponent() {
  const [snapshot, patch] = useSnapshot();

  const resetAll = () => {
    patch({
      primaryCounter: { ...snapshot.primaryCounter, value: 0 },
      secondaryCounter: { ...snapshot.secondaryCounter, value: 0 },
    });
  };

  return <button onClick={resetAll}>모두 초기화</button>;
}
```

#### `useSnapshotValue` - 모든 Atom 읽기 전용
```tsx
function DisplayAll() {
  const snapshot = useSnapshotValue();

  return <pre>{JSON.stringify(snapshot, null, 2)}</pre>;
}
```

#### `usePatch` - 모든 Atom 쓰기 전용
```tsx
function BatchControls() {
  const patch = usePatch();

  // 이 컴포넌트는 atom이 변경되어도 리렌더링되지 않습니다
  const resetAll = () => {
    patch({
      primaryCounter: { value: 0, name: "메인", description: "..." },
      secondaryCounter: { value: 0, name: "보조", description: "..." },
    });
  };

  return <button onClick={resetAll}>모두 초기화</button>;
}
```

### 함수형 업데이트

React의 `useState`와 유사하게, atom 설정자에 함수를 전달할 수 있습니다:

```tsx
const [counter, setCounter] = useContextAtom("counter");

// 이전 상태를 기반으로 업데이트
const increment = () => {
  setCounter((prev) => ({ ...prev, value: prev.value + 1 }));
};
```

### 다중 프로바이더

동일한 프로바이더를 여러 번 사용하면 각각 독립적인 상태를 가집니다:

```tsx
function App() {
  return (
    <div>
      {/* 첫 번째 카운터 인스턴스 */}
      <CounterQueryProvider atoms={{ counter: { value: 0, name: "첫 번째 카운터" } }}>
        <CounterSection title="첫 번째 구역" />
      </CounterQueryProvider>

      {/* 두 번째 카운터 인스턴스 (완전히 독립적) */}
      <CounterQueryProvider atoms={{ counter: { value: 10, name: "두 번째 카운터" } }}>
        <CounterSection title="두 번째 구역" />
      </CounterQueryProvider>
    </div>
  );
}

function CounterSection({ title }) {
  const [counter, setCounter] = useCounterAtom("counter");
  
  return (
    <div>
      <h2>{title}</h2>
      <p>{counter.name}: {counter.value}</p>
      <button onClick={() => setCounter(prev => ({ ...prev, value: prev.value + 1 }))}>
        증가
      </button>
    </div>
  );
}
```

각 프로바이더는 자체 상태를 가지므로 한 쪽의 카운터를 변경해도 다른 쪽에 영향을 주지 않습니다.

## 라이브 플레이그라운드

인터랙티브 플레이그라운드를 직접 체험해보세요: [https://load28.github.io/context-query/](https://load28.github.io/context-query/)

## 프로젝트 구조

이 프로젝트는 여러 패키지로 구성되어 있습니다:

- `@context-query/core`: 시그널 엔진, 스토어 계층, 상태 관리
- `@context-query/react`: React 바인딩 및 훅
- `playground`: 인터랙티브 데모 애플리케이션 ([라이브](https://load28.github.io/context-query/))

## 개발

### 필수 조건

- Node.js >= 18
- pnpm >= 9.0.0

### 설정

```bash
# 저장소 복제
git clone https://github.com/load28/context-query.git
cd context-query

# 의존성 설치
pnpm install

# 모든 패키지 빌드
pnpm build

# 플레이그라운드 데모 실행
pnpm playground
```

## 릴리즈 워크플로우

```mermaid
sequenceDiagram
    participant M as 메인 브랜치
    participant R as 릴리즈 브랜치
    participant W as 작업 브랜치

    M->>R: 릴리즈 브랜치 생성 (0.3.0)
    R->>W: 작업 브랜치 생성 (WIP/0.3.0/feat/update)
    Note over W: 기능 개발 및 버그 수정
    W->>R: 릴리즈 브랜치로 리베이스
    Note over R: 패키지 버전 변경 (0.3.0-dev.1)
    Note over R: 테스트 및 수정
    Note over R: 패키지 버전 변경 (0.3.0-dev.2)
    Note over R: 테스트 및 수정
    Note over R: 패키지 버전 확정 (0.3.0)
    R->>M: 메인 브랜치로 리베이스
    M->>M: 버전 태그 추가 (v0.3.0)
```

## 라이선스

MIT
