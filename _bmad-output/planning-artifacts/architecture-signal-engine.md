---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-02-14'
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-context-query-2026-02-13.md'
  - '_bmad-output/planning-artifacts/research/technical-tc39-signals-research-2026-02-14.md'
  - '_bmad-output/planning-artifacts/architecture-derived-atoms.md'
  - '_bmad-output/project-context.md'
workflowType: 'architecture'
project_name: 'context-query'
user_name: 'load28'
date: '2026-02-14'
lastStep: 1
---

# Architecture Decision Document: Signal Engine

_이 문서는 단계별 협업 발견 과정을 통해 작성됩니다. 각 섹션은 아키텍처 결정을 함께 작업하면서 추가됩니다._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- FR1: Alien Signals 참조 Push-Pull Hybrid 반응형 엔진 자체 구현
- FR2: TC39 Signals 표준 호환 API 구조 (Signal.State → atom, Signal.Computed → derived)
- FR3: Doubly Linked List 기반 의존성 추적 (현재 Set 기반 교체)
- FR4: ReactiveFlags 비트 연산 상태 관리
- FR5: 비재귀적 propagate/checkDirty 루프
- FR6: Diamond Problem 자동 해결
- FR7: 기존 외부 API 100% 하위 호환 (createContextQuery, 10개 훅)

**Non-Functional Requirements:**
- NFR1: 성능 2-5x 향상 (Vitest bench 정량 검증)
- NFR2: 번들 크기 — core < 2KB, react < 3KB (gzip)
- NFR3: React 18/19 Concurrent Mode, Strict Mode, SSR 호환
- NFR4: Zero Dependencies 유지 (core 패키지)
- NFR5: 테스트 커버리지 core 90%+, react 85%+

**Scale & Complexity:**
- Primary domain: 프론트엔드 라이브러리 (React 상태 관리)
- Complexity level: High — 반응형 엔진 자체 구현 + 비파괴적 마이그레이션
- Estimated architectural components: 3계층 (Reactive Engine, Store API, React Adapter)

### Technical Constraints & Dependencies

| 제약 | 상세 |
|------|------|
| Zero Dependencies | core 패키지에 npm 외부 의존성 절대 금지. Alien Signals 알고리즘 자체 구현 |
| 외부 API 동결 | createContextQuery(), 10개 훅 인터페이스 변경 불가 |
| useSyncExternalStore | React 통합의 유일한 안전 경로 (Concurrent Mode tearing 방지) |
| Object.is() | 기본 동등성 비교. === 사용 금지 |
| Factory Hook 패턴 | create* 팩토리 → use* 훅 패턴 유지 |
| 모노레포 빌드 순서 | core → react → playground (dependsOn: ["^build"]) |
| TypeScript strict | strict: true, target: ESNext, module: ESNext |

### Cross-Cutting Concerns

1. **성능 벤치마킹 파이프라인**: 모든 변경에 대해 Vitest bench로 회귀 방지
2. **TypeScript 제네릭 타입 추론**: 시그널 엔진 도입 후에도 TAtoms 제네릭 추론 완전 보존
3. **에러 전파**: DerivedAtomStore의 에러 핸들링 패턴을 시그널 엔진에서도 유지
4. **디버깅 지원**: getDebugInfo(), getDependencyGraph() API 호환성 유지
5. **비파괴적 마이그레이션**: 외부 인터페이스 유지하며 내부 구현만 교체

## Existing Technology Stack Analysis

### Current Stack (Preserved)

| 기술 | 버전 | 용도 |
|------|------|------|
| TypeScript | 5.8.2 | strict mode, ESNext target |
| React | ^18.0.0 \|\| ^19.0.0 | peerDependency |
| Vitest | ^4.0.18 | 테스트 + bench API |
| Rollup | ^4.35.0 | ESM + CJS dual output |
| pnpm | 9.0.0 | workspace 매니저 |
| Turbo | ^2.4.4 | 모노레포 빌드 |

### Architecture Migration Targets

