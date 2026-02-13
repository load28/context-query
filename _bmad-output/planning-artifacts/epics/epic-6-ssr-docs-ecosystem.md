# Epic 6: SSR 지원, 문서, 생태계 완성

**Phase**: 2 (SSR) + 3 (문서/생태계)
**Priority**: P2
**의존**: Epic 1~5

---

## Goal

Next.js App Router 환경에서의 SSR 호환성을 확보하고, 종합 API 문서와 가이드를 작성하며, splitAtom/atomFamily/미들웨어로 생태계를 완성하여 v1.0 릴리스 준비를 마친다.

---

## Stories

### Story 6.1: SSR 호환성 및 `useHydrateAtoms`

**설명**: SSR 환경에서 서버 데이터로 atom을 초기화하는 hydration 메커니즘을 제공한다.

**인수 조건**:
- [ ] `useHydrateAtoms(values: Partial<TAtoms>)` 훅 — 마운트 시 한 번만 실행
- [ ] Provider의 `initialValues` prop으로 서버 데이터 주입
- [ ] `useSyncExternalStore`의 `getServerSnapshot` 구현
- [ ] Next.js App Router (RSC + Client Component) 환경에서 정상 동작
- [ ] SSR 시 `atomWithStorage`가 storage 접근 없이 initialValue 사용
- [ ] hydration mismatch 경고 없음

---

### Story 6.2: `splitAtom`

**설명**: 배열 atom을 개별 요소 atom으로 분할하여 리스트 성능을 최적화한다.

**인수 조건**:
- [ ] `useSplitAtom(key)` — 배열 atom의 각 요소에 대한 `[value, setValue]` 배열 반환
- [ ] 개별 요소 변경 시 해당 요소만 리렌더링 (전체 리스트 리렌더링 방지)
- [ ] 요소 추가/제거 시 리스트 컴포넌트만 리렌더링
- [ ] 안정적인 key 제공 (요소별 고유 식별)
- [ ] 타입 추론: 배열 atom의 요소 타입 자동 추론

---

### Story 6.3: `atomFamily`

**설명**: 파라미터 기반으로 동적 atom을 생성하는 팩토리 패턴을 제공한다.

**인수 조건**:
- [ ] `atomFamily<Param, Value>(createAtom: (param: Param) => AtomConfig)` 함수
- [ ] 동일 param으로 여러 번 호출 시 동일 atom 반환 (memoization)
- [ ] param 비교를 위한 equalityFn 옵션
- [ ] `remove(param)` 로 특정 atom 해제 (메모리 관리)
- [ ] Provider 스코프 내에서 동작 (전역이 아닌 스코프별 인스턴스)

---

### Story 6.4: 미들웨어 / 플러그인 아키텍처

**설명**: store에 미들웨어를 적용하여 로깅, 검증 등 cross-cutting concerns를 처리한다.

**인수 조건**:
- [ ] `ContextQueryStore` 생성 시 `middleware` 옵션
- [ ] 미들웨어 시그니처: `(store, key, newValue, prevValue) => newValue | void`
- [ ] 여러 미들웨어 체인 실행
- [ ] 로깅 미들웨어 예제 제공
- [ ] 검증 미들웨어 예제 제공 (값 변경 거부 가능)
- [ ] 미들웨어에서 다른 atom 읽기/쓰기 가능

---

### Story 6.5: 번들 사이즈 검증 및 성능 벤치마크

**설명**: 번들 사이즈 제한을 CI에서 자동 검증하고, Jotai/Context API 대비 성능 벤치마크를 작성한다.

**인수 조건**:
- [ ] `size-limit` 설정: core < 2KB gzip, react < 3KB gzip
- [ ] CI에서 PR마다 번들 사이즈 검증
- [ ] 벤치마크 스크립트: 구독/업데이트/리렌더링 횟수 측정
- [ ] 결과 비교표: context-query vs Jotai vs React Context
- [ ] 메모리 사용량 벤치마크 (atom 수 증가 시)

---

### Story 6.6: API 레퍼런스 문서

**설명**: 모든 public API에 대한 종합 레퍼런스 문서를 작성한다.

**인수 조건**:
- [ ] Core API: ContextQueryStore, AtomStore, derived, atom, RESET
- [ ] React API: createContextQuery, 모든 훅, Provider
- [ ] 유틸리티 API: atomWithReducer, atomWithStorage, splitAtom, atomFamily
- [ ] 각 API에 TypeScript 시그니처, 설명, 예제 코드 포함
- [ ] 모든 export에 JSDoc 작성

---

### Story 6.7: 가이드 문서

**설명**: 주요 사용 시나리오별 가이드를 작성한다.

**인수 조건**:
- [ ] Getting Started — 설치부터 첫 Provider 구성까지
- [ ] TypeScript 가이드 — 타입 추론 활용법, 유틸리티 타입
- [ ] 테스팅 가이드 — context-query 사용 컴포넌트 테스트 방법
- [ ] SSR 가이드 — Next.js App Router에서 활용
- [ ] Jotai 비교 가이드 — API 매핑, 마이그레이션 패턴
- [ ] 컴포넌트 라이브러리 가이드 — 라이브러리 내부 상태 관리 활용

---

## 완료 기준

- SSR 환경에서 hydration 정상 동작
- splitAtom으로 리스트 성능 최적화 확인
- atomFamily로 동적 atom 생성 동작
- 미들웨어로 로깅/검증 패턴 동작
- 번들 사이즈 제한 CI 통과
- API 레퍼런스 + 6개 가이드 작성 완료
- **v1.0 릴리스 준비 완료**
