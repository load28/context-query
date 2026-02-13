---
stepsCompleted: [1, 2]
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
