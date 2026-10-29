# Next.js 16 개발 지침

이 문서는 이 프로젝트(Next.js 16.4 / React 19.3 / Tailwind CSS 4 / Supabase)에서 따라야 할 Next.js 규칙을 정리합니다.
버전별 동작은 기억에 의존하지 말고 `node_modules/next/dist/docs/`의 번들 문서를 먼저 확인하세요.

## 현재 환경

| 항목                | 버전 / 설정                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| Next.js             | 16.4.3 설치 (`package.json`은 `latest`). App Router 전용, Turbopack 기본           |
| React               | 19.3                                                                               |
| Node.js             | 20.9 이상 (필수), `.nvmrc`는 24                                                    |
| TypeScript          | 5, `strict`                                                                        |
| Cache Components    | `next.config.ts`에서 `cacheComponents: true`                                       |
| Partial Prefetching | **꺼져 있음** (`partialPrefetching`을 설정하지 않음)                               |
| 스타일              | PostCSS(`@tailwindcss/postcss`). `next.config.ts`에 Tailwind 설정 없음             |
| 요청 전처리         | 루트 `proxy.ts` → `lib/supabase/proxy.ts`의 `updateSession()`                      |
| 번들 분석           | `@next/bundle-analyzer` (`ANALYZE=true`, `npm run analyze`는 `--webpack`으로 빌드) |
| 린트                | ESLint 9 flat config (`eslint .`), `next lint`는 제거됨                            |

## 필수 규칙

### 1. App Router만 사용

`app/` 디렉터리만 사용합니다. `pages/`, `getServerSideProps`, `getStaticProps`는 사용하지 않습니다.

### 2. Server Components 우선

모든 컴포넌트는 기본적으로 Server Component입니다. 상태, 이벤트 핸들러, 브라우저 API가 필요한 말단 컴포넌트에만 `'use client'`를 붙입니다.
이 프로젝트의 예: `components/layout/site-header.tsx`(서버)가 메뉴를 그리고, 현재 경로(`usePathname`)가 필요한 `nav-link.tsx`·`nav-group-dropdown.tsx`·`mobile-nav.tsx`(클라이언트)만 분리되어 있습니다. 관리자 편집기(`app/admin/posts/_components/post-editor.tsx`)도 입력 상태가 필요해 클라이언트이고, 그 `page.tsx`는 서버입니다.

```tsx
// 서버 컴포넌트: 데이터는 서버에서 읽고 상호작용만 클라이언트로 분리
// components/layout/admin-link.tsx (현재 코드를 줄인 것)
export async function AdminLink() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return isAdmin(data?.claims) ? <Link href="/admin/posts">관리</Link> : null;
}
```

### 3. Request API는 항상 비동기

Next.js 16에서는 동기 접근이 완전히 제거되었습니다. `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` 모두 `await`가 필요합니다.
타입은 `npx next typegen`이 생성하는 전역 헬퍼(`PageProps`, `LayoutProps`, `RouteContext`)를 사용합니다.

```tsx
// app/(site)/blog/[slug]/page.tsx (현재 코드를 줄인 것)
// page는 await 하지 않고 Promise를 Suspense 안쪽 컴포넌트에 넘긴다.
async function BlogPost({ params }: Pick<PageProps<"/blog/[slug]">, "params">) {
  const { slug } = await params;
  const post = findPublishedPost(decodeSlug(slug));
  if (!post) notFound();
  return <article>{post.title}</article>;
}

export default function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<p>불러오는 중…</p>}>
      <BlogPost params={props.params} />
    </Suspense>
  );
}
```

`params`는 퍼센트 인코딩된 채로 전달됩니다(한글 슬러그 등). 이 프로젝트는 `decodeSlug()`로 직접 디코딩하고, 잘못된 인코딩이면 원문을 그대로 씁니다. `/blog?category=&tag=`는 `searchParams`를 같은 방식으로 Suspense 안에서 읽습니다(`app/(site)/blog/page.tsx`).

