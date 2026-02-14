---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'TC39 Signals 표준과 React 시그널 아키텍처 전환'
research_goals: 'TC39 Signals 표준 분석, Preact/Solid.js/Angular 시그널 비교, context-query 라이브러리의 시그널 전환 설계'
user_name: 'load28'
date: '2026-02-14'
web_research_enabled: true
source_verification: true
---

# 시그널 아키텍처로의 전환: context-query를 위한 TC39 Signals 표준 기반 기술 리서치

**Date:** 2026-02-14
**Author:** load28
**Research Type:** Technical

---

## Executive Summary

context-query 라이브러리의 핵심 반응형 엔진을 현재의 아톰(Atom) 기반 아키텍처에서 **시그널(Signal) 기반 아키텍처**로 전환하기 위한 포괄적 기술 리서치이다. TC39 Signals 표준 제안(Stage 0~1), Preact Signals, Solid.js, Angular Signals, 그리고 벤치마크 1위인 Alien Signals를 분석하여 최적의 구현 전략을 도출했다.

**핵심 기술 결론:** Alien Signals의 Push-Pull 하이브리드 알고리즘 + 이중 연결 리스트 구조를 자체 구현하되, TC39 표준 API 인터페이스를 내부적으로 따르고, 기존 외부 API(훅 인터페이스)는 100% 유지하는 **비파괴적 내부 교체** 전략이 최적이다. 이를 통해 기존 대비 ≥2x 성능 향상을 달성하면서 사용자 코드 변경 없이 마이그레이션할 수 있다.

**핵심 기술 발견:**

- TC39 Signals 표준은 `Signal.State`/`Signal.Computed`/`Signal.subtle.Watcher`로 구성되며, Effect는 미포함 (프레임워크가 직접 구현)
- 벤치마크에서 **Alien Signals가 전반적 최고 성능** (Vue 3.6에 채택, js-reactivity-benchmark 검증)
- 성능 차이의 3대 핵심 요인: 이중 연결 리스트(vs Set/Map), Push-Pull 하이브리드(vs 순수 Push/Pull), 비재귀 루프(vs 재귀)
- React 통합은 `useSyncExternalStore` 기반이 가장 안정적 — Preact 스타일 내부 해킹은 React 19/Compiler 호환 문제 다수
- Zero Dependencies 원칙 유지 가능 — 알고리즘 자체 구현

**기술 권장사항:**

1. Alien Signals 알고리즘 참조 자체 구현 (외부 의존성 0)
2. 3계층 분리 아키텍처 (Reactive Engine → Store API → React Adapter)
3. 기존 외부 API 변경 0개 — 비파괴적 내부 교체
4. Vitest bench 기반 정량적 성능 검증 (before/after 비교)
5. 4주 구현 로드맵 (Engine → Store → 검증 → 문서)

---

## Table of Contents