| 현재 구현 | 역할 | 시그널 전환 후 |
|-----------|------|---------------|
| AtomStore\<T\> | Set 기반 리스너, Object.is 비교 | → SignalState 래퍼 |
| DerivedAtomStore\<T\> | dirty flag + Set 리스너, lazy 평가 | → SignalComputed 래퍼 |
| ContextQueryStore\<TAtoms\> | Map 기반 오케스트레이션 | → 시그널 엔진 위에 동일 API |
| Set\<AtomListener\> | 구독자 관리 | → Doubly Linked List |

### Preserved Decisions

- 빌드 출력: ESM + CJS + Types + Sourcemap
- 파일 네이밍: camelCase.ts / camelCase.tsx
- 코어: Class 기반, React: Factory Function + Hook
- 외부 의존성 추가 없음 (Zero Dependencies)

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (구현 차단):**
1. 반응형 엔진 알고리즘: Push-Pull Hybrid (Alien Signals 참조)
2. 계층 아키텍처: 3계층 분리 (Reactive Engine / Store API / React Adapter)
3. 시그널 엔진 API: createReactiveSystem() 팩토리 + 클로저 패턴
4. ReactiveNode 인터페이스: 비트 플래그 + Doubly Linked List

**Important Decisions (아키텍처 형성):**
5. 마이그레이션 전략: 비파괴적 4단계
6. 성능 검증 전략: Vitest bench 정량 측정

### Decision 1: 반응형 엔진 알고리즘

**결정**: Push-Pull Hybrid (Alien Signals 참조)

| 항목 | 결정 |
|------|------|
| 알고리즘 | Push-Pull Hybrid — 변경 시 Dirty 플래그를 push 전파, 읽기 시 pull로 실제 재계산 |
| 자료구조 | Doubly Linked List (Link 노드) — O(1) 추가/제거, 메모리 효율적 |
| 상태 관리 | ReactiveFlags 비트 연산 — Dirty, Pending, Mutable, Watching 등 |
| 전파 방식 | 비재귀적 루프 — 스택 오버플로우 방지, 깊은 의존성 체인 안전 |
| 동등성 비교 | Object.is() 기본, SignalOptions.equals로 커스텀 가능 |

**근거**: js-reactivity-benchmark 1위, Vue 3.6 검증 완료. Diamond Problem을 Pending 플래그로 자동 해결.

### Decision 2: 계층 아키텍처

**결정**: 3계층 분리

```
Layer 1: Reactive Engine (packages/core/src/signal/)
  - 프레임워크 비종속, 순수 TypeScript
  - createReactiveSystem() 팩토리
  - Signal, Computed, Effect 프리미티브

Layer 2: Store API (packages/core/src/)
  - AtomStore → SignalState 래퍼
  - DerivedAtomStore → SignalComputed 래퍼
  - ContextQueryStore → 동일 public API, 내부만 교체

Layer 3: React Adapter (packages/react/src/)
  - 변경 없음 — useSyncExternalStore 유지
  - Factory Hook 패턴 유지
```

**근거**: Layer 1 분리로 향후 다른 프레임워크 어댑터 확장 가능. 계층별 독립 테스트 가능.

### Decision 3: 시그널 엔진 API 설계

**결정**: `createReactiveSystem()` 팩토리 + 클로저 패턴

```typescript
export function createReactiveSystem() {
  return {
    signal<T>(initialValue: T, options?: SignalOptions<T>): ReactiveState<T>,
    computed<T>(fn: () => T, options?: SignalOptions<T>): ReactiveComputed<T>,
    effect(fn: () => void): ReactiveEffect,
    batch(fn: () => void): void,
  };
}
```

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| 모듈 스코프 전역 | 간단 | 테스트 격리 불가, Provider 다중 인스턴스 충돌 | ❌ |
| 클래스 기반 | 명확한 캡슐화 | Alien Signals와 패턴 불일치, 오버헤드 | ❌ |
| 팩토리 + 클로저 | 테스트 격리, 다중 인스턴스 안전, 경량 | 구현 복잡도 약간 증가 | ✅ |

**근거**: context-query의 "컴포넌트 트리 스코핑"에서 각 ContextQueryStore가 독립된 시그널 시스템을 가져야 함.

