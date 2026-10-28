# Development Guidelines

## 프로젝트 개요

- 프로젝트: hkoikoi.dev. 개인 이력 공개 + 관리자 1인 마크다운 블로그 사이트.
- 스택: Next.js 16.x(App Router, Turbopack, `cacheComponents: true`), React 19, TypeScript strict, Tailwind v4, shadcn/ui `base-nova`(**Base UI**, Radix 아님), Supabase(`@supabase/ssr`, 쿠키 인증), Vitest, Playwright.
- 기준 문서: 기능 ID(F001~F014)는 `docs/PRD.md`, Task·라우트 맵은 `docs/ROADMAP.md`.
- 응답, 커밋 메시지, 주석, 문서는 **한국어**로 작성한다.

## 작업 시작 전 필수 확인

- Next.js 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 관련 문서와 `docs/guides/nextjs-16.md`를 읽는다. 학습 데이터의 Next.js 지식을 신뢰하지 않는다.
- 구조·컨벤션을 바꾸기 전에 해당 가이드를 읽는다.

| 작업 종류               | 먼저 읽을 파일                                             |
| ----------------------- | ---------------------------------------------------------- |
| 폴더 구조, 네이밍       | `docs/guides/project-structure.md`                         |
| 라우트, 캐시, 서버 경계 | `docs/guides/nextjs-16.md`                                 |
| 컴포넌트 설계           | `docs/guides/component-patterns.md`                        |
| 스타일링                | `docs/guides/styling-guide.md`                             |
| 폼                      | `docs/guides/forms-react-hook-form.md`                     |
| 기능 범위·수락 기준     | `docs/PRD.md`, `docs/ROADMAP.md`                           |
| DB, RLS, Auth           | `.claude/skills/supabase`, `supabase-expert` 서브 에이전트 |

## 디렉터리 규칙

- `src/`를 만들지 않는다. 루트의 `app/`, `components/`, `lib/`를 쓰고 import alias는 `@/*` → 루트.
- 파일·폴더는 kebab-case. 컴포넌트명은 PascalCase, 훅은 `use` 접두 camelCase.
- 단위 테스트는 대상 파일 옆 `*.test.ts(x)`. e2e는 `e2e/*.spec.ts`.
- 한 라우트에서만 쓰는 컴포넌트는 그 폴더의 `_components/`에 둔다.
- 공개 페이지는 Route Group `app/(site)/`, 관리자는 `app/admin/`, 인증은 `app/auth/`(ROADMAP 라우트 맵 기준).
- 정적 데이터(이력·프로젝트·논문)는 `data/*.ts`에 둔다.
- import 방향은 `components/ui` ← `components/<domain>` ← `app/` 단방향만 허용한다.
- 새 디렉터리는 필요해질 때만 만든다: `lib/schemas/`, `lib/types/`, `lib/queries/`, `hooks/`, `supabase/`.
- DB 타입은 Supabase MCP `generate_typescript_types`로 생성해 `lib/supabase/database.types.ts`에 둔다.

## Next.js 16 규칙

- 요청 전처리는 루트 `proxy.ts`만 사용한다. **`middleware.ts`를 만들지 않는다.**
- `tailwind.config.ts`를 만들지 않는다. 테마는 `app/globals.css`의 `@theme inline`에서 정의한다.
- `params`, `searchParams`는 Promise다. `await` 하거나 `PageProps<'/경로'>` / `LayoutProps<'/경로'>` 헬퍼를 쓴다(`npx next typegen`).
- 쿠키·Supabase 세션 등 요청 시점 데이터를 읽는 컴포넌트는 `<Suspense>`로 감싼다.
- 라우트 세그먼트 설정 `dynamic`, `revalidate`, `fetchCache`, `runtime`을 쓰지 않는다.
- `loading.tsx`, `error.tsx`, `not-found.tsx`는 필요할 때만 추가한다.
- `AGENTS.md`의 `nextjs-agent-rules` 블록은 `next dev`가 관리한다. 삭제하지 않고, 변경분이 생기면 함께 커밋한다.

