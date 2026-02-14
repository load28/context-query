---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-02-14'
inputDocuments:
  - '_bmad-output/planning-artifacts/architecture-signal-engine.md'
  - '_bmad-output/planning-artifacts/research/technical-tc39-signals-research-2026-02-14.md'
  - '_bmad-output/planning-artifacts/product-brief-context-query-2026-02-13.md'
  - '_bmad-output/project-context.md'
---

# context-query Signal Engine - Epic Breakdown

## Overview

이 문서는 context-query의 시그널 엔진 전환을 위한 에픽/스토리 분해를 제공합니다. Architecture Decision Document의 요구사항을 구현 가능한 스토리로 분해합니다.

## Requirements Inventory

### Functional Requirements

FR1: Alien Signals 참조 Push-Pull Hybrid 반응형 엔진 자체 구현
FR2: TC39 Signals 표준 호환 API 구조 (Signal.State → atom, Signal.Computed → derived)
FR3: Doubly Linked List 기반 의존성 추적 (현재 Set 기반 교체)
FR4: ReactiveFlags 비트 연산 상태 관리
FR5: 비재귀적 propagate/checkDirty 루프
FR6: Diamond Problem 자동 해결
FR7: 기존 외부 API 100% 하위 호환 (createContextQuery, 10개 훅)

### NonFunctional Requirements

NFR1: 성능 2-5x 향상 (Vitest bench 정량 검증)
NFR2: 번들 크기 — core < 2KB, react < 3KB (gzip)
NFR3: React 18/19 Concurrent Mode, Strict Mode, SSR 호환
NFR4: Zero Dependencies 유지 (core 패키지)
NFR5: 테스트 커버리지 core 90%+, react 85%+

### Additional Requirements

- 3계층 분리: Layer 1 (Reactive Engine) / Layer 2 (Store API) / Layer 3 (React Adapter)
- createReactiveSystem() 팩토리 + 클로저 패턴 (다중 인스턴스 안전)
- signal/ 디렉토리 8파일 구조 (types, link, propagate, state, computed, effect, system, index)
- 비파괴적 4단계 마이그레이션 (엔진 → AtomStore → DerivedAtomStore → ContextQueryStore)
- 7개 강제 구현 규칙 (비트 연산, 양방향 링크, 동기적 알림 등)
- Vitest bench 벤치마크 (5개 시나리오, KPI 정의)

### FR Coverage Map

FR1 (Push-Pull Hybrid) → Epic 1: Story 1.1, 1.2, 1.3
FR2 (TC39 호환 API) → Epic 1: Story 1.4, 1.5
FR3 (Doubly Linked List) → Epic 1: Story 1.1
FR4 (ReactiveFlags) → Epic 1: Story 1.1
FR5 (비재귀적 루프) → Epic 1: Story 1.2
FR6 (Diamond Problem) → Epic 1: Story 1.3
FR7 (외부 API 호환) → Epic 2: Story 2.1, 2.2, 2.3
NFR1 (성능 2-5x) → Epic 3: Story 3.1, 3.2
NFR2 (번들 크기) → Epic 3: Story 3.3
NFR3 (React 호환) → Epic 2: Story 2.3
NFR4 (Zero Dependencies) → Epic 2: Story 2.1, 2.2, 2.3
NFR5 (테스트 커버리지) → Epic 4: Story 4.1, 4.2

## Epic List

### Epic 1: 반응형 시그널 엔진 구현
Layer 1 완성 — packages/core/src/signal/ 디렉토리에 독립 반응형 엔진 구현
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 2: 스토어 계층 시그널 전환
Layer 2 교체 — AtomStore, DerivedAtomStore, ContextQueryStore 내부를 시그널 엔진으로 교체하되 외부 API 100% 유지
**FRs covered:** FR7, NFR3, NFR4

### Epic 3: 성능 검증 및 벤치마크
정량적 성능 측정 및 KPI 달성 확인, 번들 크기 검증
**FRs covered:** NFR1, NFR2

### Epic 4: 테스트 커버리지 및 문서화
종합 테스트 스위트 완성 및 playground 시그널 데모 업데이트
**FRs covered:** NFR5

---

## Epic 1: 반응형 시그널 엔진 구현

Layer 1 완성 — packages/core/src/signal/ 디렉토리에 프레임워크 비종속 독립 반응형 엔진을 구현한다. 기존 코드에 영향을 주지 않는 순수 추가 작업이다.

