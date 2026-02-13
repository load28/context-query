# Epic 3: 셀렉터, 커스텀 동등성, Atom 리셋

**Phase**: 1 (Foundation)
**Priority**: P0 — 리렌더링 최적화의 핵심
**의존**: Epic 1 (테스트 인프라)

---

## Goal

atom 값의 일부만 구독하는 셀렉터, 커스텀 동등성 함수로 불필요한 리렌더링을 제거하고, atom을 초기값으로 되돌리는 리셋 기능을 추가한다.

---

## Stories

### Story 3.1: AtomStore에 커스텀 동등성 함수 지원

**설명**: `AtomStore` 생성 시 `equalityFn` 옵션을 받아 값 비교 로직을 커스터마이즈한다.

**인수 조건**:
- [ ] `AtomStore<T>` 생성자에 optional `equalityFn: (a: T, b: T) => boolean` 파라미터
- [ ] 기본값은 `Object.is`
- [ ] `setValue` 시 equalityFn으로 비교하여 동일하면 리스너 미호출
- [ ] shallow equality 유틸 함수 제공 (`shallowEqual`)
- [ ] ContextQueryStore 생성 시 atom별 equalityFn 설정 가능
- [ ] 단위 테스트: object atom에 shallowEqual 적용 시 동일 구조 객체로 업데이트해도 리스너 미호출

**기술 메모**:
```typescript
createContextQuery({
  user: { value: { name: 'John', age: 30 }, equalityFn: shallowEqual },
  count: 0, // 기본 Object.is
});
```
atom 정의를 `value | { value, equalityFn }` 형태로 확장하거나, 별도 설정 객체 패턴 사용.

---

### Story 3.2: Selector 훅 (`useContextAtomSelector`)

**설명**: atom 값에서 파생된 일부분만 구독하여, 해당 부분이 변경될 때만 리렌더링하는 훅을 추가한다.

**인수 조건**:
- [ ] `useContextAtomSelector<K, R>(key: K, selector: (value: TAtoms[K]) => R, equalityFn?: (a: R, b: R) => boolean): R`
- [ ] selector 결과가 변경되지 않으면 리렌더링 안 됨
- [ ] 기본 equalityFn은 `Object.is`
- [ ] 커스텀 equalityFn 지원 (e.g., `shallowEqual`)
- [ ] Provider 외부에서 사용 시 에러 throw
- [ ] React DevTools에 selector 결과 표시 (`useDebugValue`)

**테스트 시나리오**:
```typescript
// user = { name: 'John', age: 30, email: 'john@...' }
const name = useContextAtomSelector('user', (u) => u.name);
// user.email 변경 시 이 컴포넌트는 리렌더링 안 됨
// user.name 변경 시에만 리렌더링
```

---

### Story 3.3: Atom 리셋 기능

**설명**: atom을 초기값으로 되돌리는 리셋 기능을 core와 react에 추가한다.

**인수 조건**:
- [ ] `RESET` 심볼 export (`@context-query/core`)
- [ ] `ContextQueryStore.resetAtom(key)` — 특정 atom을 초기값으로 리셋
- [ ] `ContextQueryStore.resetAll()` — 모든 atom을 초기값으로 리셋
- [ ] `setAtomValue(key, RESET)` 으로도 리셋 가능
- [ ] 리셋 시 리스너 호출 (현재 값과 초기값이 다른 경우만)
- [ ] `useResetAtom(key)` 훅 — 리셋 함수 반환, 값 구독 없음
- [ ] `useResetAtom` 컴포넌트는 상태 변경 시 리렌더링 안 됨
- [ ] 파생 atom은 리셋 불가 (타입 레벨 + 런타임 에러)

---

### Story 3.4: createContextQuery 옵션 확장

**설명**: atom 정의 시 초기값 외에 equalityFn 등의 옵션을 지정할 수 있는 확장된 atom 정의 문법을 지원한다.

**인수 조건**:
- [ ] 기존 단순 문법 유지: `{ count: 0 }` (하위 호환)
- [ ] 확장 문법 지원: `{ user: atom({ name: '' }, { equalityFn: shallowEqual }) }`
- [ ] `atom(initialValue, options?)` 헬퍼 함수
- [ ] `derived()`, `atom()`, plain value 가 혼합 가능
- [ ] 타입 추론이 모든 경우에 올바르게 동작
- [ ] 타입 레벨 테스트로 검증

**기술 메모**:
```typescript
import { createContextQuery, atom, derived, shallowEqual } from '@context-query/react';

const { Provider, useContextAtomValue } = createContextQuery({
  count: 0,                                           // plain value
  user: atom({ name: '', age: 0 }, { equalityFn: shallowEqual }), // with options
  fullName: derived((get) => get('user').name),        // derived
});
```

---

## 완료 기준

- 커스텀 동등성으로 object atom 리렌더링 최적화 동작
- Selector 훅으로 부분 구독 시 불필요한 리렌더링 제거 확인
- 리셋 기능으로 atom/전체 초기화 동작
- 기존 테스트 전체 통과
- 각 기능별 테스트 커버리지 90%+
