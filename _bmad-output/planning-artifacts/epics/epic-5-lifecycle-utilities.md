# Epic 5: 라이프사이클 및 유틸리티

**Phase**: 2 (Robustness)
**Priority**: P1
**의존**: Epic 1, Epic 2, Epic 3

---

## Goal

atom의 라이프사이클 이벤트(mount/unmount), 실무에서 빈번히 사용되는 유틸리티 패턴(reducer, storage), 그리고 `patch` 함수 업데이터를 추가하여 실무 시나리오를 완전하게 커버한다.

---

## Stories

### Story 5.1: `onMount`/`onUnmount` 라이프사이클

**설명**: atom에 첫 구독자가 등록될 때와 마지막 구독자가 해제될 때 실행되는 콜백을 지원한다.

**인수 조건**:
- [ ] `atom(initialValue, { onMount: (setValue) => cleanup })` 옵션
- [ ] 첫 번째 구독자 등록 시 `onMount` 실행
- [ ] `onMount`는 `setValue` 함수를 인자로 받아 atom 값을 설정할 수 있음
- [ ] `onMount`가 반환하는 함수는 마지막 구독자 해제 시 실행 (cleanup)
- [ ] 구독자가 0 → 1 → 0 → 1 시 onMount/cleanup이 올바르게 반복 실행
- [ ] Provider 언마운트 시 모든 활성 cleanup 실행
- [ ] 파생 atom에는 onMount 미지원 (타입 레벨 차단)

**사용 사례**:
```typescript
const timer = atom(0, {
  onMount: (setValue) => {
    const id = setInterval(() => setValue((c) => c + 1), 1000);
    return () => clearInterval(id); // cleanup
  },
});
```

---

### Story 5.2: `atomWithReducer`

**설명**: 리듀서 패턴으로 atom 업데이트 로직을 캡슐화하는 유틸리티를 제공한다.

**인수 조건**:
- [ ] `atomWithReducer<T, Action>(initialValue, reducer: (state: T, action: Action) => T)` 함수
- [ ] 반환된 atom 정의를 createContextQuery에서 사용 가능
- [ ] `useContextSetAtom(key)` 반환 setter가 dispatch 역할: `dispatch(action)`
- [ ] `useContextAtom(key)` 반환 `[value, dispatch]`
- [ ] 타입 추론: action 타입이 올바르게 추론됨
- [ ] 단위 테스트 + React 통합 테스트

**사용 사례**:
```typescript
type CountAction = { type: 'increment' } | { type: 'decrement' } | { type: 'set'; value: number };

const counter = atomWithReducer(0, (state, action: CountAction) => {
  switch (action.type) {
    case 'increment': return state + 1;
    case 'decrement': return state - 1;
    case 'set': return action.value;
  }
});
```

---

### Story 5.3: `atomWithStorage`

**설명**: localStorage/sessionStorage와 동기화되는 atom을 제공한다.

**인수 조건**:
- [ ] `atomWithStorage<T>(key: string, initialValue: T, options?)` 함수
- [ ] `options.storage`: `'local' | 'session'` (기본: `'local'`)
- [ ] 초기화 시 storage에 저장된 값이 있으면 해당 값으로 시작
- [ ] 값 변경 시 storage에 자동 동기화
- [ ] JSON 직렬화/역직렬화 기본 제공
- [ ] 커스텀 serializer/deserializer 옵션
- [ ] storage key는 사용자가 명시적으로 지정 (스코프 인식 자동 네이밍은 Out of Scope)
- [ ] SSR 환경에서 storage 미접근 시 initialValue 사용 (typeof window 체크)
- [ ] `RESET` 시 storage에서도 제거
- [ ] 단위 테스트 (storage mock)

---

### Story 5.4: `patch()` 함수 업데이터 지원

**설명**: `patch`에 함수 형태의 업데이터를 지원하여 stale closure 문제를 방지한다.

**인수 조건**:
- [ ] `store.patch((current) => ({ count: current.count + 1, name: 'updated' }))` 지원
- [ ] `usePatch()` 반환 함수도 함수 업데이터 지원
- [ ] 기존 `patch(Partial<TAtoms>)` 시그니처와 호환 (오버로드)
- [ ] 함수 업데이터의 `current` 는 최신 스냅샷
- [ ] 타입 추론: 함수 인자 타입이 TAtoms, 반환 타입이 Partial<TAtoms>

---

### Story 5.5: TypeScript 유틸리티 타입

**설명**: 라이브러리 소비자가 활용할 수 있는 TypeScript 유틸리티 타입을 export한다.

**인수 조건**:
- [ ] `ExtractAtomValue<TAtoms, K>` — 특정 key의 atom 값 타입 추출
- [ ] `WritableAtomKeys<TAtoms>` — 쓰기 가능한 atom key 유니온
- [ ] `DerivedAtomKeys<TAtoms>` — 파생 atom key 유니온
- [ ] `AtomSnapshot<TAtoms>` — 전체 스냅샷 타입 (파생 atom 포함)
- [ ] 타입 레벨 테스트로 모든 유틸리티 타입 검증

---

## 완료 기준

- onMount/onUnmount가 구독자 수에 따라 정확하게 동작
- atomWithReducer의 dispatch 패턴이 타입 안전하게 동작
- atomWithStorage가 localStorage와 올바르게 동기화
- patch 함수 업데이터가 stale closure 없이 동작
- 모든 유틸리티 타입이 올바르게 추론
- 기존 테스트 + 신규 테스트 전체 통과
