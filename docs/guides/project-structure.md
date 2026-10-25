# 프로젝트 구조 가이드

이 문서는 `hkoikoi-dev`의 실제 폴더 구조, 네이밍 컨벤션, 품질 게이트를 정의합니다.
이 프로젝트는 Next.js + Supabase 인증 starter에서 출발했고, `src/` 없이 루트에 `app/`, `components/`, `lib/`를 둡니다.

## 현재 스택

| 항목       | 버전 / 설정                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| Next.js    | 16.4 (`package.json`은 `latest`, 설치된 버전 16.4.3). App Router, Turbopack         |
| React      | 19.3                                                                                |
| TypeScript | 5, `strict`                                                                         |
| Tailwind   | 4.3 (`postcss.config.mjs`의 `@tailwindcss/postcss`, `tailwind.config.ts` 없음)      |
| shadcn/ui  | `base-nova` 스타일, **Base UI**(`@base-ui/react`) 기반                              |
| 백엔드     | Supabase (`@supabase/ssr`, `@supabase/supabase-js`), 쿠키 기반 인증                 |
| 유틸리티   | `clsx` + `tailwind-merge`(`cn`), `class-variance-authority`, `lucide-react`         |
| 테마       | `next-themes` (`attribute="class"`), `tw-animate-css`                               |
| 린트·포맷  | ESLint 9 flat config, Prettier(+ tailwind 플러그인), Husky, lint-staged, commitlint |
| 정적 분석  | knip (미사용 파일·export·의존성 검출)                                               |
| 테스트     | Vitest 5 + Testing Library(jsdom), Playwright(chromium)                             |
| 런타임     | Node `>=20.9` (`.nvmrc`는 24)                                                       |

아직 없는 것(필요할 때 추가): DB 스키마·마이그레이션(`supabase/` 폴더 없음), 생성된 DB 타입, 폼 검증 라이브러리(`zod`, `react-hook-form`), `hooks/`, `public/`.

## 전체 구조

```
hkoikoi-dev/
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트 (CLI로 추가)
│   ├── tutorial/           # starter 안내용 (정리 대상)
│   └── *.tsx               # 인증 폼, AuthButton, ThemeSwitcher 등
├── lib/
│   ├── supabase/           # client.ts / server.ts / proxy.ts
│   ├── utils.ts            # cn(), hasEnvVars
│   └── utils.test.ts       # 단위 테스트는 대상 파일 옆에 둔다
├── e2e/                    # Playwright 테스트 (*.spec.ts)
├── docs/guides/            # 개발 가이드
├── proxy.ts                # 요청 전처리: Supabase 세션 갱신 + 비로그인 리다이렉트
├── next.config.ts          # cacheComponents + bundle analyzer
├── components.json         # shadcn/ui 설정
├── eslint.config.mjs       # ESLint flat config
├── vitest.config.mts       # Vitest 설정 (+ vitest.setup.ts)
├── playwright.config.ts    # Playwright 설정
├── knip.json               # knip 설정
├── commitlint.config.mjs   # 커밋 메시지 규칙
├── .husky/                 # pre-commit, commit-msg, pre-push
├── .github/workflows/      # CI (ci.yml)
├── .agents/skills/         # 에이전트 스킬 (shadcn, supabase 등)
├── .claude/                # Claude Code 권한·훅·스킬 설정
├── .mcp.json               # MCP 서버 (supabase)
├── AGENTS.md               # 에이전트 지침 (Next.js 번들 문서 안내)
└── .env / .env.example     # 환경 변수
```

- `tailwind.config.ts`는 없습니다. 테마는 `app/globals.css`의 `@theme inline`에서 정의합니다.
- `middleware.ts`는 만들지 않습니다. 요청 전처리는 루트의 `proxy.ts`가 맡습니다.
- `AGENTS.md`의 `next dev`가 관리하는 블록은 직접 지우지 말고 변경분을 함께 커밋합니다.
- `.env`는 `.gitignore` 대상이며 에이전트가 읽지 못하도록 `.claude/settings.json`에서 막혀 있습니다. 키 이름은 `.env.example`로 공유합니다.

## app/ — 라우트

```
app/
├── layout.tsx              # 루트 레이아웃 (ThemeProvider, Geist 폰트, 메타데이터)
├── page.tsx                # / (starter 홈)
├── globals.css             # Tailwind v4 + shadcn 테마 변수
├── opengraph-image.png / twitter-image.png / favicon.ico
├── auth/                   # 인증 흐름 (비로그인 접근 허용)
│   ├── login/ sign-up/ sign-up-success/
│   ├── forgot-password/ update-password/
│   ├── confirm/route.ts    # 이메일 링크의 token_hash 검증 (Route Handler)
│   └── error/
└── protected/              # 로그인 필요. layout.tsx + page.tsx
```