## Supabase / 인증 규칙

- 클라이언트 3종: `lib/supabase/client.ts`(브라우저), `server.ts`(서버 컴포넌트·액션·라우트 핸들러), `proxy.ts`(요청 전처리).
- 서버 클라이언트는 **요청마다 새로 만든다.** 모듈 전역 변수에 저장하지 않는다.
- `lib/supabase/server.ts`를 Client Component에서 import하지 않는다.
- `lib/supabase/proxy.ts`의 `updateSession()`에서 `createServerClient`와 `supabase.auth.getClaims()` 사이에 코드를 넣지 않는다. 반환하는 `supabaseResponse`의 쿠키를 그대로 유지한다.
- 접근 정책(ROADMAP 기준): proxy는 **`/admin` 경로만** 비로그인 시 `/auth/login`으로 리다이렉트한다. 공개 경로를 추가하면 `updateSession()` 조건을 함께 고친다.
- 관리자 역할 검사는 서버 코드(`requireAdmin()`)와 RLS가 담당한다. 비관리자는 `notFound()`로 처리한다. proxy 검사만 믿지 않는다.
- 새 테이블은 반드시 RLS를 켜고 정책을 작성한다. 스키마 변경 전에 `list_tables`로 현재 상태를 확인하고, 변경 후 `get_advisors`로 검증한다.
- 환경 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. 새 키는 `.env.example`에 키 이름만 추가한다. 비밀 값에 `NEXT_PUBLIC_` 접두를 붙이지 않는다.
- `.env`, `.env.*.local`은 읽거나 수정하지 않는다.

## UI / 스타일 규칙

- `components/ui/`는 **`npx shadcn@latest add <name>`로만 추가·갱신**한다. 직접 작성·수정하지 않는다. Radix 기반 코드를 가져오지 않는다.
- 클래스 병합은 `import { cn } from "@/lib/utils"`만 사용한다.
- 테마는 `next-themes`(`attribute="class"`). 색상은 `globals.css`의 CSS 변수/토큰을 쓰고 하드코딩 색상을 쓰지 않는다.
- starter 잔재(`components/tutorial/`, `deploy-button`, `hero`, `next-logo`, `supabase-logo`, `env-var-warning`, `app/protected/`)는 Task 002에서 모두 삭제했다. 되살리지 않는다.
- `hasEnvVars`는 `lib/supabase/proxy.ts`의 지역 상수다. `lib/utils.ts`로 되돌리거나 `lib/env.ts`로 통합하지 않는다(근거: ROADMAP "알려진 트레이드오프").

## 폼 / 검증

- `zod`, `react-hook-form`은 아직 없다. 폼 작업 시 `docs/guides/forms-react-hook-form.md`를 따르고 의존성을 `package.json`에 추가한다.

## 품질 게이트

- 작업 완료 전 `npm run check`(typecheck → lint → format:check → test)를 통과시킨다.
- 라우트·의존성을 바꾼 경우 `npm run build`, `npm run knip`도 통과시킨다.
- eslint는 `--max-warnings=0`이다. 경고도 실패다.
- API·비즈니스 로직 작업은 Playwright MCP(`mcp__playwright__*`)로 정상/오류/엣지 시나리오를 테스트한다. 도구를 못 쓰면 수동 확인으로 대체하고 ROADMAP `테스트 결과`에 명시한다.
- 관리자 E2E 자격 증명은 `.env.local`의 `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`. E2E는 CI에서 돌리지 않는다.

## Git / 커밋

- 커밋 형식: `타입: 제목` 또는 `타입(scope): 제목`. 제목은 한국어 허용, 헤더 100자 이내(commitlint).
- **`--no-verify`, `-n`, `git push --force`, `git reset --hard`, `rm -rf`를 쓰지 않는다**(settings에서 deny).
- 커밋·브랜치·PR은 `git-commit`, `git-branch`, `git-pr` 스킬을 사용한다.
- 사용자가 요청하기 전에 커밋·push하지 않는다.

