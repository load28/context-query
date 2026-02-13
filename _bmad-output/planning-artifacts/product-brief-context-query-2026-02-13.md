---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - '_bmad-output/project-context.md'
  - 'docs/GUIDE.ko.md'
  - 'README.md'
date: '2026-02-13'
author: 'load28'
---

# Product Brief: context-query

## Executive Summary

context-query는 React 애플리케이션을 위한 경량 상태 관리 라이브러리로, **컴포넌트 트리 스코핑**과 **구독 기반 선택적 리렌더링**을 결합한 고유한 접근 방식을 제공한다. 현재 v0.5.1에서 기본적인 atom 기반 상태 관리와 7개의 React 훅을 제공하지만, Jotai와 같은 성숙한 라이브러리 수준의 견고함에는 도달하지 못한 상태이다.

본 고도화 프로젝트의 목표는 context-query를 **Jotai 수준의 탄탄한 구성**을 갖춘 v1.0으로 발전시키는 것이다. 파생 atom, 테스트 스위트, 셀렉터, DevTools 통합, 에러 핸들링 등 핵심 기능을 추가하되, context-query만의 차별점인 **네이티브 컴포넌트 트리 스코핑**을 핵심 가치로 유지·강화한다.

---

## Core Vision

### Problem Statement

React 상태 관리 생태계에서 **컴포넌트 트리 범위의 로컬 상태 공유**는 여전히 해결되지 않은 영역이다:

- **Context API**: 트리 스코핑은 되지만 모든 하위 컴포넌트를 리렌더링
- **전역 상태 (Redux, Zustand, Jotai)**: 세밀한 구독은 되지만 컴포넌트 라이프사이클과 무관한 전역 상태
- **React Query**: 서버 상태에 최적화되어 클라이언트 로컬 상태에 부적합

context-query v0.5.1은 이 문제의 핵심을 해결했지만, 프로덕션 레벨의 채택을 위해 필요한 **견고함(robustness)**이 부족하다:

1. **파생 상태 없음**: 모든 atom이 독립적인 flat 값으로, 계산된 상태를 컴포넌트에서 수동으로 처리해야 함
2. **테스트 전무**: 단 하나의 테스트도 없어 안정성을 보장할 수 없음
3. **개발자 도구 없음**: DevTools 통합이 없어 디버깅이 어려움
4. **유틸리티 부재**: reset, selector, reducer 등 실무에 필수적인 패턴 미지원
5. **에러 핸들링 부재**: 프로덕션 환경에서의 오류 복구 메커니즘 없음

### Problem Impact

- 개발자가 context-query 채택을 고려할 때 **"프로덕션에서 쓸 수 있을까?"**라는 의문에 답할 수 없음
- Jotai/Zustand 대비 기능 부족으로 POC 단계를 넘어서기 어려움
- 테스트 부재로 인해 기여자(contributor) 유입이 어렵고, 회귀 버그 위험이 높음
- 파생 atom 없이는 복잡한 실무 시나리오를 커버할 수 없음

### Why Existing Solutions Fall Short

| 라이브러리 | 한계 |
|-----------|------|
| **Jotai** | 전역 atom이 기본. 트리 스코핑은 서드파티(`jotai-scope`) 필요. 스냅샷/일괄 업데이트 없음 |
| **Zustand** | 스토어가 컴포넌트 트리와 분리. 스코핑 개념 없음 |
| **Redux** | 과도한 보일러플레이트. 로컬 상태용으로 부적합 |
| **React Context** | 리렌더링 문제. 구독 기반 선택적 업데이트 불가 |
| **Recoil** | 유지보수 중단 상태. Meta 내부에서도 사용 감소 |

**context-query의 고유한 위치**: 컴포넌트 트리 스코핑 + 구독 기반 세밀한 리렌더링을 **네이티브로** 제공하는 유일한 라이브러리

### Proposed Solution

context-query를 3단계에 걸쳐 Jotai 수준의 탄탄한 라이브러리로 고도화한다:

