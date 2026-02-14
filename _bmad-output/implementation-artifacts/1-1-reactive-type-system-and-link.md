# Story 1.1: 반응형 타입 시스템 및 Link 자료구조 구현

Status: ready-for-dev

## Story

As a 라이브러리 개발자,
I want ReactiveFlags, ReactiveNode, Link 타입과 Doubly Linked List 유틸리티를,
So that 시그널 엔진의 핵심 자료구조 기반이 확립된다.

## Acceptance Criteria

1. **ReactiveFlags const enum 정의** (AC1)
   - Given: signal/types.ts 파일이 생성됨
   - When: ReactiveFlags const enum이 정의됨
   - Then: Dirty(1<<0), Pending(1<<1), Mutable(1<<2), Watching(1<<3) 플래그가 비트 연산으로 동작한다

2. **ReactiveNode, Link 인터페이스 정의** (AC2)
   - Given: signal/types.ts 파일이 생성됨
   - When: ReactiveNode와 Link 인터페이스가 정의됨
   - Then: Doubly Linked List 구조로 dep/sub 양방향 참조를 지원한다

3. **linkDep/unlinkDep 유틸리티** (AC3)
   - Given: signal/link.ts 파일이 생성됨
   - When: linkDep(dep, sub) 함수가 호출됨
   - Then: dep.subs와 sub.deps에 양방향으로 Link 노드가 추가된다
   - And: unlinkDep(link) 함수가 양방향 연결을 정확히 해제한다

4. **단위 테스트** (AC4)
   - Given: 단위 테스트가 작성됨
   - When: Link 노드 추가/제거를 반복 실행
   - Then: 메모리 누수 없이 양방향 리스트가 정확히 유지된다

## Tasks / Subtasks

- [ ] Task 1: signal/types.ts 생성 (AC: 1, 2)
  - [ ] ReactiveFlags const enum 정의
  - [ ] ReactiveNode 인터페이스 정의
  - [ ] Link 인터페이스 정의
  - [ ] SignalOptions 타입 정의
- [ ] Task 2: signal/link.ts 생성 (AC: 3)
  - [ ] linkDep(dep, sub) → Link 함수 구현
  - [ ] unlinkDep(link) 함수 구현
- [ ] Task 3: signal/index.ts 스텁 생성
  - [ ] 향후 createReactiveSystem export를 위한 placeholder
- [ ] Task 4: 단위 테스트 작성 (AC: 4)
  - [ ] __tests__/signal/link.test.ts 작성
  - [ ] ReactiveFlags 비트 연산 테스트
  - [ ] Link 추가/제거/순회 테스트
  - [ ] Edge cases: 빈 리스트, 단일 노드, 다중 노드

## Dev Notes

### Architecture Compliance

