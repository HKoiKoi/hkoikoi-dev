# 프로젝트 구조 가이드

이 문서는 `hkoikoi-dev`의 실제 폴더 구조, 네이밍 컨벤션, 품질 게이트를 정의합니다.
이 프로젝트는 Next.js + Supabase 인증 starter에서 출발해 개인 포트폴리오·블로그 사이트로 바뀌었고, `src/` 없이 루트에 `app/`, `components/`, `lib/`를 둡니다.

## 현재 스택

| 항목       | 버전 / 설정                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| Next.js    | 16.4 (`package.json`은 `latest`, 설치된 버전 16.4.3). App Router, Turbopack         |
| React      | 19.3                                                                                |
| TypeScript | 5, `strict`                                                                         |
| Tailwind   | 4.3 (`postcss.config.mjs`의 `@tailwindcss/postcss`, `tailwind.config.ts` 없음)      |
| shadcn/ui  | `base-nova` 스타일, **Base UI**(`@base-ui/react`) 기반                              |
| 백엔드     | Supabase (`@supabase/ssr`, `@supabase/supabase-js`), 쿠키 기반 인증, 생성된 DB 타입 |
| 유틸리티   | `clsx` + `tailwind-merge`(`cn`), `class-variance-authority`, `lucide-react`         |
| 테마       | `next-themes` (`attribute="class"`), `tw-animate-css`                               |
| 폰트       | Pretendard Variable 서브셋 + `next/font/google` JetBrains Mono (`app/layout.tsx`)   |
| 린트·포맷  | ESLint 9 flat config, Prettier(+ tailwind 플러그인), Husky, lint-staged, commitlint |
| 정적 분석  | knip (미사용 파일·export·의존성 검출, 설정은 `knip.jsonc`)                          |
| 테스트     | Vitest 5 + Testing Library(jsdom), Playwright(chromium)                             |
| 런타임     | Node `>=20.9` (`.nvmrc`는 24)                                                       |

아직 없는 것(필요할 때 추가): `react-hook-form`(`zod`는 설치됨), `hooks/`, `public/`. 공개 블로그 글은 `lib/queries/posts.ts`가 발행 글을, 관리자 글 목록·편집은 `lib/queries/admin-posts.ts`가 초안 포함 전체 글을 조회합니다.

## 전체 구조

