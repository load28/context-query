# Epic 4: DevTools 통합 및 에러 핸들링

**Phase**: 1 (DevTools) + 2 (에러 핸들링)
**Priority**: P1
**의존**: Epic 1 (테스트 인프라)

---

## Goal

React DevTools에서 atom 상태를 실시간으로 디버깅할 수 있도록 하고, atom 업데이트 중 발생하는 에러를 안전하게 처리하여 프로덕션 안정성을 확보한다.

---

## Stories

### Story 4.1: React DevTools `useDebugValue` 통합

**설명**: 모든 React 훅에 `useDebugValue`를 추가하여 DevTools에서 atom 상태를 확인한다.

**인수 조건**:
- [ ] `useContextAtom(key)` — DevTools에 `{ key, value }` 표시
- [ ] `useContextAtomValue(key)` — DevTools에 `{ key, value }` 표시
- [ ] `useContextSetAtom(key)` — DevTools에 `{ key, type: 'setter' }` 표시
- [ ] `useSnapshot()` — DevTools에 전체 스냅샷 객체 표시
- [ ] `useSnapshotValue()` — DevTools에 전체 스냅샷 표시
- [ ] `useContextAtomSelector(key, selector)` — DevTools에 selector 결과 표시
- [ ] 커스텀 formatter: `useDebugValue(value, formatter)` 활용하여 큰 객체는 축약 표시

**공수**: 작음 (각 훅에 1줄 추가)

---

### Story 4.2: Store 디버그 API

**설명**: ContextQueryStore에 디버깅용 API를 추가한다.

**인수 조건**:
- [ ] `store.getDebugInfo()` — 모든 atom의 현재 값, 구독자 수, 파생 의존성 반환
- [ ] `store.getAtomSubscriberCount(key)` — 특정 atom의 활성 구독자 수
- [ ] `store.getDependencyGraph()` — 파생 atom의 의존성 그래프 (adjacency list)
- [ ] 디버그 API는 production 빌드에서도 사용 가능 (tree-shaking으로 제거 불가한 이유: 런타임 디버깅 필요)

---

### Story 4.3: Atom 업데이트 에러 캡처

**설명**: atom의 setValue 또는 파생 atom의 read 함수 실행 중 발생한 에러를 안전하게 처리한다.

**인수 조건**:
- [ ] `setValue` 콜백(함수 업데이터) 내 에러 발생 시 atom 값은 변경되지 않음
- [ ] 파생 atom의 read 함수에서 에러 발생 시 해당 atom은 에러 상태로 전환
- [ ] 에러 상태인 파생 atom의 `getValue()`는 에러를 throw
- [ ] 의존 atom 수정으로 파생 atom이 정상 계산되면 에러 상태 해제
- [ ] `onError` 콜백 옵션: store 생성 시 글로벌 에러 핸들러 등록 가능
- [ ] 에러가 다른 atom의 구독자에 전파되지 않음 (에러 격리)

---

### Story 4.4: React 에러 경계 통합

**설명**: 파생 atom 에러가 React Error Boundary와 자연스럽게 통합되도록 한다.

**인수 조건**:
- [ ] 에러 상태 파생 atom을 `useContextAtomValue`로 구독하면 render 중 throw → Error Boundary 포착
- [ ] Error Boundary 내 다른 정상 atom 구독은 영향 없음
- [ ] 의존 atom 복구 시 Error Boundary fallback에서 정상 UI 복원 가능
- [ ] `useAtomError(key)` 훅 — 에러 상태를 throw 없이 조회 (optional, 유틸리티)

---

## 완료 기준

- React DevTools에서 모든 훅의 atom 상태 확인 가능
- 에러 발생 시 store가 깨지지 않고 에러가 격리됨
- Error Boundary와 자연스럽게 통합
- 기존 테스트 + 에러 시나리오 테스트 전체 통과