**Phase 1 - Foundation (v0.6~v0.8)**: 핵심 기능 및 품질 기반
- 파생 atom (derived atoms) + 의존성 추적
- 셀렉터 (selectAtom) + 커스텀 동등성 함수
- Atom 리셋 (RESET 패턴)
- 종합 테스트 스위트 (Vitest + React Testing Library)
- React DevTools 통합 (`useDebugValue`)

**Phase 2 - Robustness (v0.9)**: 실무 패턴 지원
- `onMount`/`onUnmount` 라이프사이클
- 에러 핸들링 및 전파
- `atomWithReducer`, `atomWithStorage` 유틸리티
- `patch()` 함수 업데이터 지원
- SSR 문서화 및 지원
- TypeScript 유틸리티 타입

**Phase 3 - v1.0 Release**: 생태계 완성
- 종합 API 문서 사이트
- `splitAtom`, Atom Families
- 미들웨어/플러그인 아키텍처
- 성능 벤치마크 (vs Jotai, React Context)
- 마이그레이션 가이드

### Key Differentiators

1. **네이티브 트리 스코핑**: `createContextQuery()` 팩토리로 생성된 Provider가 상태의 범위를 자연스럽게 결정. Jotai의 `jotai-scope`보다 직관적이고 간결
2. **스냅샷/일괄 업데이트**: `useSnapshot()`, `usePatch()` — Jotai에 없는 고유 기능으로, 전체 상태의 원자적(atomic) 읽기/쓰기 제공
3. **Zero Dependencies**: core 패키지는 외부 의존성 없이 순수 TypeScript로 구현
4. **Factory Hook 패턴**: 타입 안전한 훅 번들을 한 번에 생성하여 라이브러리 제작자에게 최적
5. **스코프 내 파생 atom**: 같은 Provider 내 atom 간 의존성 추적 — 전역이 아닌 로컬 스코프에서의 계산된 상태 (Jotai 대비 더 직관적)

---

## Target Users

### Primary Persona: 실무 React 개발자 (Mid-to-Senior)

**프로필**
- 2~7년차 React 개발자
- TypeScript를 기본으로 사용
- Jotai, Zustand, Redux 중 하나 이상 경험
- 컴포넌트 설계와 상태 관리의 트레이드오프를 이해하는 수준

**핵심 과제 (Jobs-to-be-Done)**
1. **복합 UI 컴포넌트 내 상태 공유**: 모달, 폼, 위자드, 데이터 테이블 등 여러 하위 컴포넌트가 공유해야 하는 로컬 상태를 깔끔하게 관리하고 싶다
2. **리렌더링 최적화**: Context API의 전체 리렌더링 없이 필요한 컴포넌트만 업데이트하고 싶다
3. **전역 오염 방지**: 특정 기능 영역의 상태가 앱 전체에 노출되지 않도록 스코프를 제한하고 싶다
4. **보일러플레이트 최소화**: Redux처럼 action/reducer/selector를 매번 작성하지 않고 간결하게 상태를 다루고 싶다

**고통점 (Pain Points)**
- Context API를 쓰면 성능이 떨어지고, 전역 상태 라이브러리를 쓰면 스코핑이 안 됨
- Jotai의 `jotai-scope`를 발견해도 서드파티 의존성 추가와 설정 복잡도에 망설임
- 컴포넌트 라이브러리를 만들 때 내부 상태 관리 방법이 마땅히 없음
- 팀 내 상태 관리 컨벤션 통일이 어려움 (전역 vs 로컬의 기준이 모호)

**채택 기준 (Adoption Criteria)**
- TypeScript 타입 추론이 완벽하게 동작해야 함
- 번들 사이즈가 가볍고 의존성이 적어야 함
- 기존 프로젝트에 점진적 도입이 가능해야 함
- 테스트가 잘 갖춰져 있어 신뢰할 수 있어야 함
- 문서와 예제가 충분해야 함

### Secondary Persona: 컴포넌트 라이브러리 제작자