`opengraph-image`, `twitter-image`, `icon`, `apple-icon`의 `params`와 `id`, `sitemap`의 `id`도 Promise입니다.

### 4. `middleware` 대신 `proxy`

요청 전처리는 루트 `proxy.ts`가 맡고 함수 이름은 `proxy`입니다. Node.js 런타임에서 실행되며 `config.runtime`은 지정하지 않습니다 (지정하면 에러).

```ts
// proxy.ts (현재)
import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}
```

- 모듈 전역 변수나 공유 모듈 상태에 의존하지 않습니다. 정보 전달은 헤더, 쿠키, rewrite, redirect, URL로 합니다.
- Proxy는 느린 데이터 패칭이나 전체 인증·인가 용도가 아닙니다. **세션 쿠키 갱신과 낙관적 리다이렉트**만 맡깁니다 (`01-app/01-getting-started/16-proxy.md`).
- `matcher`는 `_next/static`, `_next/image`, `favicon.ico`, `robots.txt`, `sitemap.xml`, 이미지 확장자(svg·png·jpg·jpeg·gif·webp)를 제외합니다. 새 정적 확장자(예: `.woff2`)를 `public/`에 둘 때는 제외 패턴에 추가합니다.

## Supabase와 함께 쓰기

### 클라이언트 생성 위치

| 위치                                                 | 사용할 클라이언트                     |
| ---------------------------------------------------- | ------------------------------------- |
| Server Component, Server Action, Route Handler       | `@/lib/supabase/server` (`await`)     |
| Client Component (이벤트 핸들러, 브라우저 전용 로직) | `@/lib/supabase/client`               |
| `proxy.ts`                                           | `lib/supabase/proxy.ts` 내부에서 생성 |

- 서버 클라이언트는 `cookies()`를 읽으므로 **요청 시점 데이터**입니다. 요청마다 새로 만들고 전역 변수에 담지 않습니다.
- 서버 컴포넌트에서 쿠키 쓰기(`setAll`)는 실패하므로 `server.ts`가 `try/catch`로 무시합니다. 세션 갱신은 proxy가 담당하기 때문입니다.

### 세션 확인: `getClaims()`

서버에서 사용자를 확인할 때는 `supabase.auth.getClaims()`를 씁니다 (starter 전체가 이 방식). 더 엄격한 확인이 필요하면 `getUser()`(느림)를 씁니다. **서버에서 `getSession()`의 결과를 신뢰하지 않습니다.**

`lib/supabase/proxy.ts` 규칙 (주석 그대로 지킵니다):

- `createServerClient()`와 `getClaims()` 사이에 다른 코드를 넣지 않습니다. 사용자가 무작위로 로그아웃되는 원인이 됩니다.
- 반환하는 `supabaseResponse`를 그대로 반환합니다. 새 응답을 만들면 요청을 넘기고 쿠키를 복사해야 합니다.
- 보호 대상은 `/admin` 세그먼트(`/admin`, `/admin/*`)뿐이고 나머지는 공개입니다. 공개 페이지는 이 파일을 고칠 필요가 없고, 보호 경로를 늘릴 때만 `isAdminPath` 조건을 같이 고칩니다 (`project-structure.md` 참고).
- 리다이렉트 응답을 만들 때는 `supabaseResponse`의 쿠키를 복사합니다 (현재 구현이 이미 그렇게 합니다).
- 관리자 역할(`app_metadata.role`) 검사는 proxy가 아니라 서버 코드(`lib/auth/require-admin.ts`의 `requireAdmin()`)와 RLS가 맡습니다.

### 인증 UI는 Suspense 안에서

세션 읽기는 요청 시점이라 정적 셸에 포함할 수 없습니다. 인증 UI는 `<Suspense>` 안에서 스트리밍합니다. `app/(site)/layout.tsx`가 푸터 안의 `AdminLink`를 `<Suspense fallback={null}>`로 감싸 둔 것이 이 패턴입니다(`getClaims()`로 `app_metadata.role`을 확인해 관리자일 때만 `/admin/posts` 링크를 그립니다). 관리자 영역도 `app/admin/layout.tsx`가 `AdminGuard`(`app/admin/_components/admin-guard.tsx`)를 `<Suspense>` 안에 두고, 그 안에서 `requireAdmin()`을 호출합니다.