### Decision 4: ReactiveNode 인터페이스

**결정**: 비트 플래그 + Doubly Linked List

```typescript
const enum ReactiveFlags {
  None      = 0,
  Dirty     = 1 << 0,  // 값 변경 → 재계산 필요
  Pending   = 1 << 1,  // 의존성 중 하나가 Dirty (Diamond Problem 해결)
  Mutable   = 1 << 2,  // 쓰기 가능 Signal (State vs Computed 구분)
  Watching  = 1 << 3,  // 활성 구독자 존재
}

interface Link {
  dep: ReactiveNode;
  sub: ReactiveNode;
  prevDep: Link | null;
  nextDep: Link | null;
  prevSub: Link | null;
  nextSub: Link | null;
}

interface ReactiveNode {
  flags: ReactiveFlags;
  deps: Link | null;
  subs: Link | null;
}
```

**근거**: O(1) 상태 체크 (비트 연산), O(1) 구독 관리 (Linked List), GC 압력 감소.

### Decision 5: 마이그레이션 전략

**결정**: 비파괴적 4단계

| Phase | 작업 | 외부 API 영향 |
|-------|------|--------------|
| Phase 1 | signal/ 디렉토리에 순수 반응형 엔진 구현 + 단위 테스트 | 없음 |
| Phase 2 | AtomStore를 SignalState 래퍼로 교체 | 없음 (동일 인터페이스) |
| Phase 3 | DerivedAtomStore를 SignalComputed 래퍼로 교체 | 없음 (동일 인터페이스) |
| Phase 4 | ContextQueryStore 내부 배선 교체 + 통합 테스트 + 벤치마크 | 없음 |

**핵심 원칙**: 각 Phase 독립 배포 가능. 문제 시 이전 Phase로 롤백 가능.

### Decision 6: 성능 검증 전략

**결정**: Vitest bench API 정량 측정

| 벤치마크 | KPI 목표 |
|----------|----------|
| 1K signal 읽기 | ≥ 동등 |
| Signal write + propagation | ≥ 2x 향상 |
| Diamond dependency (A→B,C→D) | ≥ 3x 향상 |
| Deep chain (100 depth) | ≥ 5x 향상 |
| Subscribe/unsubscribe cycle | ≥ 동등 |

### Decision Impact Analysis

**구현 순서:**
1. signal/ 반응형 엔진 (Layer 1) — 독립적, 선행 의존성 없음
2. AtomStore 래퍼 교체 (Layer 2a) — Layer 1 완료 후
3. DerivedAtomStore 래퍼 교체 (Layer 2b) — Layer 1 완료 후
4. ContextQueryStore 통합 (Layer 2c) — 2a, 2b 완료 후
5. 벤치마크 + 회귀 테스트 — 4 완료 후
6. Playground 업데이트 — 5 완료 후

**교차 컴포넌트 의존성:**
- Layer 1: 완전 독립 (의존성 없음)
- Layer 2: Layer 1의 createReactiveSystem()에만 의존
- Layer 3 (React): Layer 2의 public API에만 의존 (변경 없음)

## Implementation Patterns & Consistency Rules

### Naming Patterns

**signal/ 디렉토리 코드 네이밍:**

| 영역 | 규칙 | 예시 |
|------|------|------|
| 파일명 | camelCase.ts | system.ts, reactiveNode.ts, propagate.ts |
| 타입/인터페이스 | PascalCase | ReactiveNode, ReactiveState, Link |
| const enum | PascalCase | ReactiveFlags |
| 팩토리 함수 | create* | createReactiveSystem() |
| 내부 함수 | camelCase | propagate(), checkDirty(), linkDep() |
| 비트 플래그 값 | PascalCase | Dirty, Pending, Mutable, Watching |

**래퍼 클래스 네이밍 (변경 없음):**

| 현재 | 유지 | 내부 변경 |
|------|------|-----------|
| AtomStore\<T\> | 클래스명 유지 | 내부에서 system.signal() 사용 |
| DerivedAtomStore\<T\> | 클래스명 유지 | 내부에서 system.computed() 사용 |
| ContextQueryStore\<TAtoms\> | 클래스명 유지 | 내부 배선만 교체 |

