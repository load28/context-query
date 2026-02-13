# Epic 1: 테스트 인프라 구축

**Phase**: 1 (Foundation)
**Priority**: P0 — 다른 모든 에픽의 전제 조건
**Estimated Scope**: 기존 코드 변경 없이 테스트만 추가

---

## Goal

context-query의 모든 기존 기능(core + react)에 대한 포괄적인 테스트 스위트를 구축하여, 이후 에픽에서의 리팩토링과 기능 추가가 안전하게 이루어질 수 있는 기반을 마련한다.

## Why First

- 테스트 없이 파생 atom이나 셀렉터를 추가하면 기존 기능의 회귀 버그를 감지할 수 없음
- 모든 에픽이 "기존 테스트가 통과하는가?"를 검증 기준으로 사용

---

## Stories

### Story 1.1: 테스트 프레임워크 설정

**설명**: Vitest + @testing-library/react + jsdom 환경을 monorepo에 설정한다.

**인수 조건**:
- [ ] root에 `vitest.config.ts` (workspace 모드)
- [ ] `packages/core`에 vitest 설정 추가
- [ ] `packages/react`에 vitest + jsdom 설정 추가
- [ ] `pnpm test` 로 전체 테스트 실행 가능
- [ ] `pnpm test:coverage` 로 커버리지 리포트 생성
- [ ] Turbo pipeline에 `test` 태스크 추가

**기술 메모**:
- `@testing-library/react`는 React 18+ 호환 버전 사용
- jsdom 환경에서 `useSyncExternalStore` 정상 동작 확인 필요
- `tsconfig` paths가 테스트에서도 올바르게 해석되도록 설정

---

### Story 1.2: AtomStore 단위 테스트

**설명**: `AtomStore<T>` 클래스의 모든 동작을 검증하는 단위 테스트를 작성한다.

**인수 조건**:
- [ ] `getValue()` — 초기값 반환 확인
- [ ] `setValue()` — 값 업데이트 및 리스너 호출 확인
- [ ] `setValue()` — 동일 값 설정 시 리스너 미호출 확인 (`Object.is`)
- [ ] `subscribe()` — 리스너 등록 및 해제(Subscription 반환) 확인
- [ ] 다중 리스너 등록/해제 시나리오
- [ ] 리스너 내에서 `setValue` 호출 시 동작 (재진입 안전성)
- [ ] 다양한 타입 (number, string, object, array, null, undefined) 검증

**파일**: `packages/core/src/__tests__/atomStore.test.ts`

---

### Story 1.3: ContextQueryStore 단위 테스트

**설명**: `ContextQueryStore<TAtoms>` 클래스의 모든 동작을 검증한다.

**인수 조건**:
- [ ] 생성자 — atoms 레코드로부터 AtomStore Map 생성 확인
- [ ] `getAtomValue(key)` — 올바른 atom 값 반환
- [ ] `setAtomValue(key, value)` — 직접 값 설정
- [ ] `setAtomValue(key, updaterFn)` — 함수 업데이터 지원
- [ ] `subscribeToAtom(key, listener)` — 특정 atom 구독
- [ ] `getSnapshot()` — 전체 스냅샷 객체 반환, 캐싱 동작 확인
- [ ] `getSnapshot()` — 값 변경 후 새 스냅샷 반환 (staleness)
- [ ] `patch(partial)` — 여러 atom 일괄 업데이트
- [ ] `subscribe(listener)` — 전체 store 구독 (모든 atom 변경 시 호출)
- [ ] 존재하지 않는 key 접근 시 에러 처리
- [ ] 타입 추론 확인 (`expectTypeOf`)

**파일**: `packages/core/src/__tests__/contextQueryStore.test.ts`

---

### Story 1.4: React 훅 통합 테스트 — useContextAtom / useContextAtomValue / useContextSetAtom

**설명**: 핵심 atom 접근 훅의 동작을 @testing-library/react로 검증한다.

**인수 조건**:
- [ ] `useContextAtom(key)` — `[value, setter]` 튜플 반환
- [ ] `useContextAtomValue(key)` — 읽기 전용 값 반환, setter 없음
- [ ] `useContextSetAtom(key)` — setter만 반환, 값 구독 없음
- [ ] setter 호출 시 구독 중인 컴포넌트만 리렌더링 확인
- [ ] `useContextSetAtom` 사용 컴포넌트는 값 변경 시 리렌더링 안 됨 확인
- [ ] 함수 업데이터 `setter(prev => prev + 1)` 동작 확인
- [ ] Provider 외부에서 사용 시 에러 throw 확인
- [ ] React Strict Mode에서 정상 동작 (double render)

**파일**: `packages/react/src/__tests__/atomHooks.test.tsx`

---

### Story 1.5: React 훅 통합 테스트 — useSnapshot / useSnapshotValue / usePatch

**설명**: 스냅샷 관련 훅의 동작을 검증한다.

**인수 조건**:
- [ ] `useSnapshot()` — `[snapshot, setter]` 반환, snapshot은 전체 상태 객체
- [ ] `useSnapshotValue()` — 읽기 전용 전체 상태 반환
- [ ] `usePatch()` — patch 함수 반환, 여러 atom 일괄 업데이트
- [ ] 스냅샷 값이 atom 변경 시 업데이트 확인
- [ ] `usePatch` 사용 컴포넌트는 상태 변경 시 리렌더링 안 됨 확인
- [ ] Provider 외부에서 사용 시 에러 throw 확인

**파일**: `packages/react/src/__tests__/snapshotHooks.test.tsx`

---

### Story 1.6: React 훅 통합 테스트 — useStore + Provider

**설명**: Provider의 격리 동작과 useStore 훅을 검증한다.

**인수 조건**:
- [ ] `useStore()` — ContextQueryStore 인스턴스 반환
- [ ] Provider의 `atoms` prop으로 초기 상태 설정
- [ ] 동일 createContextQuery의 Provider 2개가 독립적인 상태 유지
- [ ] Provider 언마운트 시 상태 정리
- [ ] 중첩된 동일 Provider 시 가장 가까운 Provider 사용

**파일**: `packages/react/src/__tests__/provider.test.tsx`

---

### Story 1.7: 타입 레벨 테스트

**설명**: TypeScript 제네릭 추론이 올바르게 동작하는지 타입 레벨에서 검증한다.

**인수 조건**:
- [ ] `createContextQuery({ count: 0, name: '' })` 시 TAtoms 타입 추론
- [ ] `useContextAtom('count')` 반환 타입이 `[number, setter]`
- [ ] `useContextAtomValue('name')` 반환 타입이 `string`
- [ ] `useContextSetAtom('count')` 반환 타입이 setter 함수
- [ ] 존재하지 않는 key 사용 시 타입 에러
- [ ] `useSnapshot()` 반환 타입이 전체 atoms 레코드
- [ ] `patch()` 인자가 `Partial<TAtoms>` 타입

**파일**: `packages/react/src/__tests__/types.test.ts`

---

## 완료 기준

- 모든 테스트 통과 (`pnpm test`)
- core 테스트 커버리지 90%+
- react 테스트 커버리지 85%+
- CI-ready 상태 (turbo pipeline에 test 포함)