**Source:** [architecture-signal-engine.md#Decision 4]

- signal/ 디렉토리 내 코드는 **순수 TypeScript만** — 외부 의존성 절대 금지
- Layer 1 (Reactive Engine)은 **완전 독립** — packages/core/src의 다른 파일을 import하지 않음
- signal/index.ts는 public export만 담당 (이 스토리에서는 types만 re-export)

### 강제 구현 규칙 (7개 중 해당 항목)

1. **규칙 1**: signal/ 내부 코드는 외부 의존성 없이 순수 TypeScript만 사용
2. **규칙 2**: 비트 연산은 항상 `|=`, `&= ~`, `& !== 0` 패턴
3. **규칙 3**: Link 노드는 항상 양방향 연결/해제

### Technical Requirements

**ReactiveFlags const enum:**
```typescript
const enum ReactiveFlags {
  None      = 0,
  Dirty     = 1 << 0,   // 값 변경 → 재계산 필요
  Pending   = 1 << 1,   // 의존성 중 하나가 Dirty (Diamond 해결)
  Mutable   = 1 << 2,   // 쓰기 가능 Signal (State vs Computed 구분)
  Watching  = 1 << 3,   // 활성 구독자 존재
}
```

**ReactiveNode 인터페이스:**
```typescript
interface ReactiveNode {
  flags: ReactiveFlags;
  deps: Link | null;   // 이 노드가 의존하는 대상들의 연결 리스트
  subs: Link | null;   // 이 노드를 구독하는 대상들의 연결 리스트
}
```

**Link 인터페이스 (Doubly Linked List):**
```typescript
interface Link {
  dep: ReactiveNode;      // dependency (의존 대상)
  sub: ReactiveNode;      // subscriber (구독자)
  prevDep: Link | null;   // sub의 deps 리스트에서 이전 링크
  nextDep: Link | null;   // sub의 deps 리스트에서 다음 링크
  prevSub: Link | null;   // dep의 subs 리스트에서 이전 링크
  nextSub: Link | null;   // dep의 subs 리스트에서 다음 링크
}
```

**linkDep 구현 패턴:**
```typescript
function linkDep(dep: ReactiveNode, sub: ReactiveNode): Link {
  const link: Link = { dep, sub, prevDep: null, nextDep: null, prevSub: null, nextSub: null };
  // dep의 subs 리스트 앞에 추가
  if (dep.subs) { dep.subs.prevSub = link; }
  link.nextSub = dep.subs;
  dep.subs = link;
  // sub의 deps 리스트 앞에 추가
  if (sub.deps) { sub.deps.prevDep = link; }
  link.nextDep = sub.deps;
  sub.deps = link;
  return link;
}
```

**unlinkDep 구현:**
- prevSub/nextSub 연결 해제 (dep.subs 리스트에서 제거)
- prevDep/nextDep 연결 해제 (sub.deps 리스트에서 제거)
- head 포인터 업데이트 (dep.subs, sub.deps)

**SignalOptions 타입:**
```typescript
interface SignalOptions<T> {
  equals?: (a: T, b: T) => boolean;  // 기본값: Object.is
}
```

### File Structure

```
packages/core/src/signal/
├── types.ts           # ReactiveFlags, ReactiveNode, Link, SignalOptions
├── link.ts            # linkDep(), unlinkDep()
└── index.ts           # public exports (types만, 이후 스토리에서 확장)

packages/core/src/__tests__/signal/
└── link.test.ts       # Link 자료구조 단위 테스트
```

### Testing Standards

- **Framework:** Vitest (이미 설치됨)
- **패턴:** 각 테스트는 독립 실행 가능해야 함
- **커버리지 목표:** link.ts 90%+
- **필수 테스트 케이스:**
  - 빈 리스트에 첫 번째 Link 추가
  - 여러 Link 추가 후 올바른 순서 확인
  - 중간 Link 제거 후 리스트 무결성
  - 첫 번째/마지막 Link 제거
  - 동일 dep에 여러 sub 연결
  - 동일 sub에 여러 dep 연결
  - 모든 Link 제거 후 빈 리스트 확인

### Anti-Patterns (금지)

```typescript
// ❌ 금지: 다른 플래그 소실
node.flags = ReactiveFlags.Dirty;

// ❌ 금지: 복합 플래그 무시
if (node.flags === ReactiveFlags.Dirty)

// ❌ 금지: 단방향 연결만 (양방향 필수)
link.nextSub = dep.subs;
dep.subs = link;
// ← sub.deps 업데이트 누락!

// ❌ 금지: === 사용 (Object.is 사용)
if (oldValue === newValue) return;
```

### Project Structure Notes

- `packages/core/src/signal/` 디렉토리는 새로 생성해야 함
- `packages/core/src/__tests__/signal/` 디렉토리도 새로 생성해야 함
- 기존 `packages/core/src/types.ts`와 혼동하지 말 것 — signal/types.ts는 별도 파일
- Rollup 빌드에서 signal/ 디렉토리는 자동으로 번들에 포함됨

### References

- [Source: architecture-signal-engine.md#Decision 4 - ReactiveNode 인터페이스]
- [Source: architecture-signal-engine.md#Code Patterns - 비트 플래그 조작]
- [Source: architecture-signal-engine.md#Code Patterns - Link 노드 양방향 연결]
- [Source: research/technical-tc39-signals-research-2026-02-14.md#Alien Signals 알고리즘 분석]

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