파일 규칙:

- `page.tsx` 라우트의 UI, `layout.tsx` 공유 레이아웃, `route.ts` Route Handler.
- `loading.tsx`, `error.tsx`, `not-found.tsx`는 필요할 때만 추가합니다.
- `params`, `searchParams`는 Promise이므로 `await` 하거나 `PageProps<'/경로'>` / `LayoutProps<'/경로'>` 헬퍼를 사용합니다. 타입은 `npx next typegen`으로 생성합니다 (기존 starter 코드는 `Readonly<{ children }>`나 `Promise<...>`를 직접 타이핑하지만, 새 코드는 헬퍼를 사용합니다).
- Cache Components가 켜져 있으므로 요청 시점 데이터(쿠키, Supabase 세션 등)를 읽는 컴포넌트는 `<Suspense>`로 감쌉니다 (`nextjs-16.md`).
- 라우트 세그먼트 설정 `dynamic`, `revalidate`, `fetchCache`, `runtime`은 사용하지 않습니다.
- 한 라우트에서만 쓰는 컴포넌트는 그 폴더의 `_components/`에 둘 수 있습니다 (`_` 접두 폴더는 라우팅 제외).
- URL에 영향 없이 레이아웃만 나누려면 Route Group `(group)`을 사용합니다.

### 로그인 필요 여부는 `proxy.ts`가 정한다

`lib/supabase/proxy.ts`의 `updateSession()`은 로그인하지 않은 사용자가 아래 경로 **외**를 요청하면 `/auth/login`으로 리다이렉트합니다.

- 정확히 `/`
- `/login`으로 시작하는 경로
- `/auth`로 시작하는 경로

따라서 **새 공개 페이지(`/about`, `/pricing` 등)를 만들면 비로그인 상태에서 로그인 화면으로 튕깁니다.** 공개 경로를 추가할 때는 `updateSession()`의 조건을 같이 고칩니다. 반대로 로그인이 필요한 페이지는 `app/protected/` 아래에 두거나, 새 보호 영역을 만들면 그 경로가 기본 보호 대상이 됩니다.

proxy는 낙관적 검사일 뿐이므로 데이터 접근은 Supabase RLS와 서버 코드의 `getClaims()` 확인으로 한 번 더 막습니다.

## components/ — 컴포넌트

```
components/
├── ui/             # shadcn/ui: badge, button, card, checkbox, dropdown-menu, input, label
├── tutorial/       # starter 안내 화면 전용
└── *.tsx           # 현재는 평평하게 배치 (auth-button, login-form, theme-switcher …)
```

분류 규칙:

1. **`ui/`**: shadcn/ui 기반 순수 UI 컴포넌트. 비즈니스 로직 없이 props로 동작을 제어합니다. 추가는 `npx shadcn@latest add <name>`.
2. **`components/` 루트 또는 `components/<domain>/`**: 여러 페이지가 쓰는 컴포넌트. 현재 파일은 모두 루트에 있지만, 도메인 컴포넌트가 늘면 `components/<domain>/`(예: `components/auth/`)으로 묶습니다.
3. **라우트 전용 컴포넌트**: 한 페이지에서만 쓰면 해당 라우트의 `_components/`.
4. import 방향은 `components/ui` ← `components/*` ← `app/` 단방향입니다.

## lib/ — 유틸리티와 Supabase 클라이언트

```
lib/
├── supabase/
│   ├── client.ts   # createBrowserClient — Client Component 전용
│   ├── server.ts   # createServerClient + cookies() — Server Component / Action / Route Handler
│   └── proxy.ts    # proxy.ts에서 호출하는 updateSession()
├── utils.ts        # cn(), hasEnvVars
└── utils.test.ts
```