## 함께 수정해야 하는 파일

| 변경                      | 같이 수정                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| 라우트 경로 추가·변경     | `docs/ROADMAP.md` 라우트 맵, `lib/site-config.ts` 헤더 메뉴, `lib/supabase/proxy.ts` 접근 조건 |
| 공개/보호 경로 정책 변경  | `lib/supabase/proxy.ts`, `docs/guides/project-structure.md`                                    |
| 폴더 구조·컨벤션 변경     | `docs/guides/project-structure.md`, `CLAUDE.md`                                                |
| 새 환경 변수              | `.env.example`, `.github/workflows/ci.yml`(빌드에 필요한 경우), `CLAUDE.md`                    |
| 새 npm 스크립트·품질 도구 | `CLAUDE.md` 명령어 섹션, `.github/workflows/ci.yml`                                            |
| 기능 구현 완료            | `docs/ROADMAP.md` Task 체크(✅)와 `테스트 결과` 갱신                                           |
| 기능 범위 변경            | `docs/PRD.md` 먼저, 그 다음 `docs/ROADMAP.md`                                                  |
| DB 스키마 변경            | 마이그레이션, `lib/supabase/database.types.ts` 재생성, RLS 정책                                |
| 의존성 추가·제거          | `package.json`, `package-lock.json`, `npm run knip` 통과                                       |

## ROADMAP 작업 흐름

- 구현은 `docs/ROADMAP.md`의 Task 명세(관련 파일, 수락 기준, 구현 사항)를 따른다.
- 새 Task의 체크박스는 비우고 `테스트 결과`는 `(미수행)`으로 둔다. 완료된 Task만 체크와 결과 요약을 반영한다.
- **Task 하나를 끝내면 중단하고 사용자의 다음 지시를 기다린다.** 다음 Task로 자동 진행하지 않는다.

## AI 의사결정 기준

- 공개 페이지를 추가할 때: `app/(site)/` 아래 생성 → 라우트 맵 갱신 → proxy 접근 조건 확인.
- 컴포넌트 위치를 정할 때: 한 페이지 전용이면 `_components/` → 여러 곳에서 쓰면 `components/<domain>/` → 순수 UI면 shadcn CLI로 `components/ui/`.
- 서버/클라이언트를 정할 때: 기본은 Server Component. 상태·이벤트·브라우저 API가 필요한 최소 단위만 `"use client"`.
- 스키마·RLS·Auth 작업은 `supabase-expert`, 라우팅·캐시는 `nextjs-app-router-expert`, 정적 마크업은 `ui-markup-specialist`, 변경분 리뷰는 `code-reviewer`에 위임할 수 있다.
- 요구사항이 모호하면 PRD → ROADMAP → 가이드 순으로 확인하고, 그래도 불명확할 때만 사용자에게 묻는다.

## 금지 사항

- `middleware.ts`, `tailwind.config.ts`, `src/` 디렉터리 생성.
- `components/ui/*` 직접 편집, Radix UI 패키지 추가.
- `dynamic`/`revalidate`/`fetchCache`/`runtime` 세그먼트 설정 사용.
- Supabase 클라이언트의 모듈 전역 저장, `updateSession()`의 `getClaims()` 앞뒤 임의 코드 삽입.
- RLS 없는 테이블 생성, 서비스 롤 키의 클라이언트 노출.
- `.env` 읽기·수정, 비밀 값에 `NEXT_PUBLIC_` 사용.
- lint 경고 방치, `--no-verify` 커밋.
- `.agents/`, `e2e/` 외 영역에서 Vitest가 제외된 경로에 단위 테스트 배치.

```
OK : app/(site)/projects/page.tsx → data/projects.ts에서 읽기 → components/projects/project-card.tsx
NG : app/projects/page.tsx 생성 후 proxy 접근 조건·라우트 맵 미갱신
OK : npx shadcn@latest add dialog
NG : components/ui/dialog.tsx를 직접 작성
```