```
hkoikoi-dev/
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트 (CLI로 추가)
│   ├── blog/               # 블로그 카드·배지
│   ├── content/            # 이력·프로젝트·논문 등 콘텐츠 표시용
│   ├── markdown/           # MarkdownContent (글 본문 렌더링, 서버·클라이언트 공용)
│   ├── layout/             # 헤더·푸터·내비게이션
│   └── *.tsx               # ThemeSwitcher
├── data/                   # 이력·프로젝트·논문 등 정적 콘텐츠 (TypeScript 데이터)
├── lib/
│   ├── auth/               # is-admin.ts(역할 판별), is-admin-path.ts(/admin 경로 판정), require-admin.ts(서버 가드) + 테스트
│   ├── supabase/           # client.ts / server.ts / public.ts / proxy.ts / database.types.ts
│   ├── storage/            # validate-image.ts(형식·크기 검증, 경로 생성), upload-image.ts(브라우저 직접 업로드) + 테스트
│   ├── editor/             # insert-at-cursor.ts(커서 삽입·자리표시 치환 순수 함수) + 테스트
│   ├── types/              # 도메인 타입 (post, profile, resume)
│   ├── schemas/            # post.ts(zod 입력 스키마, POST_LIMITS, parseTags) + 테스트
│   ├── queries/            # posts.ts(공개 글 조회), admin-posts.ts(관리자 조회), columns.ts(공용 select 컬럼), 서버 전용 + 테스트
│   ├── posts/ projects/ publications/   # slugify·form-data·published-at·정렬 등 순수 함수와 옆의 테스트
│   ├── site-config.ts      # 사이트 이름, 내비게이션 항목
│   ├── site-url.ts         # NEXT_PUBLIC_SITE_URL 기준 절대 URL(getSiteUrl, absoluteUrl) + 테스트
│   ├── post-metadata.ts    # 글 상세 메타데이터(OG·twitter·없는 글 noindex) 순수 함수 + 테스트
│   ├── format-date.ts / is-active-path.ts / utils.ts   # 공용 유틸 (+ *.test.ts)
├── supabase/migrations/    # DB 마이그레이션 SQL (원격 version과 파일명 일치)
├── e2e/                    # Playwright 테스트 (*.spec.ts)
├── docs/                   # PRD.md, ROADMAP.md, guides/ (개발 가이드)
├── proxy.ts                # 요청 전처리: Supabase 세션 갱신 + /admin 보호
├── next.config.ts          # cacheComponents + 보안 헤더 + bundle analyzer
├── components.json         # shadcn/ui 설정
├── eslint.config.mjs       # ESLint flat config
├── vitest.config.mts       # Vitest 설정 (+ vitest.setup.ts)
├── playwright.config.ts    # Playwright 설정
├── knip.jsonc              # knip 설정 (영구 제외만 있고 임시 예외 없음. 생기면 제거 조건을 주석으로)
├── commitlint.config.mjs   # 커밋 메시지 규칙
├── .husky/                 # pre-commit, commit-msg, pre-push
├── .github/workflows/      # CI (ci.yml)
├── .agents/skills/         # 에이전트 스킬 사본 (shadcn, supabase 등)
├── .claude/                # Claude Code 권한·훅·스킬·서브 에이전트 설정
├── .mcp.json               # MCP 서버 (sequential-thinking, shrimp-task-manager, supabase)
├── shrimp_data/            # shrimp 작업 데이터 (shrimp-rules.md와 함께 사용)
├── AGENTS.md               # 에이전트 지침 (Next.js 번들 문서 안내)
└── .env / .env.example     # 환경 변수
```

- `app/robots.ts`·`app/sitemap.ts`는 메타데이터 라우트입니다. `/robots.txt`는 정적, `/sitemap.xml`은 글 조회가 `cookies()`를 읽어 요청 시점에 만들어집니다. `/admin`(`app/admin/layout.tsx`)과 `/auth`(`app/auth/layout.tsx`)는 layout에서 `robots: { index: false, follow: false }`를 지정하며, `robots`는 얕은 병합이라 하위 page에서 다시 지정하지 않습니다.
- `tailwind.config.ts`는 없습니다. 테마는 `app/globals.css`의 `@theme inline`에서 정의합니다.
- `middleware.ts`는 만들지 않습니다. 요청 전처리는 루트의 `proxy.ts`가 맡습니다.
- `AGENTS.md`의 `next dev`가 관리하는 블록은 직접 지우지 말고 변경분을 함께 커밋합니다.
- `.env`는 `.gitignore` 대상이며 에이전트가 읽지 못하도록 `.claude/settings.json`에서 막혀 있습니다. 키 이름은 `.env.example`로 공유합니다.
- `lib/supabase/database.types.ts`는 `generate_typescript_types`로 만든 **생성 파일**입니다. 직접 편집하지 않고, 스키마가 바뀌면 다시 생성합니다.

## app/ — 라우트

```
app/
├── layout.tsx              # 루트 레이아웃 (ThemeProvider, 폰트, 메타데이터)
├── globals.css             # Tailwind v4 + shadcn 테마 변수
├── not-found.tsx
├── opengraph-image.png / twitter-image.png / favicon.ico
├── (site)/                 # 공개 사이트 (Route Group, URL에 나타나지 않음)
│   ├── layout.tsx          # 헤더·푸터
│   ├── page.tsx            # /
│   ├── _components/        # latest-posts.tsx (메인의 최신 글)
│   ├── education/ career/ certifications/ languages/   # 이력
│   ├── volunteer/ activities/ projects/ publications/
│   └── blog/               # /blog, /blog/[slug], _components/ (필터·목록)
├── admin/                  # 관리자 영역 (로그인 필요)
│   ├── layout.tsx          # 헤더 + Suspense 안의 AdminGuard
│   ├── actions.ts          # logout Server Action (+ actions.test.ts)
│   ├── _components/        # admin-guard.tsx, logout-button.tsx
│   └── posts/              # 글 목록 + new/(작성) + [id]/edit/(수정), 공용 편집기는 _components/post-editor.tsx(메타 필드 post-meta-fields.tsx, 본문 상태·이미지 업로드 훅 use-content-upload.ts, 필드 오류 field-error.tsx로 분리), 실시간 미리보기(Shadow DOM 격리)는 _components/markdown-preview.tsx, actions.ts(savePost·deletePost Server Action)
└── auth/
    ├── login/              # 로그인 (actions.ts: login Server Action + 테스트, _components/login-form.tsx)
    └── error/              # 인증 오류 안내
```