### Structure Patterns

**signal/ 디렉토리 구조:**

```
packages/core/src/signal/
├── index.ts           # public export (createReactiveSystem만)
├── system.ts          # createReactiveSystem() 팩토리
├── types.ts           # ReactiveNode, Link, ReactiveFlags, SignalOptions
├── state.ts           # signal() 구현 (ReactiveState)
├── computed.ts        # computed() 구현 (ReactiveComputed)
├── effect.ts          # effect() 구현 (ReactiveEffect)
├── propagate.ts       # propagate(), checkDirty() 루프
└── link.ts            # Link 노드 생성/해제 유틸리티
```

**테스트 구조:**

```
packages/core/src/__tests__/signal/
├── state.test.ts        # signal() 단위 테스트
├── computed.test.ts     # computed() 단위 테스트
├── effect.test.ts       # effect() 단위 테스트
├── propagation.test.ts  # push-pull 전파 테스트
├── diamond.test.ts      # diamond problem 테스트
└── batch.test.ts        # batch() 테스트

packages/core/src/__tests__/
├── atomStore.test.ts        # 래퍼 통합 테스트
├── derivedAtomStore.test.ts # 래퍼 통합 테스트
└── contextQueryStore.test.ts # 전체 통합 테스트

packages/core/benchmarks/
├── signal-engine.bench.ts   # 시그널 엔진 벤치마크
└── store-operations.bench.ts # 스토어 작업 벤치마크
```

### Code Patterns

**비트 플래그 조작:**

```typescript
// ✅ 올바른 패턴
node.flags |= ReactiveFlags.Dirty;           // 설정
node.flags &= ~ReactiveFlags.Dirty;          // 해제
const isDirty = (node.flags & ReactiveFlags.Dirty) !== 0;  // 체크

// ❌ 금지
node.flags = ReactiveFlags.Dirty;            // 다른 플래그 소실
if (node.flags === ReactiveFlags.Dirty)      // 복합 플래그 무시
```

**Link 노드 — 항상 양방향 연결:**

```typescript
function linkDep(dep: ReactiveNode, sub: ReactiveNode): Link {
  const link: Link = { dep, sub, prevDep: null, nextDep: null, prevSub: null, nextSub: null };
  if (dep.subs) { dep.subs.prevSub = link; }
  link.nextSub = dep.subs;
  dep.subs = link;
  if (sub.deps) { sub.deps.prevDep = link; }
  link.nextDep = sub.deps;
  sub.deps = link;
  return link;
}
```

**에러 핸들링 — 기존 패턴 유지:**

```typescript
try {
  value = fn();
  node.error = null;
} catch (e) {
  node.error = e instanceof Error ? e : new Error(String(e));
  if (onError) onError(node.error);
}
```

**동등성 비교:**

```typescript
// ✅ Object.is() 또는 커스텀 equalityFn
const equals = options?.equals ?? Object.is;
if (equals(oldValue, newValue)) return;

// ❌ 금지
if (oldValue === newValue) return;
```

### Process Patterns

**구독 알림**: 동기적만 허용 (queueMicrotask 금지). useSyncExternalStore 호환.

**테스트 격리**: 항상 createReactiveSystem()으로 독립 인스턴스 생성.

### Enforcement Guidelines

**모든 AI 에이전트 필수 준수:**
1. signal/ 내부 코드는 외부 의존성 없이 순수 TypeScript만 사용
2. 비트 연산은 항상 `|=`, `&= ~`, `& !== 0` 패턴
3. Link 노드는 항상 양방향 연결/해제
4. 동등성 비교는 Object.is() 또는 커스텀 equalityFn만
5. 테스트는 항상 격리된 시스템 인스턴스 생성
6. 구독 알림은 항상 동기적
7. propagate/checkDirty는 반드시 비재귀적 루프

## Project Structure & Boundaries

### Complete Project Directory Structure

