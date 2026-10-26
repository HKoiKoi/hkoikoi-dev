# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md`에 명시된 대로, 이 프로젝트의 Next.js(16.x, `package.json`은 `latest`)는 학습 데이터와 다르다. 코드를 작성하기 전에 `node_modules/next/dist/docs/`의 관련 문서를 먼저 확인하고 deprecation 안내를 따른다.

## 프로젝트

hkoikoi.dev: 개인 이력(학력·경력·프로젝트·논문 등)을 공개하고, 관리자 1인이 마크다운으로 블로그 글을 작성·발행하는 사이트. 기능 명세는 `docs/PRD.md`(기능 ID F001~F014), 진행 상황은 `docs/ROADMAP.md`가 기준이다. 작업을 시작하기 전에 ROADMAP의 해당 Task와 "공통 규칙"을 읽는다.

## 명령어

```bash
npm run dev            # 개발 서버 (Turbopack, localhost:3000)
npm run build          # 프로덕션 빌드
npm run typecheck      # next typegen && tsc --noEmit
npm run lint           # eslint --max-warnings=0 (경고도 실패)
npm run format:check   # prettier 검사 (수정은 npm run format)
npm run test           # vitest run (jsdom)
npm run check          # typecheck + lint + format:check + test 한 번에
npm run test:e2e       # Playwright (chromium, dev 서버 자동 기동)
npm run knip           # 미사용 파일·export·의존성 검출 (설정: knip.jsonc)

npx vitest run lib/format-date.test.ts    # 단일 단위 테스트 파일
npx vitest run -t "테스트 이름"            # 이름으로 필터
npx playwright test e2e/routes.spec.ts    # 단일 e2e 파일
```

- 단위 테스트는 대상 파일 옆에 `*.test.ts(x)`로 두고, e2e는 `e2e/*.spec.ts`(`home`, `routes`, `static-pages`). Vitest는 `e2e`, `.agents`를 제외한다.
- Git 훅(Husky): `pre-commit`은 lint-staged(eslint --fix --max-warnings=0 + prettier), `commit-msg`는 commitlint, `pre-push`는 `typecheck && lint`. `--no-verify`는 settings에서 deny되어 있다.
- 커밋 메시지는 컨벤셔널 형식 `타입: 제목` / `타입(scope): 제목`, 제목은 한국어 허용, 헤더 100자 이내.
- CI(`.github/workflows/ci.yml`)는 typecheck → lint → format:check → test → build 순서로 실행하며 빌드에는 placeholder Supabase 환경변수를 주입한다. E2E와 knip은 CI에서 실행하지 않으므로 로컬에서 돌린다.

## 환경 변수

`.env.example`을 참고해 `.env.local`(또는 `.env`)에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정한다. 둘이 없으면 `lib/utils.ts`의 `hasEnvVars`가 false가 되어 `lib/supabase/proxy.ts`의 세션 검사를 건너뛴다. `DATA_DIR`, `TEMPLATES_USE`, `ENABLE_GUI`는 shrimp MCP용이다. `.env`는 settings에서 읽기가 막혀 있다.

## 아키텍처

Next.js App Router + Supabase. `src/` 없이 루트에 `app/`, `components/`, `lib/`, `data/`가 있고 import alias는 `@/*` → 루트.