- `cn()`은 `clsx` + `tailwind-merge`로 `lib/utils.ts`에 직접 구현되어 있습니다. **모든 코드는 `import { cn } from "@/lib/utils"`를 사용**합니다 (`components/ui/*`도 동일).
- `hasEnvVars`는 starter용 검사입니다. Supabase 환경 변수를 설정한 뒤에는 제거해도 됩니다 (홈, `app/protected/layout.tsx`, `lib/supabase/proxy.ts`에서 참조 중).
- Supabase 클라이언트는 **요청마다 새로 만듭니다.** 모듈 전역 변수에 담지 않습니다 (`server.ts` 주석 참고).
- `lib/supabase/server.ts`는 `next/headers`를 쓰는 서버 전용 모듈이므로 Client Component에서 import하지 않습니다. 필요하면 상단에 `import "server-only"`를 추가합니다 (패키지 설치 필요).
- 스키마, 타입, 훅, 데이터 접근 코드가 생기면 `lib/schemas/`, `lib/types/`, `lib/queries/`, 루트 `hooks/`를 추가합니다 (`components.json`의 `hooks` 별칭은 `@/hooks`). DB 타입은 Supabase MCP의 `generate_typescript_types`로 생성해 `lib/supabase/database.types.ts`에 두는 구성을 권장합니다.

## 파일/폴더 네이밍

```bash
# 파일: kebab-case
login-form.tsx        # O
LoginForm.tsx         # X

# 폴더: 소문자 kebab-case
sign-up-success/      # O
signUpSuccess/        # X
```

컴포넌트 이름은 PascalCase(`LoginForm`), 훅은 `use` 접두사 camelCase(`useToggle`)입니다.

## 경로 별칭

`tsconfig.json`의 `"@/*": ["./*"]`와 `components.json`의 aliases를 따릅니다. 루트 기준이므로 `src`가 붙지 않습니다.

| 별칭              | 실제 경로                |
| ----------------- | ------------------------ |
| `@/components`    | `./components`           |
| `@/components/ui` | `./components/ui`        |
| `@/lib`           | `./lib`                  |
| `@/lib/utils`     | `./lib/utils.ts`         |
| `@/hooks`         | `./hooks` (필요 시 생성) |

```tsx
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
```

같은 폴더 안의 파일 외에는 상대 경로(`../../`) 대신 별칭을 사용합니다.

## 환경 변수

| 키                                     | 노출 범위 | 용도                                           |
| -------------------------------------- | --------- | ---------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | 브라우저  | Supabase 프로젝트 URL                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 브라우저  | publishable(또는 anon) 키. RLS가 보호를 담당함 |

- `NEXT_PUBLIC_` 접두 변수는 브라우저 번들에 포함됩니다. **service role 키 등 비밀 값에는 절대 붙이지 않습니다.**
- 새 키를 추가하면 `.env.example`에 키 이름(값 없이)도 추가합니다. CI의 `build` 단계에도 필요하면 `.github/workflows/ci.yml`의 `env`에 자리표시자 값을 넣습니다.
- `.env.example`에는 이제 쓰지 않는 shrimp-task-manager 항목(`DATA_DIR`, `TEMPLATES_USE`, `ENABLE_GUI`)이 남아 있습니다 (`.mcp.json`에는 supabase만 등록됨). 정리 대상입니다.

## 품질 게이트

### 스크립트