**프로필**
- 사내 디자인 시스템 또는 오픈소스 UI 라이브러리 개발자
- 재사용 가능한 복합 컴포넌트 (DataGrid, DateRangePicker, FormBuilder 등) 제작
- 소비자(consumer) 코드에 상태 관리 의존성을 강제하기 어려운 상황

**핵심 과제 (Jobs-to-be-Done)**
1. **캡슐화된 상태 관리**: 라이브러리 내부 상태가 소비자의 앱 상태와 충돌하지 않도록 완전히 격리하고 싶다
2. **다중 인스턴스 지원**: 같은 컴포넌트를 페이지에 여러 번 렌더링해도 각 인스턴스의 상태가 독립적이어야 한다
3. **경량 번들**: 라이브러리의 번들 사이즈를 최소화해야 한다
4. **타입 안전한 API**: 소비자에게 노출하는 API가 TypeScript로 완벽히 타입 추론되어야 한다

**고통점 (Pain Points)**
- Redux/Zustand를 라이브러리 내부에 쓰면 소비자의 스토어와 충돌 위험
- Context API를 쓰면 리렌더링 성능 문제
- `useRef` + `useState` 조합으로 수동 구현하면 보일러플레이트 폭증
- 다중 인스턴스에서 전역 상태가 공유되는 버그

**context-query 매력 포인트**
- `createContextQuery()` 팩토리가 라이브러리 내부용으로 완벽
- Provider 단위 격리로 다중 인스턴스 문제 해결
- Zero dependencies로 번들 사이즈 부담 없음

### Tertiary Persona: Jotai/Zustand에서 전환을 고려하는 개발자

**프로필**
- 현재 Jotai 또는 Zustand 사용 중
- 트리 스코핑이 필요한 시나리오에서 한계를 느낌
- 기존 라이브러리를 대체하기보다 **특정 영역에서 보완적으로** 사용하려는 의도

**핵심 과제 (Jobs-to-be-Done)**
1. **기존 전역 상태와 공존**: Jotai/Zustand의 전역 상태는 유지하면서 특정 UI 영역에만 context-query를 도입하고 싶다
2. **낮은 러닝 커브**: Jotai와 유사한 atom 모델이라 빠르게 적응하고 싶다
3. **점진적 마이그레이션**: 전체 교체가 아닌 부분 적용으로 리스크를 줄이고 싶다

**채택 결정 요인**
- Jotai와 API가 유사하면 전환 비용이 낮다고 판단
- 비교 문서 / 마이그레이션 가이드가 있으면 팀 설득에 유리
- 성능 벤치마크가 동등 이상이어야 채택 논의 가능

### User Journey Map (Primary Persona)

```
발견 → 평가 → 도입 → 심화 → 기여/추천

[발견]
  - npm trending, 기술 블로그, 팀원 추천으로 발견
  - "React 로컬 상태 관리" 검색에서 context-query 발견
  - README를 읽고 컴포넌트 트리 스코핑 콘셉트에 흥미

[평가]
  - GitHub stars, 다운로드 수, 최근 커밋 활동 확인
  - ⚠️ 테스트 커버리지, 문서 완성도로 신뢰도 판단
  - Playground에서 간단한 예제 실행
  - Jotai와의 비교 문서 확인 (현재 부재 → 개선 필요)

[도입]
  - 사이드 프로젝트에서 먼저 시도
  - 모달/폼 같은 작은 단위에 적용
  - ⚠️ 파생 atom이 없으면 여기서 한계를 느낌 (현재 상태)

[심화]
  - 프로덕션 프로젝트에 부분 적용
  - 스냅샷/패치 기능 활용
  - DevTools로 디버깅 (현재 미지원 → 개선 필요)

[기여/추천]
  - 팀 내 다른 프로젝트에 전파
  - GitHub issue/PR 참여
  - 블로그 포스트 작성
```

---

## Success Metrics