- **`proxy.ts`** (Next 16의 `middleware` 대체): 모든 요청(정적 자산·`robots.txt`·`sitemap.xml` 제외)에 `lib/supabase/proxy.ts`의 `updateSession`을 실행한다. 여기서 `supabase.auth.getClaims()`로 세션을 갱신하고, 비로그인 사용자가 **`/admin` 또는 `/admin/*`** 에 접근하면 `/auth/login`으로 리다이렉트한다. 나머지 경로는 공개다. `createServerClient`와 `getClaims()` 사이에 코드를 넣지 말고, 반환하는 `supabaseResponse`의 쿠키를 그대로 유지해야 세션이 끊기지 않는다. 관리자 역할 검사는 proxy가 아니라 서버 코드(`requireAdmin()`, Task 011 예정)와 RLS가 맡는다(현재 `app/admin/layout.tsx`에는 TODO만 있다).
- **라우트**: `app/(site)/`(공개 10개 경로와 `blog/[slug]`, 공통 헤더·푸터), `app/admin/`(글 관리 `posts`, 편집기 `posts/edit`), `app/auth/`(`login`, `error`만 존재). 회원가입·비밀번호 재설정·`app/protected/`는 삭제됐다. 한 라우트 전용 컴포넌트는 그 폴더의 `_components/`.
- **Supabase**: 클라이언트는 `lib/supabase/`의 `client.ts`(브라우저), `server.ts`(서버 컴포넌트/액션/라우트 핸들러), `proxy.ts`(요청 전처리)이며 모두 `Database` 제네릭이 적용돼 있다. 서버 클라이언트는 전역 변수에 저장하지 말고 요청마다 새로 만든다. `lib/supabase/database.types.ts`는 `generate_typescript_types`로 만든 생성 파일이라 직접 편집하지 않는다. 스키마는 `supabase/migrations/`(파일명 version은 원격과 일치)에서 관리하고, 적용 후 advisor를 확인한다.
- **데이터**: `posts` 테이블(RLS: 공개 조회는 `published = true`, 쓰기는 `app_metadata.role = 'admin'`만)과 `blog-images` 버킷이 원격에 적용돼 있다. 관리자 판별에 `user_metadata`는 쓰지 않는다. 이력·프로젝트·논문은 DB가 아니라 `data/*.ts` 정적 데이터이고, 블로그 글은 아직 `lib/dummy/posts.ts` 더미를 읽는다(DB 연동은 Task 012). 도메인 타입은 `lib/types/`(`post.ts`는 `Tables<'posts'>`에서 파생).
- **`components/`**: `ui/`(shadcn/ui `base-nova`, **Radix가 아닌 Base UI**(`@base-ui/react`) 기반, CLI로 추가, knip·coverage 대상 제외), 도메인별 `blog/`, `content/`, `layout/`, 루트에는 인증·테마 컴포넌트(`login-form`, `logout-button`, `auth-button`, `theme-switcher`). import 방향은 `ui` ← 도메인 ← `app/` 단방향.
- **스타일**: Tailwind v4 (`tailwind.config.ts` 없음, `@tailwindcss/postcss` + `app/globals.css`), 클래스 병합은 `lib/utils.ts`의 `cn()`, 테마는 `next-themes`(`attribute="class"`), 폰트는 Noto Sans KR(`app/layout.tsx`).
- **Next 설정**: `cacheComponents: true`. 요청 시점 데이터(`cookies()`, `params`, `searchParams`, Supabase 세션)를 읽는 컴포넌트는 `<Suspense>`로 감싸고, `dynamic`/`revalidate` 세그먼트 설정은 쓰지 않는다.

아직 없는 것: 폼 검증 라이브러리(`zod`, `react-hook-form`), 마크다운 렌더링 의존성, `lib/queries/`(DB 조회), `hooks/`, `public/`. 관리자 로그인 후 권한 검증, 글 저장·삭제, 이미지 업로드, SEO는 ROADMAP Task 011~019에서 구현한다.

## 알려진 예외

- Supabase advisor 보안 경고 `auth_leaked_password_protection`은 Pro 플랜 미사용으로 예외 수용했다. 완화책으로 회원가입 차단, 최소 비밀번호 12자, 대소문자·숫자·기호 필수를 적용했다. 새 advisor 경고가 생기면 이 항목과 별개로 처리한다.
- `knip.jsonc`의 임시 예외(`auth-button`, `logout-button`, `lib/supabase/server.ts`, `lib/types/post.ts`)는 사용처가 생기면 제거한다. 각 항목에 제거 조건이 주석으로 적혀 있다.

## 문서와 에이전트 설정

- `docs/PRD.md`(기능 명세), `docs/ROADMAP.md`(Task별 진행 상황·테스트 결과), `docs/guides/`에 `project-structure.md`(폴더 구조·네이밍·품질 게이트), `nextjs-16.md`, `component-patterns.md`, `styling-guide.md`, `forms-react-hook-form.md`가 있다. 구조나 컨벤션을 바꾸기 전에 해당 가이드를 먼저 읽고, 구조가 바뀌면 `project-structure.md`도 함께 갱신한다. Task를 마치면 ROADMAP의 체크박스와 테스트 결과를 실제 결과로 갱신하며, 확인하지 않은 항목은 완료로 체크하지 않는다.
- `.claude/agents/{dev,docs}/`에 서브 에이전트(code-reviewer, development-planner, nextjs-app-router-expert, supabase-expert, ui-markup-specialist, prd-generator, prd-validator), `.claude/hooks/`에 포맷·알림·종료 훅, `.claude/skills/`에 git 작업(branch·commit·pr)·shadcn·supabase 스킬이 있다. `.agents/skills/`는 shadcn·supabase 스킬 사본이며 lint/test/knip 대상에서 제외된다.
- `.mcp.json`에는 sequential-thinking, shrimp-task-manager, supabase(프로젝트 고정) MCP가 등록돼 있다. DB 변경은 Supabase MCP의 `apply_migration`으로 적용하되, 원격 프로젝트가 맞는지 먼저 확인한다.
- 응답과 커밋 메시지는 한국어를 사용한다(`.claude/settings.json`의 `language: ko`).