1. [Technical Research Scope Confirmation](#technical-research-scope-confirmation)
2. [Technology Stack Analysis](#technology-stack-analysis)
   - TC39 Signals 표준 제안 — 핵심 API 사양
   - 프레임워크별 시그널 구현 비교 (Preact, Solid.js, Angular)
   - 프레임워크 간 시그널 비교 매트릭스
   - React 생태계와 시그널 통합 패턴
   - 기술 채택 동향
   - 성능 벤치마크 분석
3. [Integration Patterns Analysis](#integration-patterns-analysis)
   - 시그널 → React 통합 패턴 (3가지 비교)
   - context-query의 API 매핑 전략
   - Signal.subtle.Watcher 기반 Effect 구현 전략
   - Alien Signals의 createReactiveSystem 통합 전략
4. [Architectural Patterns and Design](#architectural-patterns-and-design)
   - 시스템 아키텍처: 3계층 분리 설계
   - Layer 1: Reactive Engine (Push-Pull + 이중 연결 리스트)
   - Layer 2: Store API (TC39 호환 + 기존 API)
   - Layer 3: React Adapter (useSyncExternalStore)
   - 스케일링 및 성능 아키텍처 패턴
5. [Implementation Approaches and Technology Adoption](#implementation-approaches-and-technology-adoption)
   - 구현 전략: Alien Signals 알고리즘 자체 구현
   - 마이그레이션 전략: 비파괴적 내부 교체
   - 테스트 및 성능 검증 전략
   - 리스크 평가 및 완화 전략
   - 성공 메트릭 및 KPI
6. [Technical Research Recommendations](#technical-research-recommendations)
   - 구현 로드맵
   - 기술 스택 권장사항
   - 핵심 의사결정 요약

---

## Technical Research Scope Confirmation

**Research Topic:** TC39 Signals 표준과 React 시그널 아키텍처 전환
**Research Goals:** TC39 Signals 표준 분석, Preact/Solid.js/Angular 시그널 비교, context-query 라이브러리의 시그널 전환 설계

**Technical Research Scope:**

- Architecture Analysis - TC39 Signals 표준 설계, Signal.State/Signal.Computed/Signal.subtle.Watcher API 구조
- Implementation Approaches - Preact, Solid.js, Angular 시그널 구현 패턴 비교
- Technology Stack - React useSyncExternalStore와 시그널 통합, concurrent mode 호환
- Integration Patterns - 아톰 기반 → 시그널 기반 마이그레이션 경로
- Performance Considerations - fine-grained reactivity, 의존성 추적, 메모리 효율, 번들 사이즈

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-02-14

---

## Technology Stack Analysis

### TC39 Signals 표준 제안 — 핵심 API 사양

TC39 Signals 제안은 JavaScript에 일급(first-class) 반응형 프리미티브를 추가하는 것을 목표로 한다. 현재 **Stage 1** 수준이며, Angular, Solid, Vue, Preact, Ember, MobX, Qwik, Svelte 등의 저자/관리자로부터 설계 입력을 받았다.

**핵심 API 구조:**

```typescript
// 1. Signal.State — 가변 상태 셀
class Signal.State<T> {
  constructor(initialValue: T, options?: SignalOptions<T>);
  get(): T;
  set(newValue: T): void;
}

// 2. Signal.Computed — 읽기 전용 파생 시그널
class Signal.Computed<T> {
  constructor(computation: () => T, options?: SignalOptions<T>);
  get(): T;  // lazy evaluation + memoization
}

// 3. Signal.subtle.Watcher — 프레임워크용 저수준 관찰자
class Signal.subtle.Watcher {
  constructor(notify: () => void);  // 동기 콜백
  watch(...signals: Signal[]): void;
  unwatch(...signals: Signal[]): void;
  getPending(): Signal[];
}

// 4. SignalOptions — 커스텀 비교 + 라이프사이클
interface SignalOptions<T> {
  equals?: (old: T, new: T) => boolean;
  [Signal.subtle.watched]?: () => void;
  [Signal.subtle.unwatched]?: () => void;
}

// 5. 유틸리티
Signal.subtle.untrack(cb: () => T): T;        // 의존성 추적 비활성화
Signal.subtle.currentComputed(): Computed | null;
Signal.subtle.introspectSources(s): Signal[];  // 의존성 조회
Signal.subtle.introspectSinks(s): Signal[];    // 의존자 조회
Signal.subtle.hasSinks(s): boolean;
Signal.subtle.hasSources(s): boolean;
```

**설계 철학:**
- 프레임워크/라이브러리 저자를 위한 **저수준 프리미티브** (애플리케이션 개발자용이 아님)
- Effect는 표준에 포함되지 않음 — `Signal.subtle.Watcher`로 직접 구현
- Lazy evaluation + memoization 기본
- 동기적 `notify` 콜백 (마이크로태스크 아님)

_표준화 진행 상황: Stage 0~1 수준, 보수적 접근으로 2-3년 이상 소요 예상_
_Source: [tc39/proposal-signals](https://github.com/tc39/proposal-signals)_
_Source: [signal-polyfill](https://github.com/proposal-signals/signal-polyfill)_
_Source: [EisenbergEffect - TC39 Signals 제안](https://eisenbergeffect.medium.com/a-tc39-proposal-for-signals-f0bedd37a335)_

### 프레임워크별 시그널 구현 비교

#### Preact Signals

Preact Signals는 세 가지 반응형 프리미티브로 구성된다: `signal()` (가변 상태), `computed()` (파생 값), `effect()` (부수효과).

**핵심 아키텍처 특징:**
- **이중 연결 리스트(Doubly Linked List)** 기반 의존성 추적 — Set/Map 대신 사용하여 메모리 효율 극대화
- Node 구조로 source(시그널)와 target(컴퓨티드/이펙트)를 연결
- 버전 카운팅으로 불필요한 재계산 방지
- `@preact/signals-react` 어댑터: React의 `useSyncExternalStore`와 통합하여 시그널 변경 시 구독 컴포넌트만 업데이트

```javascript
import { signal, computed, effect } from "@preact/signals";
const count = signal(0);
const double = computed(() => count.value * 2);
effect(() => console.log(double.value));
count.value = 1; // 로그: 2
```

_Source: [Preact Signals Guide](https://preactjs.com/guide/v10/signals/)_
_Source: [Signal Boosting - Preact Blog](https://preactjs.com/blog/signal-boosting/)_
_Source: [DeepWiki - Core Signal System](https://deepwiki.com/preactjs/signals/2-core-signal-system)_

#### Solid.js Signals

Solid.js는 시그널의 원조격으로, **컴파일 타임 최적화 + 런타임 반응형**을 결합한다.

**핵심 아키텍처 특징:**
- `createSignal()` → `[getter, setter]` 튜플 반환 (React의 useState와 유사한 인터페이스)
- **Pull-based 반응형 모델** — 읽기(구독)는 가볍고, 쓰기(업데이트)가 의존성 추적 트리거
- `createEffect()` — 의존성 자동 추적, 의존성 변경 시 재실행
- `createMemo()` — 계산된 값의 메모이제이션
- Set 기반 구독자 관리 + 글로벌 `currentSubscriber` 변수로 추적 컨텍스트 관리

```javascript
import { createSignal, createEffect, createMemo } from "solid-js";
const [count, setCount] = createSignal(0);
const double = createMemo(() => count() * 2);
createEffect(() => console.log(double()));
setCount(1); // 로그: 2
```

_Source: [Solid.js Signals Docs](https://docs.solidjs.com/concepts/signals)_
_Source: [Fine-grained Reactivity - Solid Docs](https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity)_
_Source: [Deep Dive - This Dot Labs](https://www.thisdot.co/blog/deep-dive-into-how-signals-work-in-solidjs)_

#### Angular Signals

Angular의 시그널은 **Zone.js 의존성을 제거**하고 세분화된 변경 감지를 가능케 하기 위해 도입되었다.

**핵심 아키텍처 특징:**
- `signal()` — 가변 상태, `.set()`, `.update()`, `.mutate()` 메서드
- `computed()` — 파생 값, lazy evaluation + 캐싱, 동기적
- `effect()` — 비동기 실행, 클린업 지원, Angular의 변경 감지 사이클과 통합
- `linkedSignal()` — 파생 + 수동 설정 모두 가능한 하이브리드
- `resource()` — HTTP 호출의 시그널 모델 통합

```typescript
import { signal, computed, effect } from '@angular/core';
const count = signal(0);
const double = computed(() => count() * 2);
effect(() => console.log(double()));
count.set(1); // 비동기적으로 로그: 2
```

_Source: [Angular Signals Guide](https://angular.dev/guide/signals)_
_Source: [Angular Signals Revolution - AppSignal](https://blog.appsignal.com/2025/09/17/the-angular-signals-revolution-rethinking-reactivity.html)_
_Source: [Angular Signals Best Practices](https://medium.com/@eugeniyoz/angular-signals-best-practices-9ac837ab1cec)_

### 프레임워크 간 시그널 비교 매트릭스

| 특성 | TC39 표준 | Preact | Solid.js | Angular |
|------|-----------|--------|----------|---------|
| **상태 생성** | `new Signal.State(v)` | `signal(v)` | `createSignal(v)` | `signal(v)` |
| **값 읽기** | `.get()` | `.value` (getter) | `getter()` (함수 호출) | `signal()` (함수 호출) |
| **값 쓰기** | `.set(v)` | `.value = v` (setter) | `setter(v)` | `.set(v)` / `.update(fn)` |
| **파생값** | `new Signal.Computed(fn)` | `computed(fn)` | `createMemo(fn)` | `computed(fn)` |
| **부수효과** | 없음 (Watcher로 직접 구현) | `effect(fn)` | `createEffect(fn)` | `effect(fn)` |
| **의존성 추적** | 자동 (get 호출 추적) | 자동 (.value 접근 추적) | 자동 (getter 호출 추적) | 자동 (signal() 호출 추적) |
| **평가 전략** | Lazy + Memoized | Lazy + Memoized | Eager (Memo는 Lazy) | Lazy + Memoized |
| **커스텀 비교** | `options.equals` | `signal(v, { equals })` | `createSignal(v, { equals })` | `signal(v, { equal })` |
| **라이프사이클** | `watched`/`unwatched` 심볼 | 없음 | `onCleanup()` | `destroyRef` |
| **메모리 전략** | 미정 | 이중 연결 리스트 | Set 기반 | 내부 구현 |
| **React 통합** | 직접 구현 필요 | `useSyncExternalStore` | 없음 (자체 렌더러) | 없음 (자체 프레임워크) |

### React 생태계와 시그널 통합 패턴

React는 근본적으로 **pull-based 렌더링 모델**(Virtual DOM diff)을 사용하며, 시그널의 **push-based fine-grained reactivity**와는 상충한다. 그러나 `useSyncExternalStore` API를 통해 외부 시그널 시스템과의 통합이 가능하다.

**Preact Signals의 React 통합 패턴:**
1. `useSignals()` 훅이 `useSyncExternalStore`를 사용
2. 컴포넌트 렌더링 중 시그널 `.value` 접근 시 구독 등록
3. 시그널 변경 → 내부 버전 카운터 증가 → React에 리렌더링 스케줄링
4. 결과적으로 **컴포넌트 수준의 세분화된 업데이트** 달성

**context-query에 적합한 통합 전략:**
- TC39 Signals 표준의 `Signal.State`/`Signal.Computed` API를 core에서 구현
- `Signal.subtle.Watcher`를 활용한 React 어댑터 계층
- 기존 `useSyncExternalStore` 기반 훅 패턴 유지
- 아톰 → 시그널 점진적 마이그레이션 경로 제공

_Source: [Preact Signals React Integration](https://deepwiki.com/preactjs/signals/3.2-react-integration)_
_Source: [Fine-Grained Reactivity in React](https://medium.com/@sparshmalhotraaa/fine-grained-reactivity-in-react-how-preact-signals-do-it-a282943b2bd8)_
_Source: [Signals vs React Compiler](https://redmonk.com/kholterhoff/2025/05/13/javascript-signals-react-compiler/)_

### 기술 채택 동향

**2025-2026년 시그널 채택 현황:**
- Angular, SolidJS, Svelte, Qwik, Vue 3, Preact — 모두 시그널 기반 반응형 채택
- React — 유일하게 시그널을 공식 채택하지 않음, 대신 React Compiler 방향으로 최적화 추구
- TC39 표준화 — 아직 초기 단계이나, 프레임워크 간 상호운용성에 대한 기대감이 높음

**context-query에 대한 시사점:**
- 시그널은 이미 프론트엔드 생태계의 주류 반응형 패턴
- React에서의 시그널 활용은 외부 스토어 통합 방식(`useSyncExternalStore`)이 현실적
- TC39 표준 API를 따르면 향후 네이티브 시그널 지원 시 쉬운 마이그레이션 가능
- Zero Dependencies 원칙과 호환 — 표준 API만 구현하면 외부 의존성 불필요

_Source: [Signals: The New Reactivity Model](https://www.tothenew.com/blog/signals-the-new-reactivity-model-taking-over-frameworks/)_
_Source: [SolidJS Creator on Fine-Grained Reactivity](https://thenewstack.io/solidjs-creator-on-fine-grained-reactivity-as-next-frontier/)_

### 성능 벤치마크 분석

#### 벤치마크 기반 순위 (js-reactivity-benchmark, M3 MacBook Pro, Node.js v22)

| 순위 | 라이브러리 | 알고리즘 | 강점 |
|------|-----------|---------|------|
| **1** | **Alien Signals** | Push-Pull 하이브리드 + 이중 연결 리스트 | 전반적 최고 성능, Vue 3.6에 채택 |
| **2** | **Reactively** | Graph Coloring (Red/Green) 하이브리드 | 동적 의존성 그래프에서 최고 |
| **3** | **Preact Signals** | Lazy Pull + 버전 카운팅 + 이중 연결 리스트 | 깊은(deep) 의존성 그래프에서 최고 |
| **4** | **Solid.js** | Eager Push + Set 기반 | 넓은(wide) 의존성 그래프에서 강세 |
| **5** | **Angular Signals** | — | 일관되게 느림 |

#### 성능 차이를 만드는 3가지 핵심 요소

**1. 데이터 구조: 이중 연결 리스트 > Set/Map**
- Alien Signals, Preact 모두 Array/Set/Map 사용을 금지하고 이중 연결 리스트 사용
- Node 삽입/제거/순회가 O(1), GC 압력 최소화
- 의존성 트리가 안정적이면 메모리 할당이 초기 빌드 후 사실상 0

**2. 알고리즘: Push-Pull 하이브리드 > 순수 Push 또는 순수 Pull**
- 순수 Push (MobX식): 다이아몬드 문제 — 중복 업데이트 발생
- 순수 Pull (Lazy): 불필요한 재계산은 피하지만 탐색 비용
- Push-Pull 하이브리드 (Alien Signals): Push로 dirty 플래그만 전파, Pull로 실제 값 요청 시에만 계산

**3. 함수 재귀 회피: 반복문(iterative) > 재귀(recursive)**
- Alien Signals는 do-while 루프 + 링크 노드 추적으로 재귀 완전 제거
- 콜 스택 오버플로 방지 + 성능 개선

#### context-query 현재 아키텍처의 성능 한계

현재 context-query의 `AtomStore`/`DerivedAtomStore` 분석:
- `Set` 기반 리스너 관리 → 이중 연결 리스트 대비 메모리/GC 비효율
- `DerivedAtomStore`는 이미 Lazy Pull 패턴 사용 (dirty flag + recompute on getValue) → 좋은 기반
- Push-Pull 하이브리드 최적화 미적용
- 스냅샷 캐시는 전체 무효화 방식 → 개별 atom 단위 무효화 필요

#### 추천 아키텍처

**Alien Signals 스타일의 Push-Pull 하이브리드 + 이중 연결 리스트 + TC39 표준 API 인터페이스**

추천 이유:
1. 벤치마크에서 검증된 최고 성능 알고리즘
2. Vue 3.6 프로덕션 레벨 검증
3. TC39 Signals 스펙 호환 가능 (createReactiveSystem 확장 API)
4. Zero Dependencies 원칙 유지 (자체 구현 가능)
5. 기존 Lazy evaluation 패턴과 자연스러운 결합

_Source: [Alien Signals - GitHub](https://github.com/stackblitz/alien-signals)_
_Source: [js-reactivity-benchmark](https://github.com/milomg/js-reactivity-benchmark)_
_Source: [Super Charging Fine-Grained Reactivity](https://milomg.dev/2022-12-01/reactivity)_
_Source: [Signal Boosting - Preact Blog](https://preactjs.com/blog/signal-boosting/)_

## Integration Patterns Analysis

### 시그널 → React 통합 패턴

React는 Virtual DOM 기반 렌더링 모델을 사용하므로, 시그널 시스템과 직접 통합하려면 **브릿지 계층**이 필요하다. 현재 검증된 통합 패턴은 크게 3가지이다.

#### 패턴 1: useSyncExternalStore 기반 통합 (권장)

React 18+의 `useSyncExternalStore`를 사용하여 외부 시그널 스토어를 React 렌더링 사이클에 안전하게 연결하는 방식.

```typescript
// subscribe: 시그널 변경 시 콜백 호출
// getSnapshot: 현재 시그널 값의 불변 스냅샷 반환
const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
```

**장점:**
- React concurrent mode 안전 (tearing 방지)
- React 공식 API — 장기적 안정성 보장
- context-query의 기존 패턴과 완전 호환 (이미 사용 중)
- SSR 지원 (getServerSnapshot)

**단점:**
- 컴포넌트 수준 리렌더링 (DOM 노드 수준 업데이트는 불가)
- subscribe/getSnapshot의 참조 안정성 관리 필요

_Source: [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)_
_Source: [useSyncExternalStore 내부 동작](https://jser.dev/2023-08-02-usesyncexternalstore/)_

#### 패턴 2: Preact Signals 스타일 Effect Store

Preact의 `@preact/signals-react`가 사용하는 방식. 각 컴포넌트를 리액티브 이펙트 스토어로 래핑한다.

```typescript
// 1. useSignals() 훅이 이펙트 스토어 생성
// 2. 렌더링 중 시그널 .value 접근 → 의존성 자동 추적
// 3. 시그널 변경 → 내부 버전 카운터 증가 → useSyncExternalStore로 리렌더링
```

**장점:**
- 자동 의존성 추적 (수동 키 지정 불필요)
- 시그널을 JSX에 직접 삽입 가능 (텍스트 노드 레벨 업데이트)

**단점:**
- Babel 플러그인 의존 또는 수동 훅 래핑 필요
- React 내부 동작에 의존 (버전 간 호환성 문제)
- `useSyncExternalStoreWithSelector` 충돌 이슈 보고됨

_Source: [Preact Signals React Integration](https://deepwiki.com/preactjs/signals/3.2-react-integration)_
_Source: [Fine-Grained Reactivity in React](https://medium.com/@sparshmalhotraaa/fine-grained-reactivity-in-react-how-preact-signals-do-it-a282943b2bd8)_

#### 패턴 3: React Alien Signals 스타일 (Alien Signals + React)

Alien Signals의 반응형 그래프를 React 훅으로 노출하는 방식.

```typescript
// createSignal → useSignal (read-write)
// createComputed → useComputed (read-only)
// createEffect → useSignalEffect (부수효과)
const [value, setValue] = useSignal(mySignal);
const derived = useSignalValue(myComputed);
```

**장점:**
- 의존성 배열 불필요 (자동 추적)
- Alien Signals의 최고 성능 활용
- Read/Write/ReadWrite 분리 (context-query의 훅 분류와 일치)

**단점:**
- `react-alien-signals` 라이브러리 자체는 커뮤니티 규모 작음 (Stars 55, Commits 16)
- 그러나 패턴 자체는 표준 훅(`useSyncExternalStore`)만 사용하므로 안정성 문제 없음

**Preact signals-react 대비 안정성 우위:**
- Preact 방식은 React 내부 해킹(monkey-patching)으로 React 19 호환 문제 다수 발생
  - `installAutoSignalTracking` 실패 (Issue #576)
  - React Element 버전 불일치 (Issue #580)
  - `useSyncExternalStoreWithSelector` 충돌 (Issue #411)
  - React Compiler 비호환
- Alien Signals 스타일은 React 내부 해킹 없이 표준 훅만 사용 → 위 문제 전부 해당 없음

**수정된 패턴 평가:**

| 패턴 | 안정성 | 성능 | context-query 적합도 |
|------|-------|------|-------------------|
| 패턴 1: 순수 useSyncExternalStore | 최고 | 기존과 동일 | 높음 |
| 패턴 2: Preact 스타일 (내부 해킹) | 낮음 (React 버전 충돌) | 높음 | **부적합** |
| **패턴 3: Alien Signals 스타일** | **높음** (표준 훅만 사용) | **최고** | **최적** |

패턴 3은 사실상 패턴 1의 상위 호환이다. 내부 반응형 엔진만 Push-Pull 하이브리드로 교체한 것이므로, React 통합 계층의 안정성은 동일하면서 성능만 극대화된다.

_Source: [react-alien-signals](https://github.com/Rajaniraiyn/react-alien-signals)_
_Source: [Preact Signals React 19 Issue #576](https://github.com/preactjs/signals/issues/576)_
_Source: [Preact Signals React Element Issue #580](https://github.com/preactjs/signals/issues/580)_
_Source: [Concurrent React Tearing](https://interbolt.org/blog/react-ui-tearing/)_

### context-query의 API 매핑 전략

현재 context-query의 아톰 API를 시그널 API로 매핑하는 전략:

| 현재 (Atom) | 시그널 (내부) | React 훅 (외부) | 변경 사항 |
|------------|-------------|----------------|---------|
| `atom(initialValue)` | `Signal.State(initialValue)` | 동일 API 유지 | 내부 구현만 교체 |
| `derived(readFn)` | `Signal.Computed(readFn)` | 동일 API 유지 | 내부 구현만 교체 |
| `AtomStore` | Signal 기반 반응형 셀 | — | 완전 교체 |
| `DerivedAtomStore` | Computed Signal | — | 완전 교체 |
| `ContextQueryStore` | SignalStore (새로운 코어) | — | 내부 구현 교체 |
| `useContextAtom(key)` | Signal 구독 + setter | `[value, setter]` | API 동일, 내부만 변경 |
| `useContextAtomValue(key)` | Signal 구독 (read-only) | `value` | API 동일, 내부만 변경 |
| `useContextSetAtom(key)` | setter만 반환 (구독 없음) | `setter` | API 동일, 내부만 변경 |
| `useContextAtomSelector(key, fn)` | Computed Signal + selector | `selected` | API 동일, 내부만 변경 |
| `useSnapshot()` | 전체 Signal 스냅샷 | `[snapshot, patch]` | API 동일, 내부만 변경 |

**핵심 원칙: 외부 API(훅 인터페이스)는 유지하면서, 내부 구현만 시그널 기반으로 교체**

### Signal.subtle.Watcher 기반 Effect 구현 전략

TC39 표준은 Effect를 포함하지 않으므로, `Signal.subtle.Watcher`를 활용한 자체 이펙트 시스템 구현이 필요하다.

```typescript
// TC39 표준 호환 effect 구현 패턴
let needsEnqueue = true;
const watcher = new Signal.subtle.Watcher(() => {
  if (needsEnqueue) {
    needsEnqueue = false;
    queueMicrotask(processPending);
  }
});

function processPending() {
  needsEnqueue = true;
  for (const s of watcher.getPending()) {
    s.get(); // 재계산 트리거
  }
  watcher.watch(); // 감시 재시작
}
```

context-query에서는 이 패턴을 `useSyncExternalStore`의 subscribe 함수와 결합하여 사용한다.

_Source: [signal-polyfill](https://github.com/proposal-signals/signal-polyfill)_
_Source: [TC39 Signals Proposal](https://github.com/tc39/proposal-signals)_

### Alien Signals의 createReactiveSystem 통합 전략

Alien Signals의 코어 알고리즘을 `createReactiveSystem()`으로 재사용하면서 TC39 호환 인터페이스를 제공하는 전략:

```typescript
import { createReactiveSystem } from 'alien-signals';

// 1. 코어 반응형 시스템 생성 (alien-signals 알고리즘 활용)
const system = createReactiveSystem({
  updateComputed(computed) { /* ... */ },
  notifyEffect(effect) { /* ... */ },
});

// 2. TC39 호환 인터페이스로 래핑
class SignalState<T> {
  get(): T { /* system.signal 사용 */ }
  set(value: T): void { /* system.signal 사용 */ }
}
```

**그러나 context-query는 Zero Dependencies 원칙을 따르므로**, alien-signals를 직접 의존하지 않고 알고리즘을 자체 구현해야 한다. 핵심 알고리즘(push-pull + 이중 연결 리스트)을 참조하여 자체 구현하는 것이 최적의 전략이다.

_Source: [Alien Signals createReactiveSystem](https://github.com/stackblitz/alien-signals)_

## Architectural Patterns and Design

### 시스템 아키텍처: 3계층 분리 설계

context-query의 시그널 전환은 **3계층 분리 아키텍처**를 채택한다.

```
┌─────────────────────────────────────────────┐
│  Layer 3: React Adapter (@context-query/react) │
│  ─ useSyncExternalStore 기반 훅               │
│  ─ Provider/Context 관리                      │
│  ─ React lifecycle 통합                       │
├─────────────────────────────────────────────┤
│  Layer 2: Store API (@context-query/core)     │
│  ─ ContextQueryStore (기존 API 유지)          │
│  ─ atom()/derived() 팩토리 함수               │
│  ─ TC39 호환 인터페이스                        │
├─────────────────────────────────────────────┤
│  Layer 1: Reactive Engine (internal)          │
│  ─ Push-Pull 하이브리드 알고리즘              │
│  ─ 이중 연결 리스트 기반 의존성 그래프         │
│  ─ Flag 기반 상태 추적                        │
│  ─ 비재귀 전파/검증 루프                      │
└─────────────────────────────────────────────┘
```

**설계 원칙:**
- Layer 1은 프레임워크 무관 — 순수 JavaScript 반응형 엔진
- Layer 2는 Layer 1 위에 사용자 친화적 API 제공
- Layer 3는 React 전용 어댑터 — Layer 2에만 의존
- 각 계층은 독립적으로 테스트/교체 가능

### Layer 1: Reactive Engine 아키텍처 (Alien Signals 참조)

#### 핵심 데이터 구조: ReactiveNode + Link

```typescript
// 비트 플래그 기반 상태 관리
const enum Flags {
  Dirty    = 1 << 0,  // 값 변경됨, 전파 필요
  Pending  = 1 << 1,  // 업데이트 대기 중
  Mutable  = 1 << 2,  // 의존자에게 전파 가능
  Watching = 1 << 3,  // Watcher/Effect가 관찰 중
}

// 반응형 노드 (Signal.State 또는 Signal.Computed의 내부 표현)
interface ReactiveNode {
  value: any;
  flags: number;          // 비트 플래그 조합
  deps: Link | null;      // 첫 번째 의존성 링크
  depsTail: Link | null;  // 마지막 의존성 링크
  subs: Link | null;      // 첫 번째 구독자 링크
  subsTail: Link | null;  // 마지막 구독자 링크
}

// 이중 연결 리스트 노드 (의존성-구독자 관계)
interface Link {
  dep: ReactiveNode;      // 의존성 (source)
  sub: ReactiveNode;      // 구독자 (target)
  prevDep: Link | null;   // 이전 의존성 링크
  nextDep: Link | null;   // 다음 의존성 링크
  prevSub: Link | null;   // 이전 구독자 링크
  nextSub: Link | null;   // 다음 구독자 링크
}
```

**Array/Set/Map을 사용하지 않는 이유:**
- GC 압력 제거 — 컬렉션 객체 할당 없음
- O(1) 삽입/제거 — 포인터 조작만으로 완료
- 캐시 지역성 — 노드가 생성 순서대로 메모리에 배치될 가능성 높음
- 메모리 안정성 — 의존성 트리가 안정적이면 초기 빌드 후 할당 0

#### Push-Pull 하이브리드 알고리즘

**Push 단계 (propagate):**
```
Signal.State 값 변경
  → 구독자 링크 체인 순회 (do-while 루프, 비재귀)
  → Computed 구독자: Pending 플래그 설정
  → Effect 구독자: Dirty 플래그 설정
  → 중첩 구독자에게 재귀 없이 반복 전파
```

**Pull 단계 (checkDirty + getValue):**
```
Signal.Computed.get() 호출
  → Pending 플래그 확인
  → 의존성 체인을 위로 순회하여 실제 변경 확인
  → 변경된 경우에만 재계산 실행
  → 캐시된 값 반환 (변경 없으면 이전 값 유지)
```

**다이아몬드 문제 해결:**
```
    A (State)
   / \
  B   C (Computed)
   \ /
    D (Computed)

A 변경 시:
1. Push: B, C에 Pending 전파 → D에 Pending 전파
2. D.get() 호출 시 Pull:
   - B의 실제 값 확인 → 재계산 필요?
   - C의 실제 값 확인 → 재계산 필요?
   - D는 한 번만 재계산 (중복 실행 없음)
```

_Source: [Alien Signals Architecture](https://github.com/stackblitz/alien-signals)_
_Source: [Alien Signals Annotated](https://github.com/Ray-D-Song/alien-signals-annotate)_
_Source: [Signal Algorithm for Reactivity](https://www.blog.brightcoding.dev/2025/05/14/signal-algorithm-for-managing-reactivity-in-frontend-projects/)_

### Layer 2: Store API 설계 패턴

#### TC39 호환 + 기존 API 유지 전략

```typescript
// TC39 표준 호환 내부 인터페이스
class SignalState<T> {
  constructor(initialValue: T, options?: { equals?: (a: T, b: T) => boolean });
  get(): T;
  set(value: T): void;
}

class SignalComputed<T> {
  constructor(computation: () => T, options?: { equals?: (a: T, b: T) => boolean });
  get(): T;
}

// 기존 API 팩토리 (변경 없음)
function atom<T>(initialValue: T, options?): AtomConfig<T>;
function derived<T>(readFn: (get) => T): DerivedAtomConfig<T>;

// ContextQueryStore — 외부 API 동일, 내부만 교체
class ContextQueryStore<TAtoms> {
  // 내부: Map<key, SignalState | SignalComputed> 대신 LinkedList 기반
  getAtomValue(key): T;      // → internal SignalState.get()
  setAtomValue(key, value);  // → internal SignalState.set()
  subscribeToAtom(key, listener); // → Watcher 기반 구독
  getSnapshot(): TAtoms;     // → 캐시된 스냅샷
}
```

#### 마이그레이션 경로

```
Phase 1: Layer 1 (Reactive Engine) 구현 — 순수 알고리즘
Phase 2: Layer 2 (Store API) 내부 교체 — AtomStore → SignalState 래퍼
Phase 3: Layer 3 (React Adapter) 최적화 — 구독 메커니즘 개선
Phase 4: 성능 검증 + 문서/플레이그라운드 업데이트
```

_Source: [TC39 Signals Proposal](https://github.com/tc39/proposal-signals)_
_Source: [Adapter Pattern in React](https://medium.com/@nouraldin.alsweirki/design-patterns-in-react-adapter-7efdb0c1025a)_

### Layer 3: React Adapter 패턴

#### useSyncExternalStore 기반 구독 아키텍처

```typescript
// 각 atom 키에 대한 subscribe/getSnapshot 생성
function createAtomSubscription<T>(store: ContextQueryStore, key: string) {
  const subscribe = (callback: () => void) => {
    // 내부: SignalState/SignalComputed의 Watcher가 callback 호출
    const sub = store.subscribeToAtom(key, callback);
    return sub.unsubscribe;
  };

  const getSnapshot = () => store.getAtomValue(key);

  return { subscribe, getSnapshot };
}

// React 훅에서 사용
function useContextAtomValue<K>(key: K) {
  const store = useStoreContext();
  const { subscribe, getSnapshot } = useMemo(
    () => createAtomSubscription(store, key),
    [store, key]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

**기존 패턴과의 차이:**
- 현재: `AtomStore.subscribe()` → `Set<Listener>` 기반 알림
- 변경 후: `SignalState` 내부 Watcher → 이중 연결 리스트 기반 알림
- React 훅 인터페이스는 **완전히 동일** — 사용자 코드 변경 없음

### 스케일링 및 성능 아키텍처 패턴

#### Batch Update 전략

```typescript
// 여러 시그널을 동시에 변경 시 중간 상태 전파 방지
function batch(fn: () => void) {
  // 1. 전파 일시 중지
  // 2. fn() 실행 — 여러 SignalState.set() 호출
  // 3. 전파 재개 — 한 번에 모든 구독자 알림
}
```

#### 메모리 관리 패턴

- **Effect Scope**: 컴포넌트 언마운트 시 관련 구독 일괄 해제
- **Lazy Subscription**: `useSyncExternalStore` 호출 시에만 구독 생성
- **WeakRef 고려**: 장기 실행 앱에서 가비지 컬렉션 지원 (TC39 이슈 #265 참조)

#### 디버깅 아키텍처

기존 `getDebugInfo()`/`getDependencyGraph()` API를 시그널 내부의 `introspectSources`/`introspectSinks` 패턴으로 확장:

```typescript
// TC39 호환 인트로스펙션
Signal.subtle.introspectSources(computed) → [dep1, dep2, ...]
Signal.subtle.introspectSinks(state) → [computed1, effect1, ...]
Signal.subtle.hasSinks(state) → boolean
```

_Source: [Angular Signals Push-Pull](https://angularexperts.io/blog/angular-signals-push-pull/)_
_Source: [Preact Signal Boosting](https://preactjs.com/blog/signal-boosting/)_
_Source: [TC39 Signals Weak References Issue #265](https://github.com/tc39/proposal-signals/issues/265)_

## Implementation Approaches and Technology Adoption

### 구현 전략: Alien Signals 알고리즘 자체 구현

#### Reactive Engine 핵심 구현 사양

Alien Signals의 소스 코드를 분석하여 context-query에 자체 구현할 핵심 구조:

**1. 비트 플래그 정의:**
```typescript
const enum ReactiveFlags {
  None          = 0,
  Mutable       = 1,      // Signal.State (쓰기 가능)
  Watching      = 2,      // Watcher/Effect가 관찰 중
  RecursedCheck = 4,      // checkDirty 재귀 감지용
  Recursed      = 8,      // propagate 재귀 감지용
  Dirty         = 16,     // 값 변경됨
  Pending       = 32,     // 업데이트 대기 중
}
```

**2. Link 구조 (이중 연결 리스트 노드):**
```typescript
interface Link {
  version: number;         // 의존성 버전 추적
  dep: ReactiveNode;       // 의존성 (source)
  sub: ReactiveNode;       // 구독자 (target)
  prevSub: Link | undefined;
  nextSub: Link | undefined;
  prevDep: Link | undefined;
  nextDep: Link | undefined;
}
```

**3. ReactiveNode 구조:**
```typescript
interface ReactiveNode {
  deps?: Link;             // 첫 번째 의존성 링크
  depsTail?: Link;         // 마지막 의존성 링크
  subs?: Link;             // 첫 번째 구독자 링크
  subsTail?: Link;         // 마지막 구독자 링크
  flags: ReactiveFlags;    // 비트 플래그 상태
}
```

**4. createReactiveSystem 팩토리:**
```typescript
function createReactiveSystem(config: {
  update(computed: ReactiveNode): boolean;   // Computed 재계산
  notify(effect: ReactiveNode): void;        // Effect 알림
  unwatched?(node: ReactiveNode): void;      // 관찰 해제 콜백
}) => {
  link(dep, sub): Link;           // 의존성-구독 관계 생성
  unlink(link): void;             // 관계 제거
  propagate(link): void;          // Push 단계: dirty 전파
  checkDirty(link, sub): boolean; // Pull 단계: 실제 변경 확인
  shallowPropagate(link): void;   // 얕은 전파
}
```

_Source: [Alien Signals system.ts](https://github.com/stackblitz/alien-signals/blob/master/src/system.ts)_
_Source: [Alien Signals Annotated](https://github.com/Ray-D-Song/alien-signals-annotate)_

### 마이그레이션 전략: 비파괴적 내부 교체

#### Phase 1: Reactive Engine 구현 (신규 파일)

```
packages/core/src/
  ├── signal/
  │   ├── flags.ts           # ReactiveFlags enum
  │   ├── link.ts            # Link 구조 + link/unlink 함수
  │   ├── node.ts            # ReactiveNode 인터페이스
  │   ├── system.ts          # createReactiveSystem 팩토리
  │   ├── state.ts           # SignalState 클래스 (Signal.State 구현)
  │   ├── computed.ts        # SignalComputed 클래스 (Signal.Computed 구현)
  │   └── index.ts           # 내부 re-export
  ├── atom.ts                # 기존 유지 (변경 없음)
  ├── derived.ts             # 기존 유지 (변경 없음)
  ├── atomStore.ts           # → SignalState 래퍼로 교체
  ├── derivedAtomStore.ts    # → SignalComputed 래퍼로 교체
  ├── contextQueryStore.ts   # 내부 구현만 교체
  └── index.ts               # 기존 export 유지
```

**핵심 원칙: 기존 파일의 export/API는 일체 변경하지 않음**

#### Phase 2: Store 내부 교체

```typescript
// Before: AtomStore (Set 기반)
class AtomStore<T> {
  private listeners: Set<AtomListener>;  // ← 교체 대상
  setValue(v: T) { this.notifyListeners(); }
}

// After: AtomStore → SignalState 래핑
class AtomStore<T> {
  private signal: SignalState<T>;  // ← 시그널 엔진 사용
  setValue(v: T) { this.signal.set(v); }  // ← 자동 전파
}
```

```typescript
// Before: DerivedAtomStore (dirty flag + Set 기반)
class DerivedAtomStore<T> {
  private dirty: boolean;
  private listeners: Set<AtomListener>;

  getValue(): T {
    if (this.dirty) this.recompute();
    return this.cachedValue;
  }
}

// After: DerivedAtomStore → SignalComputed 래핑
class DerivedAtomStore<T> {
  private computed: SignalComputed<T>;  // ← 시그널 엔진 사용

  getValue(): T {
    return this.computed.get();  // ← 자동 lazy evaluation
  }
}
```

#### Phase 3: React Adapter 최적화

- `useSyncExternalStore` 내부에서 Watcher 기반 subscribe 사용
- 기존 훅 인터페이스 100% 유지
- batch update 지원 추가 (선택적 최적화)

#### Phase 4: 검증 + 문서 업데이트

- 성능 벤치마크, 기존 테스트 통과 확인, 문서/플레이그라운드 업데이트

### 테스트 및 성능 검증 전략

#### 1. 기존 테스트 회귀 방지

현재 테스트 스위트(`packages/core/src/__tests__/`)를 먼저 모두 통과시킨 후 시그널 전환:
- `atomStore.test.ts` — AtomStore 기본 동작
- `contextQueryStore.test.ts` — 전체 스토어 통합
- `derivedAtomStore.test.ts` — 파생 아톰 동작
- `epic3.test.ts` — 셀렉터, 평등성, 리셋
- `epic4.test.ts` — DevTools, 디버그, 에러 핸들링

#### 2. Vitest bench 기반 정량적 성능 벤치마크

```typescript
// packages/core/src/__benchmarks__/signal.bench.ts
import { bench, describe } from 'vitest';

describe('Signal Performance', () => {
  bench('1K signal creates', () => {
    for (let i = 0; i < 1000; i++) signal(i);
  }, { time: 1000, iterations: 100 });

  bench('deep propagation (depth=100)', () => {
    // 100단계 깊이의 computed 체인 업데이트
  });

  bench('wide propagation (width=1000)', () => {
    // 1000개 구독자에 대한 단일 시그널 업데이트
  });

  bench('diamond pattern (4 nodes)', () => {
    // A → B, C → D 다이아몬드 패턴
  });

  bench('dynamic dependency switching', () => {
    // 런타임 의존성 변경 시나리오
  });
});
```

**측정 메트릭:**
- 시그널 생성 시간 (ops/sec)
- 깊은 전파 시간 (depth=10, 50, 100)
- 넓은 전파 시간 (width=100, 500, 1000)
- 다이아몬드 패턴 해결 시간
- 메모리 사용량 (before/after)
- 번들 사이즈 (before/after)

#### 3. Before/After 비교 프레임워크

```
1. 현재 아톰 기반 구현 벤치마크 기록 (baseline)
2. 시그널 엔진 구현 후 동일 벤치마크 실행
3. 정량적 비교 테이블 생성
4. 회귀가 있으면 원인 분석 후 최적화
```

_Source: [Vitest Bench API](https://vitest.dev/api/)_
_Source: [Vitest Bench Performance Regressions](https://codspeed.io/blog/vitest-bench-performance-regressions)_
_Source: [js-reactivity-benchmark](https://github.com/milomg/js-reactivity-benchmark)_

### 리스크 평가 및 완화 전략

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|----------|
| 기존 API 호환성 깨짐 | 낮음 | 높음 | 외부 API 불변 원칙 + 기존 테스트 100% 통과 검증 |
| 시그널 엔진 버그 | 중간 | 높음 | 단위 테스트 + js-reactivity-benchmark 호환 테스트 |
| 성능 회귀 | 낮음 | 중간 | baseline 벤치마크 + before/after 비교 |
| 번들 사이즈 증가 | 중간 | 낮음 | 시그널 엔진은 ~1KB, tree-shaking 적용 |
| React concurrent mode 이슈 | 낮음 | 높음 | useSyncExternalStore 유지 — 기존과 동일한 보장 |
| 순환 의존성 감지 실패 | 낮음 | 중간 | 기존 순환 감지 로직 유지 + 플래그 기반 강화 |

### 성공 메트릭 및 KPI

| 메트릭 | 목표값 | 측정 방법 |
|--------|--------|----------|
| 기존 테스트 통과율 | 100% | `vitest run` |
| 깊은 전파 성능 | 기존 대비 ≥2x 향상 | `vitest bench` |
| 넓은 전파 성능 | 기존 대비 ≥2x 향상 | `vitest bench` |
| 다이아몬드 패턴 | 중복 계산 0 | 유닛 테스트 |
| 번들 사이즈 (core) | ≤ 5KB gzipped | rollup build |
| 메모리 사용량 | 기존 대비 ≤ 동일 | heap snapshot |
| 외부 API 변경 | 0개 | TypeScript 컴파일 |
| 외부 의존성 | 0개 | package.json 검증 |

## Technical Research Recommendations

### 구현 로드맵

```
Week 1: Reactive Engine (Layer 1)
  - ReactiveFlags, Link, ReactiveNode 구현
  - propagate/checkDirty 비재귀 루프 구현
  - SignalState/SignalComputed 클래스 구현
  - 단위 테스트 작성

Week 2: Store 내부 교체 (Layer 2)
  - AtomStore → SignalState 래핑
  - DerivedAtomStore → SignalComputed 래핑
  - ContextQueryStore 내부 교체
  - 기존 테스트 100% 통과 검증

Week 3: React Adapter 최적화 + 성능 검증 (Layer 3-4)
  - Watcher 기반 subscribe 최적화
  - Vitest bench 기반 벤치마크 실행
  - Before/After 성능 비교 테이블 생성
  - 번들 사이즈 검증

Week 4: 문서 + 플레이그라운드 업데이트
  - API 문서 업데이트 (내부 변경 설명)
  - 플레이그라운드에 벤치마크 데모 추가
  - GUIDE.ko.md 업데이트
  - 릴리스 준비
```

### 기술 스택 권장사항

- **반응형 엔진**: Alien Signals 알고리즘 자체 구현 (Push-Pull + 이중 연결 리스트)
- **React 통합**: `useSyncExternalStore` 유지 (패턴 3: Alien Signals 스타일)
- **테스트**: Vitest + Vitest bench (기존 인프라 활용)
- **빌드**: Rollup (기존 유지) + tree-shaking 검증
- **CI**: 벤치마크 결과 자동 비교 (--compare 옵션)

### 핵심 의사결정 요약

1. **Alien Signals 알고리즘 자체 구현** (외부 의존성 없음)
2. **외부 API 100% 유지** (비파괴적 내부 교체)
3. **TC39 호환 내부 인터페이스** (향후 표준 마이그레이션 대비)
4. **useSyncExternalStore 유지** (React concurrent mode 안전)
5. **Vitest bench 기반 정량적 성능 검증** (before/after 비교)

---

## Technical Research Conclusion

### 핵심 기술 발견 요약

1. **시그널은 프론트엔드 반응형의 표준이 되었다** — Angular, Vue, Preact, Solid, Svelte, Qwik 모두 채택. React만 유일하게 미채택 (React Compiler 방향).
2. **Alien Signals의 Push-Pull 하이브리드가 최고 성능** — js-reactivity-benchmark에서 검증, Vue 3.6에 프로덕션 채택.
3. **이중 연결 리스트가 Set/Map 대비 결정적 우위** — GC 압력 0, O(1) 조작, 메모리 안정성.
4. **React 통합은 useSyncExternalStore가 유일한 안전 경로** — Preact 스타일 내부 해킹은 React 19/Compiler에서 다수 문제 발생.
5. **TC39 표준 API를 내부 인터페이스로 따르면 향후 네이티브 마이그레이션 용이** — 2~3년 후 브라우저 지원 예상.

### 전략적 기술 영향 평가

context-query가 시그널 아키텍처로 전환하면:
- **성능**: 깊은/넓은 전파 모두 ≥2x 향상 예상
- **메모리**: GC 압력 대폭 감소 (Set → LinkedList)
- **호환성**: 외부 API 변경 0 — 기존 사용자 영향 없음
- **미래 대비**: TC39 표준 네이티브 지원 시 쉬운 전환
- **차별화**: React 생태계에서 시그널 기반 성능을 제공하는 몇 안 되는 라이브러리

### 다음 단계 권장사항

1. **PRD 작성** (`/bmad-bmm-create-prd`) — 이 리서치를 기반으로 요구사항 정의
2. **아키텍처 문서 작성** (`/bmad-bmm-create-architecture`) — 3계층 아키텍처 상세 설계
3. **에픽/스토리 작성** (`/bmad-bmm-create-epics-and-stories`) — 구현 단위 분해
4. **스프린트 계획 → 구현** — Claude Code agent teams로 병렬 구현

---

## Technical Research Source Documentation

### Primary Technical Sources

| Source | URL | 용도 |
|--------|-----|------|
| TC39 Signals Proposal | https://github.com/tc39/proposal-signals | 표준 API 사양 |
| Signal Polyfill | https://github.com/proposal-signals/signal-polyfill | 폴리필 구현 참조 |
| Alien Signals | https://github.com/stackblitz/alien-signals | 핵심 알고리즘 참조 |
| js-reactivity-benchmark | https://github.com/milomg/js-reactivity-benchmark | 성능 벤치마크 |
| Preact Signals | https://preactjs.com/guide/v10/signals/ | React 통합 패턴 참조 |
| Solid.js Signals | https://docs.solidjs.com/concepts/signals | 시그널 설계 참조 |
| Angular Signals | https://angular.dev/guide/signals | 시그널 설계 참조 |
| React useSyncExternalStore | https://react.dev/reference/react/useSyncExternalStore | React 통합 API |

### Secondary Technical Sources

- [EisenbergEffect - TC39 Signals](https://eisenbergeffect.medium.com/a-tc39-proposal-for-signals-f0bedd37a335)
- [Super Charging Fine-Grained Reactivity](https://milomg.dev/2022-12-01/reactivity)
- [Signal Boosting - Preact](https://preactjs.com/blog/signal-boosting/)
- [DeepWiki - Preact Core Signal System](https://deepwiki.com/preactjs/signals/2-core-signal-system)
- [react-alien-signals](https://github.com/Rajaniraiyn/react-alien-signals)
- [Alien Signals Annotated](https://github.com/Ray-D-Song/alien-signals-annotate)
- [Angular Signals Push-Pull](https://angularexperts.io/blog/angular-signals-push-pull/)
- [Concurrent React Tearing](https://interbolt.org/blog/react-ui-tearing/)
- [Vitest Bench API](https://vitest.dev/api/)

---

**Technical Research Completion Date:** 2026-02-14
**Research Period:** 포괄적 기술 분석
**Source Verification:** 모든 기술적 주장에 현재 소스 인용
**Technical Confidence Level:** High — 다수의 권위 있는 기술 소스 기반

_이 기술 리서치 문서는 context-query의 시그널 아키텍처 전환에 대한 권위 있는 기술 참조 문서로서, PRD 작성 및 아키텍처 설계의 기반이 된다._