회원가입·비밀번호 재설정·이메일 확인 라우트는 만들지 않았습니다(가입은 Supabase 설정에서도 막혀 있음). 관리자 계정은 대시보드에서 만들고 `app_metadata.role = 'admin'`을 부여합니다.

파일 규칙:

- `page.tsx` 라우트의 UI, `layout.tsx` 공유 레이아웃, `route.ts` Route Handler.
- `loading.tsx`, `error.tsx`, `not-found.tsx`는 필요할 때만 추가합니다.
- `params`, `searchParams`는 Promise이므로 `await` 하거나 `PageProps<'/경로'>` / `LayoutProps<'/경로'>` 헬퍼를 사용합니다. 타입은 `npx next typegen`으로 생성합니다(`npm run typecheck`가 먼저 실행합니다).
- Cache Components가 켜져 있으므로 요청 시점 데이터(쿠키, Supabase 세션 등)를 읽는 컴포넌트는 `<Suspense>`로 감쌉니다 (`nextjs-16.md`).
- 라우트 세그먼트 설정 `dynamic`, `revalidate`, `fetchCache`, `runtime`은 사용하지 않습니다.
- 공개 글 조회(`lib/queries/posts.ts`)는 `'use cache'` + `cacheTag` + `cacheLife('max')`로 캐시하고, 저장·삭제 Server Action이 `updateTag`로 무효화합니다. 쿠키를 읽는 쿼리(`admin-posts.ts`)에는 `'use cache'`를 붙이지 않습니다 (`nextjs-16.md`).
- 한 라우트에서만 쓰는 컴포넌트는 그 폴더의 `_components/`에 둡니다 (`_` 접두 폴더는 라우팅 제외).
- URL에 영향 없이 레이아웃만 나누려면 Route Group `(group)`을 사용합니다. 공개 영역은 `(site)`가 이 역할입니다.

### 로그인 필요 여부는 `proxy.ts`가 정한다

`lib/supabase/proxy.ts`의 `updateSession()`은 `getClaims()`로 세션을 갱신한 뒤, 로그인하지 않은 사용자가 **`/admin` 또는 `/admin/*`** 를 요청하면 `/auth/login`으로 리다이렉트합니다. `/administrator` 같은 경로는 보호 대상이 아닙니다.

- **공개 페이지는 별도 설정 없이 `app/(site)/` 아래에 만들면 됩니다.** 기본이 공개입니다.
- **관리자 페이지는 `app/admin/` 아래에 둡니다.** 이 밖의 새 경로를 보호하려면 `updateSession()`의 `isAdminPath` 조건을 함께 고칩니다.
- 리다이렉트 응답에는 `getClaims()`가 갱신한 쿠키를 그대로 복사합니다. 이 흐름과 `createServerClient`~`getClaims()` 사이를 건드리지 않습니다.
- proxy는 로그인 여부만 보는 낙관적 검사입니다. **관리자 권한(`app_metadata.role = 'admin'`) 검증은 서버 코드의 `requireAdmin()`(`lib/auth/require-admin.ts`)이 맡습니다.** 비로그인이면 `/auth/login`으로 보내고, 로그인했지만 관리자가 아니면 `notFound()`를 호출합니다. `app/admin/layout.tsx`가 `<Suspense>` 안의 `AdminGuard`(`app/admin/_components/admin-guard.tsx`)로 본문을 감싸고, `posts/page.tsx`·`posts/new/page.tsx`·`app/admin/posts/[id]/edit/page.tsx`도 `requireAdmin()`을 다시 호출합니다. 데이터 보호는 RLS가 함께 담당합니다. 푸터의 `AdminLink`(`components/layout/admin-link.tsx`)는 관리자일 때만 `관리` 링크를 그립니다.