```tsx
export default function Page() {
  return (
    <Suspense fallback={<p>불러오는 중...</p>}>
      <UserDetails /> {/* 안에서 createClient() + getClaims() */}
    </Suspense>
  );
}
```

- 페이지 본문에서 `await createClient()`를 직접 하면 Suspense 경계 밖의 동적 접근이 되어 에러가 납니다. **읽는 쪽을 별도 async 컴포넌트로 분리해 경계 안에 둡니다.**
- 인증 구현 패턴은 `01-app/02-guides/authentication-with-cache-components.md`와 `data-security.md`를 먼저 읽습니다.
- 미인증이면 `redirect("/auth/login")`, 로그인했지만 관리자가 아니면 `notFound()`를 호출합니다(`lib/auth/require-admin.ts`의 `requireAdmin()`). `redirect()`와 `notFound()`는 예외를 던지므로 `try/catch` 안에서 호출하지 않습니다.

### 로그인 이후 캐시

Supabase 세션이 필요한 데이터는 **공유 캐시(`use cache`)에 넣지 않습니다.** `use cache`는 `cookies()`를 읽을 수 없기 때문입니다.

공개 데이터(모든 방문자가 같은 값을 보는 것)만 쿠키 없는 클라이언트로 읽어 캐시합니다. 이때 테이블은 RLS로 `anon`/`authenticated`에 공개 조회가 허용되어 있어야 합니다.

```ts
// lib/queries/posts.ts에 해당하는 공개 조회 예시(현재 구현은 cookies()를 읽는 서버 클라이언트이고 캐시 없음. 캐시 적용은 Task 019)
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";

export async function getPublicPosts() {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await supabase.from("posts").select("id, title");
  if (error) throw error;
  return data;
}
```

사용자별 값을 캐시해야 하면 `use cache: private`을 검토합니다 (`01-app/03-api-reference/01-directives/use-cache-private.md`).

## Cache Components

`cacheComponents: true`입니다. 데이터 패칭은 **기본이 동적**이고, 캐시는 `use cache`로 명시적으로 선택합니다. 정적 셸(static shell)이 먼저 응답되고 동적 부분이 스트리밍됩니다.

- `cacheComponents`는 Node.js 런타임이 필요하며 `runtime` 세그먼트 설정을 지원하지 않습니다.
- `partialPrefetching`을 켜면 `<Link>`가 기본으로 정적 부분만 prefetch 하고, 더 필요한 링크에만 `prefetch={true}`를 씁니다. **반드시 `cacheComponents`와 함께 켭니다** (없으면 설정 검증에서 에러). 켜기 전에 `01-app/02-guides/adopting-partial-prefetching.md`를 확인합니다.

### 동적 데이터는 Suspense 안에서

`cookies()`, `headers()`, `searchParams`, `params`(미리 생성하지 않은 값), 캐시되지 않은 `fetch`/DB 호출은 요청 시점 데이터입니다. `<Suspense>` 경계 밖에서 접근하면 빌드/개발 중 에러가 납니다.

```tsx
import { Suspense } from "react";
import { cookies } from "next/headers";

async function Greeting() {
  const theme = (await cookies()).get("theme")?.value ?? "system";
  return <p>현재 테마: {theme}</p>;
}

export default function Page() {
  return (
    <Suspense fallback={<p>불러오는 중...</p>}>
      <Greeting />
    </Suspense>
  );
}
```

### `use cache`로 캐시 선택

```tsx
import { cacheLife, cacheTag } from "next/cache";

async function getStats() {
  "use cache";
  cacheLife("hours");
  cacheTag("stats");
  return loadStats(); // 요청 시점 API를 쓰지 않는 함수
}
```

