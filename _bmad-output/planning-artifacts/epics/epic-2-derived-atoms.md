# Epic 2: 파생 Atom 및 의존성 추적

**Phase**: 1 (Foundation)
**Priority**: P0 — context-query의 가장 큰 기능 갭
**의존**: Epic 1 (테스트 인프라)

---

## Goal

스코프 내 atom 간 의존성을 자동으로 추적하여 계산된 상태(derived atoms)를 지원한다. Jotai의 `atom((get) => ...)` 패턴에 대응하되, context-query의 string-key + Provider 스코핑 모델을 유지한다.

## 아키텍처 핵심 결정

현재 `createContextQuery({ count: 0, name: '' })`에서 모든 값이 primitive initial value이다. 파생 atom을 지원하려면 "값 또는 파생 함수"를 구분해야 한다.

```typescript
const { Provider, useContextAtomValue } = createContextQuery({
  firstName: 'John',
  lastName: 'Doe',
  fullName: derived((get) => `${get('firstName')} ${get('lastName')}`),
});
```

`derived()` 헬퍼 함수로 타입 시스템에서 파생 atom과 일반 atom을 구분한다.

---

## Stories

### Story 2.1: `derived()` 정의 함수 및 타입 시스템

**설명**: 파생 atom을 선언하기 위한 `derived()` 헬퍼와 관련 타입을 core 패키지에 추가한다.

**인수 조건**:
- [ ] `derived<TAtoms, TValue>(readFn: (get: Getter<TAtoms>) => TValue)` 함수 export
- [ ] `DerivedAtomConfig<TAtoms, TValue>` 타입 정의
- [ ] `Getter<TAtoms>` 타입: `<K extends keyof TAtoms>(key: K) => TAtoms[K]`
- [ ] `createContextQuery` 의 TAtoms에서 파생 atom의 값 타입이 올바르게 추론
- [ ] 파생 atom은 읽기 전용 — `useContextSetAtom`으로 설정 불가하도록 타입 제한
- [ ] 타입 레벨 테스트 추가

**기술 메모**:
- `derived` 결과물은 런타임에 `{ __type: 'derived', read: readFn }` 같은 마커 객체
- TAtoms 타입에서 primitive vs derived를 구분하는 conditional type 필요

---

### Story 2.2: ContextQueryStore에서 파생 atom 해석

**설명**: ContextQueryStore 생성 시 atoms 레코드에서 `derived()` 설정을 감지하여 DerivedAtomStore를 생성한다.

**인수 조건**:
- [ ] atoms 레코드의 각 항목이 primitive인지 derived인지 판별
- [ ] primitive atom은 기존 AtomStore로 생성
- [ ] derived atom은 별도의 DerivedAtomStore로 생성 (또는 AtomStore 확장)
- [ ] derived atom의 `getValue()`는 read 함수를 실행하여 계산된 값 반환
- [ ] derived atom의 `setValue()`는 허용하지 않음 (에러 throw)
- [ ] 기존 API (`getAtomValue`, `subscribeToAtom`, `getSnapshot`)가 파생 atom에 대해 동작

---

### Story 2.3: 의존성 추적 및 자동 재계산

**설명**: 파생 atom의 `read` 함수 실행 중 `get()` 호출을 추적하여 의존성 그래프를 구축하고, 의존 atom 변경 시 자동 재계산한다.

**인수 조건**:
- [ ] `get(key)` 호출 시 해당 key를 의존성 목록에 기록
- [ ] 의존하는 atom이 변경되면 파생 atom의 값을 재계산
- [ ] 재계산 결과가 이전과 동일하면 (`Object.is`) 리스너 미호출 (글리치 프리)
- [ ] 연쇄 파생: A → B(derived from A) → C(derived from B) 동작 확인
- [ ] 다이아몬드 의존성: A → B, A → C, D(derived from B+C) 시 D는 한 번만 재계산
- [ ] 순환 의존성 감지 및 에러 throw

---

### Story 2.4: 파생 atom과 React 훅 통합

**설명**: 기존 React 훅이 파생 atom에 대해 올바르게 동작하도록 한다.

**인수 조건**:
- [ ] `useContextAtomValue('fullName')` — 파생 값 반환, 의존 atom 변경 시 리렌더링
- [ ] `useContextAtom('fullName')` — `[value, setter]`에서 setter 호출 시 에러 (또는 setter를 undefined/noop으로)
- [ ] `useContextSetAtom('fullName')` — 타입 레벨에서 차단 또는 런타임 에러
- [ ] `useSnapshot()` — 파생 atom 포함된 전체 스냅샷 반환
- [ ] `usePatch()` — 파생 atom key는 patch에서 무시 (타입 레벨 제한)
- [ ] 의존 atom 변경 → 파생 atom 구독자만 리렌더링 (비의존 컴포넌트는 리렌더링 안 됨)

---

### Story 2.5: 파생 atom 성능 최적화

**설명**: 파생 atom의 계산 비용을 최소화한다.

**인수 조건**:
- [ ] 구독자가 없는 파생 atom은 lazy 계산 (getValue 호출 시에만)
- [ ] 구독자가 있는 파생 atom은 의존 atom 변경 시 즉시 재계산
- [ ] 동일 렌더 사이클 내 여러 의존 atom 변경 시 재계산 1회만 수행 (batching)
- [ ] 벤치마크: 100개 atom + 50개 파생 atom에서 단일 atom 업데이트 시 1ms 미만

---

## 완료 기준

- 파생 atom이 포함된 createContextQuery 정상 동작
- 의존성 추적 + 자동 재계산 + 글리치 프리
- 기존 테스트 전체 통과 (회귀 없음)
- 파생 atom 전용 테스트 커버리지 90%+
- 타입 추론 완벽 (파생 atom의 읽기 전용 성질 타입 레벨 보장)