## components/ — 컴포넌트

```
components/
├── ui/         # shadcn/ui: avatar, badge, button, card, checkbox, dialog, dropdown-menu,
│               #            input, label, separator, tabs, textarea
├── blog/       # category-badge, post-card, post-list-skeleton, tag-badge
├── content/    # empty-state, page-header, project-card, publication-item, resume-*, tech-badge
├── markdown/   # markdown-content (+ 테스트), code-block, code-copy-button: 동기 컴포넌트라 서버·클라이언트 양쪽에서 쓴다
├── layout/     # site-header, site-footer, mobile-nav, nav-group-dropdown, nav-link, admin-link, scroll-to-top
└── *.tsx       # theme-switcher (app을 import하는 컴포넌트는 두지 않는다: eslint로 강제)
```

분류 규칙:

1. **`ui/`**: shadcn/ui 기반 순수 UI 컴포넌트. 비즈니스 로직 없이 props로 동작을 제어합니다. 추가는 `npx shadcn@latest add <name>`.
2. **`components/<domain>/`**: 여러 페이지가 쓰는 도메인 컴포넌트(`blog`, `content`, `layout`, `markdown`). 새 도메인이 생기면 폴더를 추가합니다.
3. **`components/` 루트**: 도메인이 없는 테마 컴포넌트(`theme-switcher`)만 둡니다. 로그인 폼·로그아웃 버튼은 각 라우트의 `_components/`에 있습니다.
4. **라우트 전용 컴포넌트**: 한 페이지에서만 쓰면 해당 라우트의 `_components/`.
5. import 방향은 `components/ui` ← `components/*` ← `app/` 단방향입니다. `components/**`에서 `@/app`을 import하면 eslint(`no-restricted-imports`)가 실패합니다.

## lib/ — 유틸리티, 도메인 로직, Supabase 클라이언트

```
lib/
├── supabase/
│   ├── client.ts          # createBrowserClient<Database> — Client Component 전용
│   ├── server.ts          # createServerClient<Database> + cookies() — Server Component / Action / Route Handler
│   ├── public.ts          # createPublicClient<Database> — 쿠키·세션 없는 anon 클라이언트, 'use cache' 안의 공개 조회 전용
│   ├── proxy.ts           # proxy.ts에서 호출하는 updateSession()과 hasEnvVars(env 미설정 시 세션 검사 생략)
│   └── database.types.ts  # 생성 파일 (직접 편집 금지)
├── storage/               # validate-image.ts: ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, validateImage, buildImagePath / upload-image.ts: uploadImage (브라우저 전용, + 테스트)
├── editor/                # insert-at-cursor.ts: insertAtCursor, replaceOnce, replaceWithCaret, createUploadPlaceholder (+ 테스트)
├── types/                 # post.ts(DB Row에서 파생), profile.ts, resume.ts
├── schemas/               # post.ts: POST_LIMITS, parseTags, postSchema, PostActionState (+ 테스트)
├── queries/               # posts.ts: getLatestPosts / getPublishedPosts / getPostBySlug('use cache' + cacheTag, public 클라이언트), admin-posts.ts: getAdminPosts / getAdminPostById, columns.ts: SUMMARY_COLUMNS / POST_COLUMNS (+ 테스트)
├── markdown/              # sanitize-schema.ts(확장 sanitize 스키마), rehype-sanitize-style.ts(`<style>` CSS 내용 검사), plugins.ts(remark/rehype 플러그인 순서 = 보안 경계) (+ 테스트)
├── posts/                 # slugify.ts, form-data.ts, published-at.ts (+ 테스트)
├── projects/ publications/ # select-featured.ts, sort.ts (+ 테스트)
├── site-config.ts         # siteConfig, navItems
├── format-date.ts / is-active-path.ts   # (+ 테스트)
└── utils.ts               # cn()
```