- `use cache` 함수는 인자로 받은 값과 클로저가 캐시 키가 됩니다. **함수 안에서 `cookies()`/`headers()`나 Supabase 서버 클라이언트(`@/lib/supabase/server`)를 쓰지 않습니다.**
- 사용자별 데이터는 공유 캐시에 넣지 않습니다.

### 캐시 무효화

| API                         | 사용처                       | 동작                                                              |
| --------------------------- | ---------------------------- | ----------------------------------------------------------------- |
| `updateTag(tag)`            | Server Action                | 즉시 만료, 같은 요청에서 최신 데이터를 읽음 (read-your-writes)    |
| `revalidateTag(tag, "max")` | Server Action, Route Handler | stale-while-revalidate. **두 번째 인자 필수** (생략은 deprecated) |
| `refresh()`                 | Server Action                | 캐시되지 않은 데이터만 갱신                                       |
| `revalidatePath(path)`      | Server Action, Route Handler | 경로 단위 무효화                                                  |

`revalidateTag`는 Client Component와 Proxy에서 호출할 수 없습니다.

```ts
"use server";

import { updateTag } from "next/cache";

export async function createPost(formData: FormData) {
  // Supabase insert ...
  updateTag("posts"); // 제출 직후 최신 값을 보여줘야 할 때
}
```

### 더 이상 쓰지 않는 것

| 기존                                                      | 대체                                          |
| --------------------------------------------------------- | --------------------------------------------- |
| `export const dynamic = "force-dynamic" / "force-static"` | 기본이 동적. 정적으로 만들 부분은 `use cache` |
| `export const revalidate = 60`                            | `cacheLife`                                   |
| `export const fetchCache`, `dynamicParams`                | 사용 불가                                     |
| `export const runtime = "edge"` (및 `"nodejs"`)           | 사용 불가 (Node.js 런타임 고정)               |
| `experimental_ppr`, `experimental.ppr`                    | 제거됨 (PPR이 기본 동작)                      |
| `unstable_cache`                                          | `use cache`                                   |
| `unstable_noStore`                                        | 불필요 (기본이 동적)                          |
| `experimental.dynamicIO`, `experimental.useCache`         | `cacheComponents`                             |

> `generateStaticParams`는 최소 1개 이상의 param을 반환해야 합니다.

### 네비게이션 시 상태 보존

Cache Components에서는 라우트를 벗어나도 언마운트되지 않고 React `<Activity>`로 숨김 처리됩니다. 이전 페이지의 폼 입력과 펼침 상태가 유지되며, 숨겨진 동안 Effect는 정리(cleanup)됩니다. Effect에서 구독/타이머를 쓴다면 cleanup을 반드시 작성하세요. Supabase `onAuthStateChange`나 Realtime 채널 구독도 해당됩니다.

```tsx
useEffect(() => {
  const supabase = createClient();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    // ...
  });
  return () => data.subscription.unsubscribe();
}, []);
```

## 권장 사항

### Streaming

느린 영역만 `Suspense`로 감싸고, 빠른 영역은 바로 렌더링합니다. 레이아웃의 내비게이션처럼 모든 페이지에 붙는 인증 UI도 개별 `Suspense`로 감싸 본문 스트리밍을 막지 않습니다. `usePathname`을 쓰는 헤더 메뉴(`site-header.tsx`)와 푸터의 `AdminLink`(`app/(site)/layout.tsx`)가 그 예입니다.

### `after()`로 비블로킹 작업

응답 후에 실행할 로깅/알림은 `after`를 사용합니다.

```ts
import { after } from "next/server";

export async function POST(request: Request) {
  const result = await process(await request.json());
  after(async () => {
    await sendAnalytics(result);
  });
  return Response.json({ id: result.id });
}
```

### 인증 실패 응답

`unauthorized()` / `forbidden()`은 `next/navigation`에서 import하며 `next.config.ts`에 `authInterrupts: true`가 필요합니다 (현재 꺼져 있음). 지금은 `redirect("/auth/login")`(비로그인)과 `notFound()`(비관리자)를 사용합니다. 켜기 전에 `01-app/03-api-reference/04-functions/unauthorized.md`를 확인하세요.