### Story 1.1: 반응형 타입 시스템 및 Link 자료구조 구현

As a 라이브러리 개발자,
I want ReactiveFlags, ReactiveNode, Link 타입과 Doubly Linked List 유틸리티를,
So that 시그널 엔진의 핵심 자료구조 기반이 확립된다.

**Acceptance Criteria:**

**Given** signal/types.ts 파일이 생성됨
**When** ReactiveFlags const enum이 정의됨
**Then** Dirty(1<<0), Pending(1<<1), Mutable(1<<2), Watching(1<<3) 플래그가 비트 연산으로 동작한다
**And** ReactiveNode, Link 인터페이스가 Doubly Linked List 구조를 정의한다

**Given** signal/link.ts 파일이 생성됨
**When** linkDep(dep, sub) 함수가 호출됨
**Then** dep.subs와 sub.deps에 양방향으로 Link 노드가 추가된다
**And** unlinkDep(link) 함수가 양방향 연결을 정확히 해제한다

**Given** 단위 테스트가 작성됨
**When** Link 노드 추가/제거를 반복 실행
**Then** 메모리 누수 없이 양방향 리스트가 정확히 유지된다

### Story 1.2: propagate/checkDirty 비재귀적 전파 루프 구현

As a 라이브러리 개발자,
I want 비재귀적 propagate()와 checkDirty() 루프를,
So that 깊은 의존성 체인에서도 스택 오버플로우 없이 변경이 전파된다.

**Acceptance Criteria:**

**Given** signal/propagate.ts 파일이 생성됨
**When** signal 값이 변경되어 propagate()가 호출됨
**Then** 모든 구독자에게 Dirty/Pending 플래그가 비재귀적 루프로 전파된다
**And** 재귀 호출이 아닌 while 루프로 구현된다

**Given** checkDirty(node) 함수가 호출됨
**When** 의존성 체인을 역추적하여 실제 변경 여부를 확인
**Then** Pending 상태 노드가 실제로 Dirty인지 pull 방식으로 검증한다

**Given** 100 depth 의존성 체인 테스트
**When** 루트 signal이 변경됨
**Then** 스택 오버플로우 없이 모든 하위 노드에 전파 완료된다

### Story 1.3: Diamond Problem 해결 및 Computed 핵심 로직

As a 라이브러리 개발자,
I want Diamond 의존성 패턴에서 중복 계산을 방지하는 Computed 핵심 로직을,
So that A→B,C→D 패턴에서 D가 정확히 1번만 재계산된다.

**Acceptance Criteria:**

**Given** A(signal) → B(computed), C(computed) → D(computed) 패턴
**When** A의 값이 변경됨
**Then** D는 정확히 1번만 재계산된다 (중복 계산 없음)
**And** B, C의 값이 실제로 변경된 경우에만 D가 재계산된다

**Given** Pending 플래그가 설정된 노드
**When** checkDirty()로 실제 변경 여부를 확인
**Then** 의존성이 실제로 변경되지 않았으면 재계산을 건너뛴다

**Given** diamond.test.ts 테스트
**When** 다양한 Diamond 패턴 (단순, 중첩, 다중) 실행
**Then** 모든 패턴에서 최소 계산으로 정확한 값이 도출된다

### Story 1.4: ReactiveState (signal) 구현

As a 라이브러리 개발자,
I want TC39 Signal.State 호환 ReactiveState를,
So that 쓰기 가능한 반응형 값을 생성하고 구독할 수 있다.

**Acceptance Criteria:**

**Given** system.signal(initialValue, options?) 호출
**When** ReactiveState가 생성됨
**Then** get()으로 현재 값을 읽을 수 있다
**And** set(newValue)으로 값을 변경할 수 있다
**And** Mutable 플래그가 설정되어 있다

**Given** signal에 options.equals가 제공됨
**When** set()으로 값을 변경
**Then** equals 함수로 비교하여 동일하면 전파하지 않는다
**And** options가 없으면 Object.is()로 비교한다

**Given** signal에 구독자가 등록됨
**When** set()으로 값이 변경됨
**Then** propagate()를 통해 구독자에게 동기적으로 알림이 전달된다

### Story 1.5: ReactiveEffect 및 createReactiveSystem 팩토리 구현