- `cn()`은 `clsx` + `tailwind-merge`로 `lib/utils.ts`에 직접 구현되어 있습니다. **모든 코드는 `import { cn } from "@/lib/utils"`를 사용**합니다 (`components/ui/*`도 동일).
- `hasEnvVars`는 `lib/supabase/proxy.ts`의 지역 상수입니다(사용처가 proxy 하나뿐이라 `lib/utils.ts`에서 옮김, 근거는 ROADMAP "알려진 트레이드오프"). Supabase 환경 변수가 없으면 세션 검사를 건너뜁니다.
- Supabase 클라이언트는 **요청마다 새로 만듭니다.** 모듈 전역 변수에 담지 않습니다 (`server.ts` 주석 참고). `client.ts`·`server.ts`·`public.ts` 모두 `Database` 제네릭이 적용되어 있고, `public.ts`는 캐시 함수 안에서만 씁니다.
- `lib/supabase/server.ts`는 `next/headers`를 쓰는 서버 전용 모듈이므로 Client Component에서 import하지 않습니다. 필요하면 상단에 `import "server-only"`를 추가합니다 (패키지 설치 필요).
- `lib/types/post.ts`의 `PostSummary`/`Post`/`PostInput`은 `Tables<'posts'>`에서 파생합니다. 컬럼을 바꾸면 마이그레이션 → 타입 재생성 순서로 진행합니다.
- 검증 스키마(zod)는 `lib/schemas/`에, 관리자 조회는 `lib/queries/admin-posts.ts`에 둡니다. 훅이 생기면 루트 `hooks/`를 추가합니다 (`components.json`의 `hooks` 별칭은 `@/hooks`).
- `lib/storage/`의 상수(허용 MIME 4종, 5MB)는 `supabase/migrations/20261026105803_create_blog_images_bucket.sql`의 버킷 설정과 같아야 합니다. 한쪽을 바꾸면 다른 쪽도 바꿉니다. `upload-image.ts`는 `client.ts`(브라우저 클라이언트)를 쓰는 브라우저 전용 모듈이라 `server.ts`를 import하지 않습니다. 버킷에 select 정책이 없어 업로드한 파일은 앱·e2e에서 삭제할 수 없고, 고아 파일은 정리하지 않습니다.
- 순수 로직은 `lib/<도메인>/`에 함수로 분리하고 옆에 `*.test.ts`를 둡니다. 컴포넌트에는 화면 코드만 남깁니다.

## supabase/ — 마이그레이션

- `supabase/migrations/<version>_<name>.sql`. 파일명의 version은 원격에 적용된 `list_migrations`의 version과 **일치**시킵니다.
- 적용은 Supabase MCP의 `apply_migration`으로 하고, 적용 후 `get_advisors`(security, performance)를 확인합니다.
- 관리자 판별은 RLS에서 `(select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'`만 사용합니다. `user_metadata`는 사용자가 바꿀 수 있어 쓰지 않습니다.
- 현재 마이그레이션: `create_posts`(테이블, check, 인덱스, `updated_at` 트리거, RLS), `create_blog_images_bucket`(public 버킷 `blog-images`, 5MB, 이미지 MIME 4종, 관리자 전용 insert/update/delete 정책), `add_posts_category_tags_length_checks`(category·tags 길이 check), `revoke_excess_posts_grants`(`public` 스키마 default privileges로 과잉 부여된 anon·authenticated GRANT 회수).
- `public` 스키마의 default privileges는 바꾸지 않았으므로 새 테이블은 같은 과잉 GRANT를 받습니다. 새 테이블 마이그레이션에는 필요한 권한만 남기는 `revoke`를 함께 넣고, 점검은 `rls-verification.md`를 따릅니다.
- 알려진 advisor 경고: `auth_leaked_password_protection` 1건은 Pro 플랜 미사용으로 예외 수용했습니다(대신 회원가입 차단, 최소 비밀번호 12자, 대소문자·숫자·기호 필수).

## 파일/폴더 네이밍