### Typed Routes

`next.config.ts`에 `typedRoutes: true`를 설정하면 `<Link href>`가 존재하는 경로만 허용합니다. 현재는 꺼져 있으며 켜면 `npx next typegen`으로 타입을 생성합니다.

### 메타데이터, 이미지, 폰트

- 메타데이터는 `metadata` / `generateMetadata`를 사용합니다. `app/layout.tsx`의 `metadataBase`는 `lib/site-url.ts`의 `getSiteUrl()`(`NEXT_PUBLIC_SITE_URL`, 미설정이면 `http://localhost:3000`)을 씁니다. `openGraph`·`twitter`를 지정하면 `app/opengraph-image.png`가 상속되지 않으므로 글 상세는 기본 이미지를 절대 URL로 명시합니다(`lib/post-metadata.ts`). 페이지별 `metadata`는 정적 페이지에 이미 지정되어 있고, 블로그 상세는 `generateMetadata`를 씁니다(`app/(site)/blog/[slug]/page.tsx`).
- `app/opengraph-image.png`, `app/twitter-image.png`는 파일 규칙으로 자동 연결됩니다.
- `next/image` 기본값이 바뀌었습니다 (`minimumCacheTTL` 4시간, `imageSizes`에서 16 제거, 쿼리 스트링이 있는 로컬 이미지는 `images.localPatterns` 필요). 상세는 `01-app/02-guides/upgrading/version-16.md`를 참고하세요. Supabase Storage 이미지를 쓰면 `images.remotePatterns`에 프로젝트 도메인을 추가합니다.
- 본문 폰트는 `pretendard` 패키지의 unicode-range 분할 CSS를 `app/layout.tsx`에서 import하고, 코드용 JetBrains Mono는 `next/font/google`(`variable: "--font-jetbrains-mono"`)로 `<html>`에 붙입니다. `app/globals.css`의 `--font-sans`·`--font-mono`가 이를 참조합니다 (`styling-guide.md`).

## 빌드와 설정

- `next dev`, `next build` 모두 Turbopack이 기본입니다. `--turbopack` 플래그를 붙이지 않습니다.
- 커스텀 `webpack` 설정이 있으면 `next build`가 실패합니다. 번들 분석(`npm run analyze`)이 `--webpack`을 명시하는 이유입니다. 일반 빌드에는 쓰지 않습니다.
- React Compiler를 쓰려면 `reactCompiler: true`와 `babel-plugin-react-compiler`가 필요합니다. 현재는 꺼져 있습니다.

```ts
// next.config.ts (현재)
import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  nextConfig,
);
```

## 금지 사항

```tsx
// 금지: 상태/이벤트가 없는데 'use client'
"use client";
export default function Title({ title }: { title: string }) {
  return <h1>{title}</h1>;
}
```

- 금지: `middleware.ts` 신규 생성, 동기식 `params`/`cookies()` 접근, `next lint` 사용
- 금지: `use cache` 안에서 요청 시점 API(`cookies()`, Supabase 서버 클라이언트) 호출
- 금지: Client Component에서 `@/lib/supabase/server` import
- 금지: Supabase 클라이언트를 모듈 전역 변수에 보관
- 금지: `createServerClient()`와 `getClaims()` 사이에 코드 삽입 (`lib/supabase/proxy.ts`)
- 금지: `NEXT_PUBLIC_` 접두 환경 변수에 비밀 값 저장

## 점검 명령

```bash
npm run typecheck            # next typegen + tsc --noEmit
npm run lint                 # ESLint (경고도 실패)
npm run test                 # Vitest
npx next typegen             # PageProps/LayoutProps/RouteContext 타입 생성
npm run build                # 프로덕션 빌드 (Cache Components 검증 포함)
npm run check                # typecheck + lint + format:check + test
```

`npm run build`에는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 필요합니다 (CI는 자리표시자 값을 넣습니다).