### Phase 1 완료 기준 (v0.6~v0.8)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 테스트 커버리지 | core 90%+, react 85%+ | Vitest coverage report |
| 핵심 기능 완성 | 파생 atom, 셀렉터, 리셋, DevTools | 기능별 통합 테스트 통과 |
| 번들 사이즈 | core < 2KB, react < 3KB (gzip) | `size-limit` CI 검증 |
| TypeScript 타입 추론 | 모든 public API에서 타입 자동 추론 | 타입 레벨 테스트 (`expectTypeOf`) |
| 성능 회귀 없음 | v0.5.1 대비 동등 이상 | 구독/업데이트 벤치마크 |

### Phase 2 완료 기준 (v0.9)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 유틸리티 API 완성 | reducer, storage, lifecycle | 각 유틸리티 단위/통합 테스트 |
| SSR 호환성 | Next.js App Router에서 정상 동작 | Next.js 통합 테스트 |
| 에러 복구 | Provider 내 에러 격리 및 전파 | 에러 시나리오 테스트 |
| 문서 커버리지 | 모든 public API에 JSDoc + 예제 | TSDoc 누락 검사 자동화 |

### Phase 3 완료 기준 (v1.0)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| API 안정성 | Breaking change 없이 6개월 유지 | Semver 준수, changelog |
| 문서 사이트 | API 레퍼런스 + 5개 이상 가이드 | 문서 사이트 배포 |
| 생태계 기반 | splitAtom, atomFamily, 미들웨어 | 기능별 테스트 통과 |
| 벤치마크 공개 | Jotai/Context API 대비 비교표 | 자동화된 벤치마크 스크립트 |

### 궁극적 품질 목표 (Jotai 수준의 탄탄함)

- **신뢰도**: 모든 코드 경로에 대한 테스트 존재. CI에서 매 PR마다 검증
- **타입 안전성**: `any` 사용 제로. 모든 API가 제네릭으로 추론 가능
- **개발자 경험**: DevTools에서 atom 상태 실시간 확인, 의미 있는 에러 메시지
- **성능**: 불필요한 리렌더링 제로. Object.is 또는 커스텀 동등성으로 정밀 비교
- **호환성**: React 18+ Concurrent Mode, Strict Mode, SSR 모두 정상 동작

---

## Scope Definition

### In Scope (v1.0까지)

**Core 패키지 (`@context-query/core`)**

| 기능 | 설명 | Phase |
|------|------|-------|
| 파생 atom (Derived Atoms) | `get` 접근자를 통한 의존성 추적 기반 계산된 atom. 스코프 내 atom 간 자동 재계산 | 1 |
| 커스텀 동등성 함수 | `AtomStore` 생성 시 `equalityFn` 옵션. 기본값 `Object.is`, shallow/deep 지원 | 1 |
| Atom 리셋 | `RESET` 심볼 + `store.reset(key)` API. 초기값으로 되돌리기 | 1 |
| `onMount`/`onUnmount` 라이프사이클 | 첫 구독자 등록/마지막 구독자 해제 시 콜백 실행 | 2 |
| 에러 핸들링 | atom 업데이트 중 발생한 에러 캡처 및 전파. 에러 상태 atom | 2 |
| `patch()` 함수 업데이터 | `patch((current) => Partial<TAtoms>)` 지원 | 2 |

**React 패키지 (`@context-query/react`)**

| 기능 | 설명 | Phase |
|------|------|-------|
| `useDebugValue` 통합 | 모든 훅에 React DevTools 디버그 값 표시 | 1 |
| Selector 훅 | `useContextAtomSelector(key, selectorFn, equalityFn?)` | 1 |
| `useResetAtom` 훅 | 특정 atom을 초기값으로 리셋하는 훅 | 1 |
| `useHydrateAtoms` 훅 | SSR 환경에서 서버 데이터로 atom 초기화 | 2 |
| Provider `initialValues` prop | Provider에 초기값을 외부에서 주입 가능 | 2 |

**유틸리티 (`@context-query/utils` 또는 core 내장)**

| 유틸리티 | 설명 | Phase |
|----------|------|-------|
| `atomWithReducer` | 리듀서 패턴으로 atom 업데이트 로직 캡슐화 | 2 |
| `atomWithStorage` | localStorage/sessionStorage 동기화. 스코프 인식 키 네이밍 | 2 |
| `splitAtom` | 배열 atom을 개별 요소 atom으로 분할 | 3 |
| `atomFamily` | 파라미터 기반 동적 atom 생성 | 3 |