```bash
# 파일: kebab-case
login-form.tsx        # O
LoginForm.tsx         # X

# 폴더: 소문자 kebab-case
sign-up-success/      # O
signUpSuccess/        # X
```

컴포넌트 이름은 PascalCase(`LoginForm`), 훅은 `use` 접두사 camelCase(`useToggle`)입니다. 라우트 그룹은 `(site)`처럼 괄호, 라우트 전용 폴더는 `_components`처럼 밑줄 접두입니다.

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

| 키                                       | 노출 범위       | 용도                                                     |
| ---------------------------------------- | --------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`               | 브라우저        | Supabase 프로젝트 URL                                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`   | 브라우저        | publishable(또는 anon) 키. RLS가 보호를 담당함           |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | 서버 전용(로컬) | 관리자 e2e 로그인용. `.env.local`에만 두고 커밋하지 않음 |

- `NEXT_PUBLIC_` 접두 변수는 브라우저 번들에 포함됩니다. **service role 키 등 비밀 값에는 절대 붙이지 않습니다.**
- 새 키를 추가하면 `.env.example`에 키 이름(값 없이)도 추가합니다. CI의 `build` 단계에도 필요하면 `.github/workflows/ci.yml`의 `env`에 자리표시자 값을 넣습니다.
- `DATA_DIR`, `TEMPLATES_USE`, `ENABLE_GUI`는 앱이 아니라 shrimp-task-manager MCP용입니다 (`.mcp.json`에 등록됨).

## 품질 게이트

### 스크립트

