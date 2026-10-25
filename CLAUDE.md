# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md`에 명시된 대로, 이 프로젝트의 Next.js(16.x, `package.json`은 `latest`)는 학습 데이터와 다르다. 코드를 작성하기 전에 `node_modules/next/dist/docs/`의 관련 문서를 먼저 확인하고 deprecation 안내를 따른다.

## 명령어

```bash
npm run dev            # 개발 서버 (Turbopack, localhost:3000)
npm run build          # 프로덕션 빌드
npm run typecheck      # tsc --noEmit
npm run lint           # eslint --max-warnings=0 (경고도 실패)
npm run format:check   # prettier 검사 (수정은 npm run format)
npm run test           # vitest run (jsdom)
npm run check          # typecheck + lint + format:check + test 한 번에
npm run test:e2e       # Playwright (chromium, dev 서버 자동 기동)
npm run knip           # 미사용 파일·export·의존성 검출

npx vitest run lib/utils.test.ts          # 단일 단위 테스트 파일
npx vitest run -t "테스트 이름"            # 이름으로 필터
npx playwright test e2e/home.spec.ts      # 단일 e2e 파일
```

- 단위 테스트는 대상 파일 옆에 `*.test.ts(x)`로 두고, e2e는 `e2e/*.spec.ts`. Vitest는 `e2e`, `.agents`를 제외한다.
- Git 훅(Husky): `pre-commit`은 lint-staged(eslint --fix + prettier), `commit-msg`는 commitlint, `pre-push`는 `typecheck && lint`. `--no-verify`는 settings에서 deny되어 있다.
- 커밋 메시지는 컨벤셔널 형식 `타입: 제목` / `타입(scope): 제목`, 제목은 한국어 허용, 헤더 100자 이내.
- CI(`.github/workflows/ci.yml`)는 typecheck → lint → format:check → test → build 순서로 실행하며 빌드에는 placeholder Supabase 환경변수를 주입한다.

## 환경 변수

`.env.example`을 참고해 `.env.local`(또는 `.env`)에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정한다. 둘이 없으면 `lib/utils.ts`의 `hasEnvVars`가 false가 되어 `proxy.ts`의 세션 검사를 건너뛴다. `DATA_DIR`, `TEMPLATES_USE`, `ENABLE_GUI`는 shrimp MCP용이다.

## 아키텍처

Next.js App Router + Supabase 쿠키 기반 인증 starter에서 출발한 프로젝트. `src/` 없이 루트에 `app/`, `components/`, `lib/`가 있고 import alias는 `@/*` → 루트.

- **`proxy.ts`** (Next 16의 `middleware` 대체): 모든 요청(정적 자산 제외)에 `lib/supabase/proxy.ts`의 `updateSession`을 실행한다. 여기서 `supabase.auth.getClaims()`로 세션을 갱신하고, 비로그인 사용자가 `/`, `/login*`, `/auth*` 외 경로에 접근하면 `/auth/login`으로 리다이렉트한다. `createServerClient`와 `getClaims()` 사이에 코드를 넣지 말고, 반환하는 `supabaseResponse`의 쿠키를 그대로 유지해야 세션이 끊기지 않는다.
- **Supabase 클라이언트** (`lib/supabase/`): `client.ts`(브라우저), `server.ts`(서버 컴포넌트/액션/라우트 핸들러), `proxy.ts`(요청 전처리). 서버 클라이언트는 전역 변수에 저장하지 말고 요청마다 새로 만든다.
- **`app/auth/*`**: 로그인·가입·비밀번호 재설정 페이지와 이메일 확인용 `confirm/route.ts`. `app/protected/`는 인증 필요 영역.
- **`components/ui/`**: shadcn/ui `base-nova` 스타일, **Radix가 아닌 Base UI**(`@base-ui/react`) 기반이며 CLI로 추가한다. knip과 coverage 대상에서 제외된다. `components/tutorial/`은 starter 안내용으로 정리 대상.
- **스타일**: Tailwind v4 (`tailwind.config.ts` 없음, `@tailwindcss/postcss` + `app/globals.css`), 클래스 병합은 `lib/utils.ts`의 `cn()`, 테마는 `next-themes`(`attribute="class"`).

아직 없는 것: `supabase/` 마이그레이션·DB 타입, 폼 검증 라이브러리(`zod`, `react-hook-form`), `hooks/`, `public/`.

## 문서와 에이전트 설정

- `docs/guides/`에 `project-structure.md`(폴더 구조·네이밍·품질 게이트), `nextjs-16.md`, `component-patterns.md`, `styling-guide.md`, `forms-react-hook-form.md`가 있다. 구조나 컨벤션을 바꾸기 전에 해당 가이드를 먼저 읽는다.
- `.claude/agents/{dev,docs}/`에 서브 에이전트(code-reviewer, development-planner, nextjs-app-router-expert, ui-markup-specialist, prd-generator, prd-validator), `.claude/hooks/`에 포맷·알림·종료 훅이 있다. `.agents/skills/`는 shadcn·supabase 스킬 사본이며 lint/test/knip 대상에서 제외된다.
- 응답과 커밋 메시지는 한국어를 사용한다(`.claude/settings.json`의 `language: ko`).
