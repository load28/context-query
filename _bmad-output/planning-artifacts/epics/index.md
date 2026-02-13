# Epic Index — context-query v1.0 Roadmap

## Overview

Product Brief의 3-Phase 로드맵을 6개 에픽, 28개 스토리로 분해.

```
Phase 1 (Foundation, v0.6~v0.8)
├── Epic 1: 테스트 인프라 구축 ──────────────── P0, 7 stories
├── Epic 2: 파생 Atom 및 의존성 추적 ────────── P0, 5 stories (depends: E1)
├── Epic 3: 셀렉터, 커스텀 동등성, Atom 리셋 ── P0, 4 stories (depends: E1)
└── Epic 4: DevTools 통합 (4.1~4.2) ─────────── P1, 2 stories (depends: E1)

Phase 2 (Robustness, v0.9)
├── Epic 4: 에러 핸들링 (4.3~4.4) ──────────── P1, 2 stories (depends: E1,E2)
├── Epic 5: 라이프사이클 및 유틸리티 ─────────── P1, 5 stories (depends: E1,E2,E3)
└── Epic 6: SSR 지원 (6.1) ─────────────────── P2, 1 story (depends: E1~E5)

Phase 3 (v1.0 Release)
└── Epic 6: 문서, 생태계 완성 (6.2~6.7) ────── P2, 6 stories (depends: E1~E5)
```

## Dependency Graph

```
E1 (테스트) ─┬──→ E2 (파생 atom)─┬──→ E4.3~4.4 (에러) ──→ E5 (유틸리티) ──→ E6 (SSR/문서)
             ├──→ E3 (셀렉터)  ──┘
             └──→ E4.1~4.2 (DevTools)
```

## Epic Summary

| # | Epic | Phase | Priority | Stories | 핵심 산출물 |
|---|------|-------|----------|---------|-------------|
| 1 | [테스트 인프라](./epic-1-test-infrastructure.md) | 1 | P0 | 7 | Vitest 설정, core/react 전체 테스트, 타입 테스트 |
| 2 | [파생 Atom](./epic-2-derived-atoms.md) | 1 | P0 | 5 | `derived()`, 의존성 추적, 글리치 프리 재계산 |
| 3 | [셀렉터/동등성/리셋](./epic-3-selector-equality-reset.md) | 1 | P0 | 4 | `useContextAtomSelector`, `shallowEqual`, `RESET` |
| 4 | [DevTools/에러](./epic-4-devtools-error-handling.md) | 1+2 | P1 | 4 | `useDebugValue`, 에러 격리, Error Boundary 통합 |
| 5 | [라이프사이클/유틸리티](./epic-5-lifecycle-utilities.md) | 2 | P1 | 5 | `onMount`, `atomWithReducer`, `atomWithStorage`, TS 유틸 타입 |
| 6 | [SSR/문서/생태계](./epic-6-ssr-docs-ecosystem.md) | 2+3 | P2 | 7 | `useHydrateAtoms`, `splitAtom`, `atomFamily`, API 문서, 가이드 |

**Total: 6 Epics, 32 Stories**
