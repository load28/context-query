---
project_name: 'context-query'
user_name: 'load28'
date: '2026-02-13'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 42
optimized_for_llm: true
---

# Project Context for AI Agents

_이 파일은 AI 에이전트가 이 프로젝트에서 코드를 구현할 때 반드시 따라야 하는 핵심 규칙과 패턴을 포함합니다. 에이전트가 놓칠 수 있는 비자명적(unobvious) 세부 사항에 초점을 맞춥니다._

---

## Technology Stack & Versions

| 기술 | 버전 | 비고 |
|------|------|------|
| TypeScript | 5.8.2 | strict mode 필수 |
| React | ^18.0.0 \|\| ^19.0.0 | peerDependency |
| Node.js | >=18 | 엔진 요구사항 |
| pnpm | 9.0.0 | workspace 매니저 |
| Rollup | ^4.35.0 | ESM + CJS dual output |
| Turbo | ^2.4.4 | 모노레포 빌드 |
| Vite | ^6.2.0 | playground 전용 |
| Tailwind CSS | ^4.0.13 | playground 전용 |

### 패키지 버전

- `@context-query/core`: 0.5.1 — **Zero Dependencies (외부 의존성 절대 금지)**
- `@context-query/react`: 0.4.1 — core + react만 의존
- `@context-query/playground`: 0.0.0 (private, 개발용)

### 빌드 출력 형식

- ESM: `dist/index.mjs` (기본)
- CJS: `dist/index.cjs`
- Types: `dist/index.d.ts`
- Sourcemap 포함, terser minification

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **strict mode 항상 활성화** — 모든 tsconfig.json에서 `strict: true`
- `target: ESNext`, `module: ESNext`, `moduleResolution: "bundler"`
- core/react 패키지는 `declaration: true`로 `.d.ts` 자동 생성
- 타입만 가져올 때 반드시 `import type { X }` 사용 (런타임 임포트 방지)
- workspace 패키지 간 참조는 `workspace:*` 사용
- **제네릭 패턴**: Atom 관련 타입은 `TAtoms extends Record<string, any>`로 제약
- 키 접근은 `TKey extends keyof TAtoms` + `TAtoms[TKey]` 패턴
- 타입 추출: `ReturnType<typeof createStoreContext<TAtoms>>` 패턴
- **값 비교는 반드시 `Object.is()` 사용** — `===` 사용 금지 (NaN, -0/+0 정확 처리)

### Framework-Specific Rules (React)

- **Factory Hook Pattern 필수**: 모든 훅은 `create*` 팩토리 함수로 생성
  - 예: `createUseContextAtom(StoreContext)` → `useContextAtom(key)` 반환
- **`useSyncExternalStore`** 사용 — React 18+ concurrent mode 안전성 보장
- `useCallback` 의존성: 항상 `[store, key]` 또는 `[store]`
- Provider에서 `useMemo`로 스토어 인스턴스 안정성 보장
- Named function expression 사용 (스택 트레이스 가독성)
- **Setter 패턴**: 직접 값 또는 `(prev) => next` 함수 모두 지원
  - `typeof newValue === "function"` 타입 체크 후 `as Function` 캐스팅
- 반환 튜플은 `as const` 사용: `[value, setAtom] as const`
- **훅 분류 원칙:**
  - Read-Write: `useContextAtom`, `useSnapshot` — 구독 + setter
  - Read-Only: `useContextAtomValue`, `useSnapshotValue` — 구독만
  - Write-Only: `useContextSetAtom`, `usePatch` — 구독 없음 (리렌더링 방지)

### Testing Rules

- 현재 테스트 프레임워크 미설정 (고도화 대상)
- 고도화 시: core는 순수 TypeScript 유닛 테스트, react는 React Testing Library + hooks 테스트 권장
- CI 파이프라인에 테스트 단계 추가 필요

### Code Quality & Style Rules

- **파일 네이밍**: `camelCase.ts` / `camelCase.tsx`
  - 예: `atomStore.ts`, `useContextAtom.ts`, `createProvider.tsx`
- **디렉토리**: lowercase (`hooks/`, `internals/`, `lib/`)
- **인덱스 파일**: `index.ts`로 re-export
- **함수 네이밍**:
  - 팩토리: `create*` (예: `createContextQuery`, `createUseContextAtom`)
  - 훅: `use*` (예: `useContextAtom`, `useAtomSubscription`)
  - 타입 파라미터: `T` 프리픽스 (예: `TAtoms`, `TKey`)
- **자료구조 선택**:
  - `Set`: 리스너 관리 (O(1) add/remove)
  - `Map`: Atom 스토어 관리
- **Class vs Function**: core는 Class, react는 Factory Function + Hook
- Prettier ^3.5.3 기본 설정 사용

### Development Workflow Rules

- **모노레포 빌드 순서**: core → react → playground (`dependsOn: ["^build"]`)
- 개별 패키지 빌드: `pnpm --filter @context-query/{package} build`
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- 버전 커밋 메시지: `chore: bump all packages to v{version}`
- Git 태그: `{package}-v{version}` (예: `core-v0.5.1`)
- 배포: GitHub Actions `publish.yml` → manual workflow_dispatch
- 릴리스 타입: `patch | minor | major | prerelease`

### Critical Don't-Miss Rules

- **core 패키지에 외부 런타임 의존성 추가 절대 금지** (Zero Dependencies 원칙)
- `===` 대신 반드시 `Object.is()`로 값 비교
- Context 없이 훅 사용 시 에러 throw — null 체크 필수 (`if (!store) throw new Error(...)`)
- `useSyncExternalStore`의 3번째 인자(서버 스냅샷)에 `getSnapshot`과 동일 함수 전달 (SSR 지원)
- `useSyncExternalStore`의 subscribe/getSnapshot은 반드시 `useCallback`으로 감쌀 것
- `patch()`는 존재하지 않는 키를 조용히 무시 (에러 없음)
- 스냅샷 캐시는 어떤 atom이든 변경되면 `snapshotStale = true` 처리
- **성능 규칙:**
  - Write-Only 훅은 구독하지 않음 → 리렌더링 없음
  - Read-Only 훅은 setter를 생성하지 않음 → 불필요한 메모리 할당 방지
  - 개별 atom 구독 > 전체 스냅샷 구독 (granular re-rendering 우선)

---

## Usage Guidelines

**For AI Agents:**

- 코드 구현 전에 반드시 이 파일을 읽을 것
- 모든 규칙을 정확히 따를 것
- 불확실한 경우 더 제한적인 옵션을 선택할 것
- 새로운 패턴이 등장하면 이 파일을 업데이트할 것

**For Humans:**

- 이 파일은 에이전트의 필요에 맞게 간결하게 유지할 것
- 기술 스택이 변경될 때 업데이트할 것
- 분기별로 오래된 규칙이 없는지 검토할 것
- 시간이 지나 자명해진 규칙은 제거할 것

Last Updated: 2026-02-13