```
packages/core/
├── src/
│   ├── signal/                    # 🆕 Layer 1: Reactive Engine
│   │   ├── index.ts               #   public export
│   │   ├── types.ts               #   ReactiveNode, Link, ReactiveFlags, SignalOptions
│   │   ├── system.ts              #   createReactiveSystem() 팩토리
│   │   ├── state.ts               #   signal() — ReactiveState 구현
│   │   ├── computed.ts            #   computed() — ReactiveComputed 구현
│   │   ├── effect.ts              #   effect() — ReactiveEffect 구현
│   │   ├── propagate.ts           #   propagate(), checkDirty() 비재귀 루프
│   │   └── link.ts                #   Link 노드 생성/해제 유틸리티
│   │
│   ├── atomStore.ts               # ♻️ Layer 2: SignalState 래퍼로 내부 교체
│   ├── derivedAtomStore.ts        # ♻️ Layer 2: SignalComputed 래퍼로 내부 교체
│   ├── contextQueryStore.ts       # ♻️ Layer 2: 시그널 엔진 위에 동일 API
│   ├── atom.ts                    # 유지 (atom() 팩토리)
│   ├── derived.ts                 # 유지 (derived() 팩토리)
│   ├── shallowEqual.ts            # 유지
│   ├── types.ts                   # 유지 (공개 타입)
│   └── index.ts                   # 유지 + signal/ re-export 추가
│
├── __tests__/
│   ├── signal/                    # 🆕 Layer 1 단위 테스트
│   │   ├── state.test.ts
│   │   ├── computed.test.ts
│   │   ├── effect.test.ts
│   │   ├── propagation.test.ts
│   │   ├── diamond.test.ts
│   │   └── batch.test.ts
│   ├── atomStore.test.ts          # 🆕 래퍼 통합 테스트
│   ├── derivedAtomStore.test.ts
│   └── contextQueryStore.test.ts
│
├── benchmarks/                    # 🆕 성능 벤치마크
│   ├── signal-engine.bench.ts
│   └── store-operations.bench.ts
│
├── package.json
├── tsconfig.json
└── rollup.config.mjs

packages/react/                    # 변경 없음
├── src/
│   ├── hooks/
│   ├── createProvider.tsx
│   └── index.ts
└── ...

packages/playground/               # 성능 비교 탭 추가만
└── src/...
```

### Architectural Boundaries

**Layer 의존성 규칙:**

```
Layer 3: React Adapter (packages/react/)
  ↓ 의존: Layer 2 public API만
Layer 2: Store API (packages/core/src/*.ts)
  ↓ 의존: Layer 1 createReactiveSystem()만
Layer 1: Reactive Engine (core/src/signal/)
  ↓ 의존: 없음 (완전 독립)
```

**경계 규칙:**
- Layer 1은 Layer 2, 3을 절대 import하지 않음
- Layer 2는 Layer 1의 signal/index.ts만 import (내부 파일 직접 import 금지)
- Layer 3는 Layer 2의 public API만 사용 (변경 없음)
- signal/index.ts는 createReactiveSystem과 타입만 export

### Requirements to Structure Mapping

