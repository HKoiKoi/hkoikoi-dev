# hkoikoi.dev

학력·경력·프로젝트·논문 등 개인 이력을 한 곳에 공개하고, 관리자 1인이 마크다운(LaTeX, raw HTML)으로 블로그 글을 직접 작성·발행하는 개인 사이트입니다.

- 방문자(채용 담당자·동료 개발자)는 열람만 합니다.
- 글을 작성하는 사람은 관리자 1명(hkoikoi)뿐이며, 회원가입은 제공하지 않습니다.
- 연락처: koikoilove99@gmail.com, [GitHub](https://github.com/hkoikoi)

기능 명세는 [`docs/PRD.md`](docs/PRD.md), 개발 계획과 진행 상황은 [`docs/ROADMAP.md`](docs/ROADMAP.md)에 있습니다.

## 진행 상태

| 영역                                                                  | 상태                                    |
| --------------------------------------------------------------------- | --------------------------------------- |
| 공개 페이지(메인, 이력 6종, 프로젝트, 논문), 공통 헤더·푸터·테마 전환 | 완료 (이력은 `data/*.ts`의 샘플 데이터) |
| 블로그 목록·상세 UI, 관리자 글 목록·편집기 UI                         | 완료 (블로그 글은 더미 데이터)          |
| DB(`posts` 테이블, RLS)와 이미지 스토리지(`blog-images`) 마이그레이션 | 완료, 원격 프로젝트에 적용됨            |
| 관리자 인증·권한, 글 저장·발행·삭제, 블로그 DB 연동                   | 예정 (Task 011~013)                     |
| 마크다운 렌더링, 편집기 미리보기, 이미지 업로드                       | 예정 (Task 015~017)                     |
| SEO(sitemap, robots, 메타데이터), 캐싱·성능, 배포                     | 예정 (Task 018~020)                     |

## 기술 스택

- Next.js 16 (App Router, Turbopack, Cache Components, `proxy.ts`), React 19, TypeScript
- Tailwind CSS v4, shadcn/ui `base-nova`(Base UI 기반), `next-themes`, Noto Sans KR
- Supabase: 쿠키 기반 인증(`@supabase/ssr`), Postgres(RLS), Storage
- Vitest + Testing Library, Playwright, ESLint, Prettier, Husky, commitlint, knip

## 시작하기

필요한 것: Node.js 20.9 이상(`.nvmrc`는 24), npm, Supabase 프로젝트.

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

`.env.local`에 Supabase 프로젝트 값을 넣습니다. 값은 [프로젝트 API 설정](https://supabase.com/dashboard/project/_?showConnect=true)에서 확인합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=[Supabase 프로젝트 URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[publishable 또는 anon 키]
```

> `NEXT_PUBLIC_` 변수는 브라우저에 노출됩니다. service role 키 같은 비밀 값에는 이 접두를 붙이지 않습니다.
> `.env.example`의 `DATA_DIR`, `TEMPLATES_USE`, `ENABLE_GUI`는 앱이 아니라 shrimp-task-manager MCP용입니다.

### 데이터베이스

스키마는 `supabase/migrations/`의 SQL로 관리합니다. 새 Supabase 프로젝트에는 파일명 순서대로 적용합니다.

1. `*_create_posts.sql`: `posts` 테이블, check 제약, 인덱스, `updated_at` 트리거, RLS
2. `*_create_blog_images_bucket.sql`: 공개 버킷 `blog-images`(5MB, jpeg/png/webp/gif)와 관리자 전용 쓰기 정책

적용은 Supabase 대시보드의 SQL Editor, Supabase CLI, 또는 Supabase MCP의 `apply_migration` 중 편한 방법을 씁니다. 적용 후 Supabase의 보안 advisor를 확인합니다. 스키마를 바꾸면 `lib/supabase/database.types.ts`를 다시 생성합니다(직접 편집하지 않습니다).

### 관리자 계정

관리자 판별은 `app_metadata.role = 'admin'` 하나만 봅니다(사용자가 바꿀 수 있는 `user_metadata`는 쓰지 않습니다).

1. Supabase 대시보드 Authentication → Users에서 **Add user → Create new user**로 계정을 만들고 Auto Confirm User를 체크합니다.
2. SQL Editor에서 역할을 부여합니다.

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = '관리자 이메일';
   ```

3. 이미 로그인한 상태였다면 로그아웃 후 다시 로그인합니다(토큰에 역할이 반영돼야 합니다).
4. Authentication 설정에서 **"Allow new users to sign up"을 끄고**, 최소 비밀번호 길이를 12자 이상, 필수 문자를 대소문자·숫자·기호로 설정합니다.

관리자 로그인 주소는 `/auth/login`이며 헤더 메뉴에는 노출하지 않습니다. 비로그인으로 `/admin` 하위 경로에 접근하면 로그인 화면으로 이동합니다.

## 명령어

```bash
npm run dev            # 개발 서버
npm run build          # 프로덕션 빌드
npm run check          # typecheck + lint + format:check + test
npm run test           # 단위 테스트 (Vitest)
npm run test:e2e       # E2E (Playwright, dev 서버 자동 기동)
npm run knip           # 미사용 파일·export·의존성 검출
```

CI는 typecheck → lint → format:check → test → build를 실행합니다. E2E와 knip은 로컬에서 실행합니다. 커밋 메시지는 `타입: 제목` 형식(한국어 가능)이고, Git 훅(Husky)이 lint-staged와 commitlint를 실행합니다.

## 프로젝트 구조

```
app/              # 라우트: (site) 공개 사이트, admin 관리자, auth 로그인
components/       # ui(shadcn), blog, content, layout, 인증·테마 컴포넌트
data/             # 이력·프로젝트·논문 정적 데이터 (샘플 문구, 실제 내용으로 교체 예정)
lib/              # supabase 클라이언트·DB 타입, 도메인 타입, 순수 로직, 더미 데이터
supabase/         # DB 마이그레이션
e2e/              # Playwright 테스트
docs/             # PRD, ROADMAP, 개발 가이드
proxy.ts          # 세션 갱신 + /admin 보호
```

폴더 규칙과 컨벤션은 [`docs/guides/`](docs/guides/)의 가이드를 따릅니다: `project-structure.md`, `nextjs-16.md`, `component-patterns.md`, `styling-guide.md`, `forms-react-hook-form.md`.

## 개발 참고

- 이 프로젝트의 Next.js는 학습 데이터와 다른 부분이 있으므로, 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 번들 문서를 확인합니다(`AGENTS.md`).
- shadcn 컴포넌트는 `npx shadcn@latest add <name>`으로만 추가합니다. Radix가 아니라 Base UI 기반이라 `asChild` 대신 `render` prop을 씁니다.
- 이 저장소는 [Next.js + Supabase starter](https://github.com/vercel/next.js/tree/canary/examples/with-supabase)에서 출발했습니다.