| 명령                    | 내용                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev` / `build` | 개발 서버 / 프로덕션 빌드 (Turbopack)                             |
| `npm run typecheck`     | `next typegen && tsc --noEmit`                                    |
| `npm run lint`          | `eslint . --max-warnings=0` (경고도 실패)                         |
| `npm run format:check`  | Prettier 검사 (`npm run format`으로 수정)                         |
| `npm run test`          | Vitest 1회 실행 (`test:watch`, `test:coverage`도 있음)            |
| `npm run test:e2e`      | Playwright (dev 서버를 자동 기동)                                 |
| `npm run check`         | typecheck → lint → format:check → test 순차 실행                  |
| `npm run knip`          | 미사용 파일·export·의존성 검출                                    |
| `npm run analyze`       | `ANALYZE=true next build --webpack` 번들 분석 (webpack 빌드 사용) |

### Git 훅과 CI

- `pre-commit`: `lint-staged` — 스테이징된 `js/jsx/mjs/ts/tsx`에 `eslint --fix --max-warnings=0` + Prettier, `json/css/md/yml/yaml`에 Prettier.
- `commit-msg`: `commitlint` — `타입: 제목` 또는 `타입(scope): 제목`. 제목은 한국어 가능, 헤더 100자 이내.
- `pre-push`: `typecheck` + `lint`.
- CI(`.github/workflows/ci.yml`): `typecheck` → `lint` → `format:check` → `test` → `build`. 별도 `e2e-smoke` job이 시크릿 없이 `e2e/access-control.spec.ts`(권한 회귀)만 실행합니다. **나머지 E2E와 knip은 CI에서 실행하지 않습니다.** 둘은 로컬에서 직접 돌립니다.
- `.claude/settings.json`은 `--no-verify` 커밋과 force push를 막고, 파일을 Edit/Write 하면 포맷 훅을 실행합니다.

### 테스트 배치

- 단위/컴포넌트 테스트: 대상 파일 옆의 `*.test.ts(x)` (예: `lib/format-date.test.ts`). 환경은 jsdom이고 `vitest.setup.ts`가 `jest-dom` 매처와 `cleanup`을 설정합니다.
- E2E: `e2e/*.spec.ts` (`home`, `routes`, `static-pages`, `admin-auth`, `admin-posts`, `admin-image-upload`, `admin-preview`, `visitor-flow`, `admin-flow`, `access-control`, `seo`)와 공용 헬퍼 `e2e/fixtures/admin.ts`. Vitest는 `e2e/`와 `.agents`를 제외합니다.
- 커버리지는 `app/`, `components/`, `lib/`를 대상으로 하되 `components/ui/**`는 제외합니다.
- Server Component(async)는 Vitest로 직접 렌더링하기 어렵습니다. 로직은 함수로 분리해 단위 테스트하고, 화면 흐름은 E2E로 검증합니다.

## 새 파일 추가 규칙

| 대상                      | 위치                                                       |
| ------------------------- | ---------------------------------------------------------- |
| 새 공개 페이지            | `app/(site)/<경로>/page.tsx` (proxy 수정 불필요)           |
| 관리자 페이지             | `app/admin/<경로>/page.tsx` (proxy가 자동 보호)            |
| Route Handler             | `app/<경로>/route.ts`                                      |
| Server Action             | 기능 옆 `actions.ts` (파일 최상단에 `"use server"`)        |
| 공통 UI                   | `components/ui/` (shadcn CLI)                              |
| 한 페이지 전용 컴포넌트   | 해당 라우트 폴더의 `_components/`                          |
| 여러 페이지 공용 컴포넌트 | `components/<domain>/`                                     |
| 정적 콘텐츠(이력 등)      | `data/<이름>.ts` + 타입은 `lib/types/`                     |
| 순수 로직                 | `lib/<도메인>/<이름>.ts` + 옆에 `*.test.ts`                |
| DB 스키마 변경            | `supabase/migrations/` → 적용 → `database.types.ts` 재생성 |
| 단위 테스트               | 대상 파일 옆 `*.test.ts(x)`                                |
| E2E 테스트                | `e2e/<이름>.spec.ts`                                       |
| 정적 파일                 | `public/` (폴더 없음, 필요 시 생성)                        |
| 환경 변수                 | `.env` + `.env.example`에 키 이름 추가                     |

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
- knip이 사용되지 않는 export를 잡습니다. 쓰지 않는 export는 만들지 않습니다. 아직 쓰이지 않는 파일은 `knip.jsonc`의 임시 예외에 사유와 함께 둡니다.

### 크기와 책임

- 한 파일은 하나의 주요 책임만 가집니다. 300줄을 넘으면 분리를 고려합니다.
- 4단계 이상 깊은 중첩, `misc/`·`common/`·`shared/` 같은 모호한 폴더명은 피합니다.

## starter 잔재

Supabase starter에서 남은 것 중 실제 서비스에 맞게 바꾸거나 지울 대상입니다. **새 코드의 기준으로 삼지 않습니다.**

- 현재 알려진 잔재는 없습니다(`hasEnvVars`는 `lib/supabase/proxy.ts`로 이동했고 로그인 폼은 `useActionState` 패턴으로 전환됨). 새로 발견하면 여기에 적습니다.

## 체크리스트

- [ ] 기능에 맞는 위치(`app/`, `components/`, `lib/`)에 배치
- [ ] kebab-case 파일명, PascalCase 컴포넌트명
- [ ] `@/` 별칭 사용, `src/` 경로 쓰지 않기
- [ ] `cn`은 `@/lib/utils`에서 import
- [ ] 공개 페이지는 `app/(site)/`, 관리자 페이지는 `app/admin/`
- [ ] 새 `app/admin/` 페이지·Server Action은 `requireAdmin()`을 직접 호출 (레이아웃은 클라이언트 전환 시 다시 렌더링되지 않을 수 있고, Server Action은 proxy를 거치지 않을 수 있음). 예외는 누구나 호출해야 하는 `logout`(`app/admin/actions.ts`)
- [ ] Supabase 클라이언트는 요청마다 생성, 서버/브라우저 클라이언트 구분
- [ ] 요청 시점 데이터를 읽는 컴포넌트에 `Suspense` 경계 설정
- [ ] 비밀 값에 `NEXT_PUBLIC_` 접두를 붙이지 않았는지 확인
- [ ] 새 환경 변수는 `.env.example`에도 반영
- [ ] 스키마를 바꿨다면 마이그레이션 적용 후 `database.types.ts` 재생성, advisor 확인
- [ ] 커밋 메시지는 `타입: 제목` 형식
- [ ] `npm run check` 통과