As a 라이브러리 개발자,
I want effect()와 createReactiveSystem() 팩토리를,
So that 완전한 반응형 시스템을 인스턴스별로 독립 생성할 수 있다.

**Acceptance Criteria:**

**Given** system.effect(fn) 호출
**When** fn 내부에서 signal/computed 값을 읽음
**Then** 자동으로 의존성이 추적된다
**And** 의존성이 변경되면 fn이 동기적으로 재실행된다

**Given** createReactiveSystem() 호출
**When** 독립적인 시그널 시스템 인스턴스가 반환됨
**Then** signal(), computed(), effect(), batch() 메서드를 포함한다
**And** 다른 인스턴스와 상태가 완전히 격리된다

**Given** 두 개의 독립 시스템 인스턴스
**When** 인스턴스 A의 signal을 변경
**Then** 인스턴스 B의 computed/effect에 영향이 없다

**Given** system.batch(fn) 호출
**When** fn 내에서 여러 signal을 변경
**Then** fn 완료 후 한 번만 전파가 실행된다

---

## Epic 2: 스토어 계층 시그널 전환

Layer 2 교체 — 기존 AtomStore, DerivedAtomStore, ContextQueryStore의 내부 구현을 시그널 엔진으로 교체하되, 외부 public API는 100% 동일하게 유지한다.

### Story 2.1: AtomStore를 SignalState 래퍼로 교체

As a 라이브러리 사용자,
I want AtomStore의 내부가 시그널 엔진으로 교체되어도 기존 API가 동일하게 동작하길,
So that 코드 변경 없이 성능이 향상된다.

**Acceptance Criteria:**

**Given** AtomStore 클래스가 내부적으로 ReactiveState를 사용하도록 교체
**When** getValue(), setValue(), subscribe(), reset(), getSubscriberCount() 호출
**Then** 기존과 동일한 결과를 반환한다

**Given** AtomStore에 equalityFn이 제공됨
**When** SignalOptions.equals로 전달
**Then** 커스텀 동등성 비교가 정상 동작한다

**Given** 기존 AtomStore 테스트가 존재할 때
**When** 내부 교체 후 동일 테스트 실행
**Then** 모든 테스트가 통과한다

### Story 2.2: DerivedAtomStore를 SignalComputed 래퍼로 교체

As a 라이브러리 사용자,
I want DerivedAtomStore의 내부가 시그널 엔진으로 교체되어도 파생 atom이 동일하게 동작하길,
So that derived() API가 기존과 동일하게 의존성을 추적하고 값을 재계산한다.

**Acceptance Criteria:**

**Given** DerivedAtomStore가 내부적으로 ReactiveComputed를 사용
**When** getValue(), subscribe(), getError(), getDependencyKeys() 호출
**Then** 기존과 동일한 결과를 반환한다

**Given** derived atom의 의존성이 변경됨
**When** 구독자가 값을 읽음
**Then** lazy 평가로 재계산이 수행되고 정확한 값이 반환된다

**Given** derived atom 계산 중 에러 발생
**When** getError()를 호출
**Then** 에러 객체가 반환되고, onError 콜백이 호출된다

### Story 2.3: ContextQueryStore 통합 및 외부 API 호환 검증

As a 라이브러리 사용자,
I want ContextQueryStore가 시그널 기반 AtomStore/DerivedAtomStore 위에서 동일하게 동작하길,
So that createContextQuery()와 10개 훅이 코드 변경 없이 정상 동작한다.

**Acceptance Criteria:**

**Given** ContextQueryStore가 시그널 기반 AtomStore/DerivedAtomStore를 사용
**When** getAtomValue, setAtomValue, resetAtom, subscribeToAtom, getSnapshot, patch, subscribe 호출
**Then** 모든 public API가 기존과 동일하게 동작한다

**Given** React 컴포넌트에서 useSyncExternalStore를 통해 구독
**When** atom 값이 변경됨
**Then** 해당 atom을 구독하는 컴포넌트만 리렌더링된다 (granular re-rendering)

**Given** ContextQueryStore.getDebugInfo()와 getDependencyGraph() 호출
**When** 시그널 기반 내부 구조
**Then** 기존과 동일한 디버그 정보가 반환된다

**Given** 다중 Provider 인스턴스 (각각 독립 createReactiveSystem)
**When** 인스턴스 A의 atom을 변경
**Then** 인스턴스 B에 영향이 없다

