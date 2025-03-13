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

다른 상태 관리 도구와 함께 사용할 수 있습니다:
- **전역 상태 관리**는 진정한 앱 전체 상태에 사용하세요
- **React Query**는 서버 상태 및 데이터 가져오기에 사용하세요
- **Context API**는 테마/로케일 설정과 같이 전체 트리에 영향을 미쳐야 하는 설정에 사용하세요
- **Context Query**는 최적화된 렌더링으로 컴포넌트 범위의 공유 상태에 사용하세요

## 특징

- 🚀 **세밀한 리렌더링**: 구독한 특정 상태가 변경될 때만 컴포넌트가 리렌더링됩니다
- 🔄 **컴포넌트 라이프사이클 통합**: 프로바이더 컴포넌트가 언마운트되면 상태가 자동으로 정리됩니다
- 🔌 **간단한 API**: React의 `useState`와 유사한 친숙한 훅 기반 API
- 🧩 **타입스크립트 지원**: 타입스크립트로 완전한 타입 안전성 제공
- 📦 **경량**: 의존성 없는 최소한의 번들 크기
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

export const {
  Provider: CounterQueryProvider,
  useContextQuery: useCounterQuery,
} = createContextQuery({
  initialState: {
    count1: 0,
    count2: 0,
  },
});
```

### 2. Provider로 컴포넌트 트리 감싸기

```tsx
// ParentComponent.tsx
import { CounterQueryProvider } from "./CounterContextQueryProvider";

function ParentComponent() {
  return (
    <CounterQueryProvider>
      <ChildComponentA />
      <ChildComponentB />
      <ChildComponentC />
    </CounterQueryProvider>
  );
}
```

### 3. 컴포넌트에서 상태 사용하기

```tsx
// ChildComponentA.tsx
import { useCounterQuery } from "./CounterContextQueryProvider";

function ChildComponentA() {
  const [count, setCount] = useCounterQuery("count1");
  
  const increment = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <h2>컴포넌트 A의 카운터: {count}</h2>
      <button onClick={increment}>+</button>
    </div>
  );
}

// ChildComponentB.tsx
import { useCounterQuery } from "./CounterContextQueryProvider";

function ChildComponentB() {
  const [count, setCount] = useCounterQuery("count1");
  
  // 이 컴포넌트는 count1이 변경될 때 리렌더링됩니다
  // 하지만 ChildComponentC는 count1을 사용하지 않기 때문에 리렌더링되지 않습니다
  
  return (
    <div>
      <h2>컴포넌트 B의 카운터: {count}</h2>
    </div>
  );
}
```

## 성능 이점

일반 Context API와 달리, Context Query는 불필요한 리렌더링을 방지합니다:

- 구독한 상태 키가 변경될 때만 컴포넌트가 리렌더링됩니다
- 특정 상태 키를 사용하지 않는 형제 컴포넌트는 리렌더링되지 않습니다
- 복잡한 컴포넌트 트리에서 성능이 더 잘 유지됩니다

## 고급 사용법

### 함수 업데이트

React의 `useState`와 유사하게 상태 설정자에 함수를 전달할 수 있습니다:

```tsx
const [count, setCount] = useCounterQuery("count1");

// 이전 상태를 기반으로 업데이트
const increment = () => {
  setCount(prevCount => prevCount + 1);
};
```

### 다중 Provider

다른 컴포넌트 서브트리를 위해 여러 Provider를 사용할 수 있습니다:

```tsx
function App() {
  return (
    <div>
      <FeatureAProvider>
        <FeatureAComponents />
      </FeatureAProvider>
      
      <FeatureBProvider>
        <FeatureBComponents />
      </FeatureBProvider>
    </div>
  );
}
```

## 프로젝트 구조

이 프로젝트는 여러 패키지로 구성되어 있습니다:

- `@context-query/core`: 핵심 기능 및 상태 관리
- `@context-query/react`: React 바인딩 및 훅
- `playground`: 라이브러리를 보여주는 데모 애플리케이션

## 개발

### 필수 조건

- Node.js >= 18
- pnpm >= 9.0.0

### 설정

```bash
# 저장소 복제
git clone https://github.com/yourusername/context-query.git
cd context-query

# 의존성 설치
pnpm install

# 모든 패키지 빌드
pnpm build

# 플레이그라운드 데모 실행
pnpm dev
```

## 라이선스

MIT