| 명령                    | 내용                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev` / `build` | 개발 서버 / 프로덕션 빌드 (Turbopack)                             |
| `npm run typecheck`     | `tsc --noEmit`                                                    |
| `npm run lint`          | `eslint . --max-warnings=0` (경고도 실패)                         |
| `npm run format:check`  | Prettier 검사 (`npm run format`으로 수정)                         |
| `npm run test`          | Vitest 1회 실행 (`test:watch`, `test:coverage`도 있음)            |
| `npm run test:e2e`      | Playwright (dev 서버를 자동 기동)                                 |
| `npm run check`         | typecheck → lint → format:check → test 순차 실행                  |
| `npm run knip`          | 미사용 파일·export·의존성 검출                                    |
| `npm run analyze`       | `ANALYZE=true next build --webpack` 번들 분석 (webpack 빌드 사용) |

### Git 훅과 CI

- `pre-commit`: `lint-staged` — 스테이징된 `ts/tsx/js/mjs`에 ESLint + Prettier, `json/css/md/yml`에 Prettier.
- `commit-msg`: `commitlint` — `타입: 제목` 또는 `타입(scope): 제목`. 제목은 한국어 가능, 헤더 100자 이내.
- `pre-push`: `typecheck` + `lint`.
- CI(`.github/workflows/ci.yml`): `typecheck` → `lint` → `format:check` → `test` → `build`. **E2E는 CI에서 실행하지 않습니다.**
- `.claude/settings.json`은 `--no-verify` 커밋과 force push를 막고, 파일을 Edit/Write 하면 포맷 훅을 실행합니다.

### 테스트 배치

- 단위/컴포넌트 테스트: 대상 파일 옆의 `*.test.ts(x)` (예: `lib/utils.test.ts`). 환경은 jsdom이고 `vitest.setup.ts`가 `jest-dom` 매처와 `cleanup`을 설정합니다.
- E2E: `e2e/*.spec.ts`. Vitest는 `e2e/`를 제외합니다.
- 커버리지는 `app/`, `components/`, `lib/`를 대상으로 하되 `components/ui/**`는 제외합니다.
- Server Component(async)는 Vitest로 직접 렌더링하기 어렵습니다. 로직은 함수로 분리해 단위 테스트하고, 화면 흐름은 E2E로 검증합니다.

## 새 파일 추가 규칙

| 대상                      | 위치                                                      |
| ------------------------- | --------------------------------------------------------- |
| 새 공개 페이지            | `app/<경로>/page.tsx` + `lib/supabase/proxy.ts` 예외 추가 |
| 로그인 필요 페이지        | `app/protected/<경로>/page.tsx`                           |
| Route Handler             | `app/<경로>/route.ts`                                     |
| Server Action             | 기능 옆 `actions.ts` (파일 최상단에 `"use server"`)       |
| 공통 UI                   | `components/ui/` (shadcn CLI)                             |
| 한 페이지 전용 컴포넌트   | 해당 라우트 폴더의 `_components/`                         |
| 여러 페이지 공용 컴포넌트 | `components/` (늘어나면 `components/<domain>/`)           |
| 단위 테스트               | 대상 파일 옆 `*.test.ts(x)`                               |
| E2E 테스트                | `e2e/<이름>.spec.ts`                                      |
| 정적 파일                 | `public/` (폴더 없음, 필요 시 생성)                       |
| 환경 변수                 | `.env` + `.env.example`에 키 이름 추가                    |

## 코드 조직 원칙

### import 순서

```tsx
// 1. 외부 라이브러리
import { Suspense } from "react";
import Link from "next/link";

// 2. 내부 모듈 (@/ 별칭)
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 3. 상대 경로
import { helper } from "./helper";
```

ESLint가 `consistent-type-imports`를 강제하므로 타입은 `import { type X }` 형태로 가져옵니다 (inline-type-imports). `console.log`는 경고(=CI 실패)이고 `console.warn/error`만 허용됩니다. 사용하지 않는 변수는 `_` 접두로 표시합니다.

### export 규칙

- `page.tsx`, `layout.tsx`, `route.ts`, `proxy.ts` 등 Next.js 파일 규칙은 지정된 export를 따릅니다.
- 그 외 컴포넌트는 named export를 사용하고, 같은 컴포넌트를 default와 named로 동시에 내보내지 않습니다.
- knip이 사용되지 않는 export를 잡습니다. 쓰지 않는 export는 만들지 않습니다.

### 크기와 책임

- 한 파일은 하나의 주요 책임만 가집니다. 300줄을 넘으면 분리를 고려합니다.
- 4단계 이상 깊은 중첩, `misc/`·`common/`·`shared/` 같은 모호한 폴더명은 피합니다.

## starter 잔재 정리

아래는 Supabase starter가 만든 코드이며 실제 서비스에 맞게 바꾸거나 지울 대상입니다. **새 코드의 기준으로 삼지 않습니다.**

- `components/tutorial/`, `components/deploy-button.tsx`, `components/hero.tsx`, `components/next-logo.tsx`, `components/supabase-logo.tsx`, `components/env-var-warning.tsx`
- `app/page.tsx`, `app/protected/page.tsx`의 안내용 화면, `hasEnvVars` 검사
- 영어 UI 문구와 `<html lang="en">`, 사이트 제목 "Next.js and Supabase Starter Kit"
- 인증 폼의 `useState` 기반 구현 (새 폼은 `forms-react-hook-form.md`의 패턴을 따름)

## 체크리스트

- [ ] 기능에 맞는 위치(`app/`, `components/`, `lib/`)에 배치
- [ ] kebab-case 파일명, PascalCase 컴포넌트명
- [ ] `@/` 별칭 사용, `src/` 경로 쓰지 않기
- [ ] `cn`은 `@/lib/utils`에서 import
- [ ] 새 공개 경로는 `lib/supabase/proxy.ts`의 리다이렉트 예외에 추가
- [ ] Supabase 클라이언트는 요청마다 생성, 서버/브라우저 클라이언트 구분
- [ ] 요청 시점 데이터를 읽는 컴포넌트에 `Suspense` 경계 설정
- [ ] 비밀 값에 `NEXT_PUBLIC_` 접두를 붙이지 않았는지 확인
- [ ] 새 환경 변수는 `.env.example`에도 반영
- [ ] 커밋 메시지는 `타입: 제목` 형식
- [ ] `npm run check` 통과