---

## Epic 3: 성능 검증 및 벤치마크

시그널 전환의 성능 향상을 정량적으로 검증하고, 번들 크기 제약 준수를 확인한다.

### Story 3.1: Vitest bench 시그널 엔진 벤치마크 구축

As a 라이브러리 개발자,
I want 시그널 엔진의 핵심 연산을 벤치마크하는 테스트 스위트를,
So that 성능을 정량적으로 측정하고 회귀를 방지할 수 있다.

**Acceptance Criteria:**

**Given** benchmarks/signal-engine.bench.ts 파일이 생성됨
**When** `vitest bench` 명령 실행
**Then** 다음 5개 벤치마크가 수행된다:
**And** 1K signal 읽기, Signal write + propagation, Diamond dependency (A→B,C→D), Deep chain propagation (100 depth), Subscribe/unsubscribe cycle

**Given** 벤치마크 결과
**When** 각 시나리오의 ops/sec이 측정됨
**Then** 결과가 콘솔에 표 형식으로 출력된다

### Story 3.2: 스토어 레벨 성능 벤치마크 및 Before/After 비교

As a 라이브러리 개발자,
I want 스토어 레벨 작업의 Before/After 성능을 비교하는 벤치마크를,
So that 시그널 전환으로 인한 실제 성능 향상을 수치로 증명할 수 있다.

**Acceptance Criteria:**

**Given** benchmarks/store-operations.bench.ts 파일이 생성됨
**When** ContextQueryStore의 주요 작업을 벤치마크
**Then** atom 값 읽기/쓰기, derived atom 재계산, snapshot 생성, patch 일괄 업데이트, subscribe/unsubscribe가 측정된다

**Given** KPI 목표
**When** 벤치마크 결과 확인
**Then** Signal write + propagation ≥ 2x 향상, Diamond ≥ 3x, Deep chain ≥ 5x

### Story 3.3: 번들 크기 검증

As a 라이브러리 사용자,
I want 시그널 엔진 추가 후에도 번들 크기가 제약 내에 유지되길,
So that 경량 라이브러리의 가치가 유지된다.

**Acceptance Criteria:**

**Given** core 패키지 빌드 완료
**When** gzip 크기를 측정
**Then** core < 2KB (gzip)

**Given** react 패키지 빌드 완료
**When** gzip 크기를 측정
**Then** react < 3KB (gzip)

**Given** signal/ 디렉토리가 tree-shaking 가능
**When** 사용하지 않는 signal 코드가 있을 때
**Then** 최종 번들에서 제외된다

---

## Epic 4: 테스트 커버리지 및 문서화

종합 테스트 스위트를 완성하고, playground에서 시그널 엔진의 기능과 성능을 시연한다.

### Story 4.1: 통합 테스트 스위트 완성

As a 라이브러리 개발자,
I want core 패키지의 테스트 커버리지가 90% 이상이길,
So that 시그널 엔진의 안정성이 보증된다.

**Acceptance Criteria:**

**Given** 모든 signal/ 단위 테스트 + 스토어 통합 테스트 작성
**When** `vitest --coverage` 실행
**Then** core 패키지 line coverage ≥ 90%

**Given** 엣지 케이스 테스트
**When** 순환 의존성, 대량 구독자, 동시 변경 등 시나리오 실행
**Then** 모든 엣지 케이스에서 예상대로 동작한다

**Given** 기존 통합 테스트
**When** 시그널 전환 후 실행
**Then** 모든 기존 테스트가 통과한다

### Story 4.2: Playground 업데이트 및 시그널 데모

As a 라이브러리 사용자,
I want playground에서 시그널 엔진의 성능 향상을 시각적으로 확인하길,
So that 시그널 전환의 가치를 직관적으로 이해할 수 있다.

**Acceptance Criteria:**

**Given** playground 앱에 성능 비교 탭 추가
**When** 사용자가 성능 탭을 선택
**Then** 시그널 엔진의 반응 속도가 시각적으로 표시된다

**Given** 기존 playground 데모 (atom, derived, selector 등)
**When** 시그널 전환 후 실행
**Then** 모든 기존 데모가 정상 동작한다

**Given** Diamond dependency 시각화 데모
**When** 사용자가 signal 값을 변경
**Then** 의존성 그래프와 재계산 횟수가 표시된다