**품질 인프라**

| 항목 | 설명 | Phase |
|------|------|-------|
| 테스트 스위트 | Vitest + @testing-library/react. core/react 각각 단위/통합 테스트 | 1 |
| 타입 레벨 테스트 | `expectTypeOf`로 제네릭 추론 검증 | 1 |
| 번들 사이즈 검증 | `size-limit` CI 통합 | 1 |
| 성능 벤치마크 | 구독/업데이트/리렌더링 벤치마크 스크립트 | 3 |

**문서**

| 항목 | 설명 | Phase |
|------|------|-------|
| API 레퍼런스 | 모든 public API에 대한 종합 문서 | 3 |
| 가이드 | 시작하기, TypeScript, 테스팅, SSR, Jotai 비교 | 3 |
| 마이그레이션 가이드 | Jotai/Context API → context-query 전환 가이드 | 3 |

### Out of Scope (v1.0 이후 고려)

| 항목 | 사유 |
|------|------|
| Async atom / Suspense 통합 | 서버 상태는 TanStack Query 등에 위임. v1.0 이후 검토 |
| 비주얼 DevTools UI | 공수 대비 임팩트 검토 후 결정. Redux DevTools 연동 우선 |
| TanStack Query 통합 | v1.0 안정화 후 생태계 확장으로 |
| Immer 통합 | 별도 패키지로 제공 가능. 코어에는 불포함 |
| XState 통합 | 니치한 유스케이스. 커뮤니티 주도 확장 권장 |
| URL/Location 동기화 | 라우팅 라이브러리 의존성 발생. 별도 패키지 |
| Babel/SWC 플러그인 | 컴파일러 툴체인 투자 필요. v1.0 이후 |
| 중첩 Provider 상속 | 아키텍처 복잡도 증가. 별도 RFC로 논의 |
| React Native 지원 | 웹 우선. 요청에 따라 검토 |

### 아키텍처 의사결정 (Key Architectural Decisions)

**파생 atom 구현 방식**: 현재 `TAtoms` 레코드가 `Record<string, 초기값>`인 구조에서, atom 정의를 "값 또는 파생 함수"로 확장해야 한다. Jotai의 config 기반 모델을 참고하되, context-query의 string-key 기반 + Provider 스코핑 모델을 유지하는 방향으로 설계한다.

```typescript
// 예시: 파생 atom 정의 방향
const { Provider, useContextAtomValue } = createContextQuery({
  firstName: 'John',
  lastName: 'Doe',
  // 파생 atom: get 함수를 통해 다른 atom에 의존
  fullName: (get) => `${get('firstName')} ${get('lastName')}`,
});
```

**커스텀 동등성 함수 적용 레벨**: atom 단위로 설정 가능하게 하되, store 전체 기본값도 지정 가능하게 한다.

**유틸리티 패키지 전략**: 초기에는 core에 내장하되, v1.0에서 사이즈가 커지면 `@context-query/utils`로 분리를 검토한다. Tree-shaking으로 미사용 유틸리티는 번들에서 제외되도록 설계한다.

### Constraints & Assumptions

**제약 조건**
- React 18+ 필수 (`useSyncExternalStore` 의존)
- core 패키지 gzip 2KB 미만 유지
- react 패키지 gzip 3KB 미만 유지
- 외부 런타임 의존성 제로 유지 (core)
- 기존 v0.5.1 API와의 하위 호환성 최대한 유지 (minor version에서의 breaking change 허용하되 마이그레이션 가이드 제공)

**가정**
- 사용자는 TypeScript를 기본으로 사용한다
- 주요 사용 환경은 Vite, Next.js, CRA 기반 프로젝트이다
- 컴포넌트 트리 스코핑이 핵심 가치이며, 전역 상태 관리를 목표로 하지 않는다
- 파생 atom의 의존성 그래프는 동일 Provider 스코프 내로 제한된다