| 요구사항 | 파일 위치 |
|----------|----------|
| FR1: Push-Pull Hybrid 엔진 | signal/propagate.ts, signal/system.ts |
| FR2: TC39 호환 API | signal/state.ts, signal/computed.ts |
| FR3: Doubly Linked List | signal/link.ts, signal/types.ts |
| FR4: ReactiveFlags | signal/types.ts |
| FR5: 비재귀적 루프 | signal/propagate.ts |
| FR6: Diamond Problem | signal/propagate.ts (checkDirty) |
| FR7: 외부 API 호환 | atomStore.ts, derivedAtomStore.ts, contextQueryStore.ts |
| NFR1: 성능 벤치마크 | benchmarks/*.bench.ts |
| NFR5: 테스트 커버리지 | __tests__/signal/*, __tests__/*.test.ts |

### Data Flow

```
사용자 액션 (React 컴포넌트)
  → useContextSetAtom / usePatch
    → ContextQueryStore.setAtomValue()
      → AtomStore.setValue()
        → ReactiveState.set()              ← Layer 1 진입
          → propagate() (Dirty 플래그 push)
            → Computed에 Pending 설정
              → Effect에 Dirty 설정
                → Effect 실행 → 리스너 알림  ← Layer 1 탈출
                  → useSyncExternalStore 감지
                    → React 리렌더링
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Push-Pull Hybrid ↔ 팩토리 패턴 → 호환 (클로저 내부 알고리즘 상태 관리)
- Doubly Linked List ↔ 동기적 알림 → 호환 (링크 순회 즉시 알림)
- ReactiveFlags ↔ TypeScript strict → 호환 (const enum 컴파일 타임 인라인)
- Zero Dependencies ↔ 자체 구현 → 호환

**Pattern Consistency:**
- 네이밍 규칙 ↔ 기존 프로젝트 컨벤션 → 일치
- 에러 핸들링 ↔ 기존 DerivedAtomStore → 동일 패턴
- Object.is() ↔ 기존 AtomStore → 일치

**Structure Alignment:**
- 3계층 경계 ↔ signal/index.ts 단일 export → 정합
- 테스트 구조 ↔ 계층별 분리 → 독립 테스트 가능
- Rollup 빌드 ↔ signal/ 디렉토리 → 자동 번들링

### Requirements Coverage ✅

| 요구사항 | 아키텍처 지원 | 상태 |
|----------|-------------|------|
| FR1: Push-Pull Hybrid | signal/propagate.ts + system.ts | ✅ |
| FR2: TC39 호환 | signal/state.ts + computed.ts | ✅ |
| FR3: Doubly Linked List | signal/link.ts + types.ts | ✅ |
| FR4: ReactiveFlags | signal/types.ts | ✅ |
| FR5: 비재귀적 루프 | signal/propagate.ts | ✅ |
| FR6: Diamond Problem | signal/propagate.ts (checkDirty) | ✅ |
| FR7: 외부 API 호환 | Layer 2 래퍼 패턴 | ✅ |
| NFR1: 성능 2-5x | benchmarks/ + KPI 정의 | ✅ |
| NFR2: 번들 크기 | signal/ 경량 구현 + tree-shaking | ✅ |
| NFR3: React 호환 | useSyncExternalStore 유지 | ✅ |
| NFR4: Zero Dependencies | 자체 구현 | ✅ |
| NFR5: 테스트 커버리지 | __tests__/ 계층별 구조 | ✅ |

### Implementation Readiness ✅

- 6개 핵심 결정 + 코드 예시 + 근거 → 완전
- 전체 디렉토리 구조 (signal/ 8파일 + 테스트 + 벤치마크) → 완전
- 7개 강제 규칙 + Good/Bad 예시 → 완전

### Gap Analysis

**Critical:** 없음

**Important (향후 보완):**
- batch() 트랜잭션 경계 상세화
- effect() cleanup 패턴 (TC39 Signal.subtle.Watcher 대응)
- 메모리 누수 방지 전략 (Link 해제 vs WeakRef)

### Architecture Completeness Checklist

- [x] 프로젝트 컨텍스트 분석
- [x] 기존 기술 스택 분석
- [x] 핵심 아키텍처 결정 6개
- [x] 구현 패턴 및 일관성 규칙
- [x] 전체 프로젝트 구조
- [x] 계층 경계 및 데이터 흐름
- [x] 요구사항 → 구조 매핑
- [x] 일관성 / 커버리지 / 준비 상태 검증

### Readiness Assessment

**Status: READY FOR IMPLEMENTATION**
**Confidence: High**

**AI Agent Guidelines:**
- 이 문서의 모든 아키텍처 결정을 정확히 따를 것
- 구현 패턴을 모든 컴포넌트에서 일관되게 사용할 것
- 프로젝트 구조와 경계를 준수할 것
- 아키텍처 관련 질문은 이 문서를 참조할 것

**First Implementation Priority:**
1. packages/core/src/signal/ 디렉토리 생성
2. types.ts → link.ts → propagate.ts → state.ts → computed.ts → effect.ts → system.ts 순서
3. 각 파일마다 대응하는 단위 테스트 작성
