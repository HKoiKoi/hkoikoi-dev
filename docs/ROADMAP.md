# hkoikoi.dev 개발 로드맵

개인 이력(학력·경력·프로젝트·논문 등)을 한 곳에 공개하고, 관리자 1인이 마크다운(LaTeX, raw HTML)으로 블로그 글을 직접 작성·발행하는 개인 사이트.

## 개요

hkoikoi.dev는 채용 담당자·동료 개발자(방문자)와 관리자 본인(hkoikoi)을 위한 개인 이력·블로그 사이트로 다음 기능을 제공합니다:

- **이력 공개 (F001~F004)**: 프로필·연락처, 이력 6개 섹션(학력·경력·자격증·사회봉사·어학·사회활동), 프로젝트, 논문을 코드 내 정적 데이터(`data/*.ts`)로 표시
- **블로그 열람 (F005~F007)**: 발행 글 목록(카테고리/태그 필터)과 상세(GFM·LaTeX·코드 하이라이트·raw HTML 렌더링)
- **블로그 관리 (F008~F012)**: 관리자 전용 로그인, 글 작성·수정·삭제, 초안/발행 상태, 이미지 업로드·썸네일
- **공통·SEO (F013~F014)**: 공통 헤더·푸터·테마 전환, 글별 메타데이터·sitemap·robots

- 기준 문서: `docs/PRD.md` (기능 ID F001~F014)
- 구조·컨벤션: `docs/guides/project-structure.md`, `nextjs-16.md`, `component-patterns.md`, `styling-guide.md`, `forms-react-hook-form.md`
- 스택: Next.js 16.4 (App Router, `cacheComponents: true`, `proxy.ts`), React 19.3, Tailwind v4, shadcn/ui `base-nova`(Base UI), Supabase(인증·DB·스토리지), Vitest + Playwright

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 별도 작업 파일(`tasks/`)은 만들지 않고 ROADMAP.md의 Task 항목에 직접 작성(필요 시 shrimp task manager로 이관)
- 고수준 명세서, 관련 파일, 수락 기준, 구현 사항 포함
- **API/비즈니스 로직 작업 시 "테스트 체크리스트"를 정상/오류/엣지로 나눠 필수 포함 (Playwright MCP 테스트 시나리오를 `도구 → 입력 → 기대 결과` 형식으로 작성)**
- 새 작업의 체크박스는 비워 두고 `테스트 결과` 줄은 `(미수행)`으로 둔다. 완료된 작업만 체크 표시와 결과 요약을 반영한다.

3. **작업 구현**

- ROADMAP.md의 Task 명세를 따름
- 기능과 기능성 구현
- **API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 테스트 수행 필수**
- 각 단계 후 ROADMAP.md의 Task 진행 상황 업데이트
- 구현 완료 후 Playwright MCP를 사용한 E2E 테스트 실행
- 테스트 통과 확인 후 다음 단계로 진행
- 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 로드맵에서 완료된 작업을 ✅로 표시

### 공통 규칙 (모든 Task에 적용)

- 모든 Task의 기본 수락 기준에는 `npm run check`(typecheck → lint → format:check → test) 통과가 포함된다. 라우트·의존성을 바꾼 Task는 `npm run build`와 `npm run knip`도 통과해야 한다.
- Next.js 관련 코드는 작성 전에 `node_modules/next/dist/docs/`와 `docs/guides/nextjs-16.md`를 확인한다(Cache Components: 요청 시점 데이터를 읽는 컴포넌트는 `<Suspense>`로 감싸고, `dynamic`/`revalidate` 세그먼트 설정은 쓰지 않는다).
- shadcn 컴포넌트는 `npx shadcn@latest add <name>`로만 추가한다(`components/ui/`는 직접 작성하지 않음). import 방향은 `components/ui` ← `components/<domain>` ← `app/` 단방향.
- 테스트 시나리오의 "Playwright MCP"는 `mcp__playwright__*` 도구(사용자 설정으로 제공)를 뜻한다. 구현 시점에 도구를 쓸 수 없으면 같은 시나리오를 **수동 확인**(브라우저 직접 조작)으로 대체하고 `테스트 결과`에 그 사실을 적는다. 반복 실행이 필요한 시나리오는 `e2e/*.spec.ts`(Playwright Test)로도 고정한다.
- 관리자 E2E에는 테스트용 관리자 계정이 필요하다. 자격 증명은 `.env.local`의 `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`(접두 `NEXT_PUBLIC_` 금지)로 두고, 키 이름만 `.env.example`에 추가한다. E2E는 CI에서 실행하지 않는다.

### 라우트 맵 (Task 003에서 확정)

PRD는 블로그 상세 주소(`/blog/{slug}`)만 정한다. 나머지 경로는 아래 안으로 진행하고, 바꾸면 이 표와 헤더 메뉴 설정(`lib/site-config.ts`)을 함께 고친다.

| 페이지         | 경로                                     | 파일 (예정)                               | 인증        | 기능 ID                |
| -------------- | ---------------------------------------- | ----------------------------------------- | ----------- | ---------------------- |
| 메인           | `/`                                      | `app/(site)/page.tsx`                     | 불필요      | F001, F003, F005, F013 |
| 학력           | `/education`                             | `app/(site)/education/page.tsx`           | 불필요      | F002                   |
| 경력           | `/career`                                | `app/(site)/career/page.tsx`              | 불필요      | F002                   |
| 자격증         | `/certifications`                        | `app/(site)/certifications/page.tsx`      | 불필요      | F002                   |
| 사회봉사       | `/volunteer`                             | `app/(site)/volunteer/page.tsx`           | 불필요      | F002                   |
| 어학           | `/languages`                             | `app/(site)/languages/page.tsx`           | 불필요      | F002                   |
| 사회활동       | `/activities`                            | `app/(site)/activities/page.tsx`          | 불필요      | F002                   |
| 프로젝트       | `/projects`                              | `app/(site)/projects/page.tsx`            | 불필요      | F003                   |
| 논문           | `/publications`                          | `app/(site)/publications/page.tsx`        | 불필요      | F004                   |
| 블로그 목록    | `/blog?category=&tag=`                   | `app/(site)/blog/page.tsx`                | 불필요      | F005                   |
| 블로그 상세    | `/blog/{slug}` (한글 슬러그 허용)        | `app/(site)/blog/[slug]/page.tsx`         | 불필요      | F006, F007, F014       |
| 로그인         | `/auth/login`                            | `app/auth/login/page.tsx` (스타터 재사용) | 불필요      | F012                   |
| 관리자 글 목록 | `/admin/posts`                           | `app/admin/posts/page.tsx`                | 관리자 역할 | F010, F011, F012       |
| 글 편집기      | `/admin/posts/edit` (`?id=` 있으면 수정) | `app/admin/posts/edit/page.tsx`           | 관리자 역할 | F007~F010, F012        |

- 공개 페이지는 Route Group `app/(site)/`의 `layout.tsx`가 공통 헤더·푸터를 제공한다. 관리자 영역(`app/admin/`)과 로그인(`app/auth/`)은 별도 레이아웃을 쓴다.
- 접근 정책: `proxy.ts`(`lib/supabase/proxy.ts`)는 **`/admin` 경로만** 비로그인 시 `/auth/login`으로 리다이렉트하고, 나머지는 공개한다. 관리자 역할 검사는 proxy가 아니라 서버 코드(`requireAdmin()`)와 RLS가 담당하며, 로그인했지만 관리자가 아니면 `notFound()`로 처리한다.
- 글 편집기는 PRD 가정("작성/수정을 하나의 페이지로 처리")에 따라 단일 라우트로 둔다.

## 개발 단계

### Phase 0: 개발 환경 기반 구축 ✅

- **Task 001: 개발 도구 및 품질 게이트 구축** ✅ - 완료
  - 관련 기능: (기반 작업, 기능 ID 없음)
  - 관련 파일: `package.json`, `eslint.config.mjs`, `.prettierrc.json`, `.husky/**`, `commitlint.config.mjs`, `knip.jsonc`, `vitest.config.mts`, `playwright.config.ts`, `.github/workflows/ci.yml`, `components/ui/**`, `app/globals.css`
  - 수락 기준: `npm run check` 통과, CI 워크플로 존재, shadcn `base-nova`(Base UI)·Tailwind v4 적용
  - [x] Next.js + Supabase 인증 스타터 초기 세팅 (`666e087`, `243f628`)
  - [x] Tailwind v4 업그레이드 및 shadcn `base-nova`(Base UI) 전환, 미사용 Radix 제거 (`badeb92`, `bded365`)
  - [x] ESLint·Prettier·Husky·commitlint·knip 설정 (`25fb1e0`)
  - [x] Vitest·Playwright 설정 및 샘플 테스트 (`ed26b08`), GitHub Actions CI (`2614791`)
  - [x] 개발 가이드 5종·AGENTS.md·CLAUDE.md·서브 에이전트·MCP 설정, MVP PRD 작성 (`770ae6b`, `d2d5324` 등)
  - 테스트 체크리스트:
    - 정상: 터미널 → `npm run check` → typecheck·lint·format:check·test 모두 통과
    - 오류: (해당 없음, 기반 작업)
    - 엣지: (해당 없음)
  - 테스트 결과: 2026-10-25 `npm run check` 통과 (Vitest 1 파일 / 2 테스트 통과). E2E는 스타터 홈 기준 `e2e/home.spec.ts`만 존재하며 Task 002에서 교체 예정.

### Phase 1: 애플리케이션 골격 구축 ✅

- **Task 002: 스타터 잔재 정리 및 사이트 기본 설정** ✅ - 우선순위
  - 관련 기능: F012(회원가입 제거), F013(사이트 공통 설정)
  - 관련 파일: `components/tutorial/**`, `components/{deploy-button,hero,next-logo,supabase-logo,env-var-warning,sign-up-form,forgot-password-form,update-password-form}.tsx`, `app/auth/{sign-up,sign-up-success,forgot-password,update-password}/**`, `app/auth/confirm/route.ts`, `components/login-form.tsx`, `app/layout.tsx`, `app/page.tsx`, `lib/utils.ts`, `e2e/home.spec.ts`
  - 수락 기준: 스타터 안내용 코드와 가입 관련 페이지가 제거되어 `/auth/sign-up` 접근 시 없는 페이지가 표시되고, 로그인 폼에 가입·비밀번호 찾기 링크가 없으며, `<html lang="ko">`·사이트 제목 "hkoikoi.dev"·Noto Sans KR 폰트가 적용됨. `npm run check`·`npm run build`·`npm run knip` 통과
  - [x] `components/tutorial/`, `deploy-button`, `hero`, `next-logo`, `supabase-logo`, `env-var-warning` 삭제 및 참조 제거
  - [x] 회원가입 제거: `app/auth/sign-up/`, `app/auth/sign-up-success/`, `components/sign-up-form.tsx` 삭제, `login-form.tsx`의 가입 링크 제거
  - [x] 비밀번호 재설정 흐름(`forgot-password`, `update-password`, 관련 폼)과 이메일 확인용 `app/auth/confirm/route.ts`는 PRD 범위 밖이므로 삭제한다(관리자 비밀번호 재설정은 Supabase 대시보드에서 수행). 유지하기로 결정하면 이 항목에 사유를 적는다
  - [x] `app/layout.tsx`: `lang="ko"`, Geist → `next/font/google`의 Noto Sans KR, 메타데이터(title 템플릿 `%s | hkoikoi.dev`, description) 교체. `metadataBase`는 Task 018에서 `NEXT_PUBLIC_SITE_URL` 기준으로 교체
  - [x] `hasEnvVars` 검사 제거 여부 결정: 홈·`app/protected/layout.tsx` 참조는 제거하고, `lib/supabase/proxy.ts`의 검사는 로컬 환경 변수 미설정 시 개발 편의를 위해 유지(Task 011에서 재검토해 유지로 결정)
  - [x] `e2e/home.spec.ts`를 스타터 문구 의존 없이 새 홈 기준으로 갱신(임시: 페이지 로드·`lang="ko"` 확인)
  - 테스트 체크리스트:
    - 정상: Playwright MCP → `/` 접속 → 스타터 안내 문구("Next steps", "Deploy") 없음, `html[lang=ko]`
    - 정상: Playwright MCP → `/auth/login` 접속 → 이메일·비밀번호 입력란 표시, "Sign up"/"Forgot password" 링크 없음
    - 오류: Playwright MCP → `/auth/sign-up` 접속 → 없는 페이지(not-found) 화면
    - 엣지: 터미널 → `npm run knip` → 삭제한 파일을 가리키는 미사용 export·의존성 경고 없음
  - 테스트 결과: 2026-10-26 `npm run check`·`npm run build` 통과, `e2e/home.spec.ts`로 `html[lang=ko]`·제목·스타터 문구 없음 확인. 2026-10-26 수동 확인: `/auth/sign-up`·`/auth/forgot-password`·`/protected` 404, 로그인 폼에 가입·찾기 링크 없음, 홈에 스타터 문구 없음. `npm run knip`은 data·types 파일을 `knip.jsonc` `ignore`에 임시 추가해 통과(Task 007에서 제거)

- **Task 003: 라우트 구조 및 공개 경로 정책 구축** ✅ - 우선순위
  - 관련 기능: F002, F003, F004, F005, F006, F012, F013
  - 관련 파일: `app/(site)/**`, `app/admin/**`, `app/not-found.tsx`, `app/protected/**`(삭제), `lib/supabase/proxy.ts`, `proxy.ts`
  - 수락 기준: 라우트 맵의 모든 공개 경로가 비로그인 상태에서 빈 껍데기 페이지(제목만)로 열리고, `/admin/**`은 비로그인 시 `/auth/login`으로 리다이렉트되며, 없는 경로는 공통 not-found 화면을 표시. `npm run typecheck`(내부에서 `next typegen` 실행)·`npm run build` 통과
  - [x] `app/page.tsx`를 `app/(site)/page.tsx`로 이동하고 `app/(site)/layout.tsx` 골격 생성(헤더·푸터 자리)
  - [x] 이력 6종·프로젝트·논문·블로그 목록·블로그 상세(`[slug]`) 빈 페이지 생성. 동적 라우트는 `PageProps<'/blog/[slug]'>` 헬퍼 사용
  - [x] `app/admin/layout.tsx`, `app/admin/posts/page.tsx`, `app/admin/posts/edit/page.tsx` 빈 페이지 생성 후 `app/protected/` 삭제(로그인 후 리다이렉트 대상도 `/admin/posts`로 변경)
  - [x] `lib/supabase/proxy.ts`의 리다이렉트 조건을 "공개 경로 화이트리스트"에서 "`/admin` 접두만 보호"로 전환(`createServerClient`와 `getClaims()` 사이에 코드 추가 금지, `supabaseResponse` 쿠키 유지)
  - [x] `app/not-found.tsx` 작성(한국어 안내 + 메인으로 이동 링크)
  - [x] `e2e/routes.spec.ts`: 공개 경로 순회·`/admin` 리다이렉트·not-found 시나리오 고정
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 비로그인으로 `/education`, `/career`, `/certifications`, `/volunteer`, `/languages`, `/activities`, `/projects`, `/publications`, `/blog` 순회 → 각 페이지 제목 표시, 로그인 화면으로 튕기지 않음
    - 정상: Playwright MCP → `/blog/테스트-글` 접속 → 상세 껍데기 렌더링(한글 슬러그 디코딩 확인)
    - 오류: Playwright MCP → 비로그인으로 `/admin/posts` 접속 → URL이 `/auth/login`으로 변경
    - 오류: Playwright MCP → `/does-not-exist` 접속 → not-found 화면과 메인 링크
    - 엣지: Playwright MCP → `/administrator`(접두 유사 경로) 접속 → 리다이렉트 없이 not-found (보호 조건이 `/admin` 세그먼트 단위로만 동작)
  - 테스트 결과: 2026-10-26 `npm run test:e2e` 통과(공개 경로 순회, 한글 슬러그, `/admin`·`/admin/posts`·`/admin/posts/edit` 리다이렉트, `/administrator`·없는 경로 not-found). `npm run build` 통과

- **Task 004: 공통 헤더·푸터·테마 레이아웃 구축** ✅
  - 관련 기능: F013, F001(푸터 연락처)
  - 관련 파일: `components/layout/site-header.tsx`, `components/layout/site-footer.tsx`, `components/layout/mobile-nav.tsx`, `components/layout/nav-group-dropdown.tsx`, `components/layout/admin-link.tsx`, `components/theme-switcher.tsx`, `lib/site-config.ts`, `app/(site)/layout.tsx`
  - 수락 기준: 모든 공개 페이지에 동일한 헤더(로고, 이력▾·활동▾ 그룹 드롭다운과 프로젝트·논문·블로그 메뉴, 테마 전환)·푸터(이메일·GitHub)가 표시되고, 768px 미만에서는 드롭다운 메뉴로 전환되며 현재 페이지 메뉴가 강조됨. 로그인 페이지에는 헤더 메뉴가 없음
  - [x] `lib/site-config.ts`: 사이트명, 메뉴(이력▾[학력·경력·자격증·어학]·활동▾[사회봉사·사회활동]·프로젝트·논문·블로그, 메인은 로고로 대체)를 그룹 구조(`NavGroup`) 단일 배열로 정의
  - [x] `SiteHeader`(Server) + 현재 경로 강조용 작은 Client 컴포넌트(`usePathname`: `NavLink`, 그룹은 `NavGroupDropdown`), 데스크톱 가로 메뉴
  - [x] `MobileNav`: 기존 `components/ui/dropdown-menu`(Base UI) 기반 모바일 드롭다운
  - [x] `ThemeSwitcher` 한국어화 및 헤더 배치, 라이트/다크/시스템 전환
  - [x] `SiteFooter`: Profile 데이터의 이메일(mailto)·GitHub 링크
  - [x] "관리" 링크 슬롯(`AdminLink`)을 `<Suspense>`로 감싸 자리만 마련(실제 역할 판별은 Task 011). 스타터 `auth-button.tsx`는 Task 011에서 대체·삭제
  - 테스트 체크리스트:
    - 정상: Playwright MCP → `/` 접속 후 헤더 "프로젝트" 클릭 → `/projects` 이동, 해당 메뉴 `aria-current="page"`
    - 정상: Playwright MCP → 테마 전환 버튼으로 다크 선택 → `html`에 `dark` 클래스, 새로고침 후 유지
    - 엣지: Playwright MCP → 뷰포트 375px에서 메뉴 버튼 클릭 → 드롭다운에 그룹 라벨(이력·활동)과 하위 항목, 프로젝트·논문·블로그 표시, 항목 클릭 시 이동 후 닫힘
    - 엣지: Playwright MCP → 로고 클릭(임의 페이지) → `/` 이동
    - 오류: (해당 없음, 정적 UI)
  - 테스트 결과: 2026-10-26 `npm run check`·`npm run build`·`npm run test:e2e`(17개) 통과. e2e로 공개 10개 경로의 헤더 로고·푸터·`<main>` 1개와 로그인 페이지의 헤더 메뉴·푸터 부재 확인. `npm run knip`은 data·types 10개 파일을 `knip.jsonc` `ignore`에 임시 추가해 통과(Task 007에서 제거). 이후 내비를 그룹 드롭다운으로 개편했으며 2026-10-26 `npm run test:e2e` 18개 통과. 2026-10-26 Playwright MCP 수동 확인: 메뉴 클릭 시 `aria-current="page"`, 라이트·다크 전환과 새로고침 후 유지, 로고 클릭 시 `/` 이동, 375px 드롭다운 항목 클릭 시 이동 후 닫힘

- **Task 005: 도메인 타입 및 데이터 모델 설계** ✅
  - 관련 기능: F001, F002, F003, F004, F005, F006, F008, F009, F010
  - 관련 파일: `lib/types/profile.ts`, `lib/types/resume.ts`, `lib/types/post.ts`, `data/profile.ts`, `data/education.ts`, `data/career.ts`, `data/certifications.ts`, `data/volunteer.ts`, `data/languages.ts`, `data/activities.ts`, `data/projects.ts`, `data/publications.ts`
  - 수락 기준: PRD 데이터 모델의 정적 모델 4종과 Post 타입이 정의되고, `data/*.ts`가 타입을 만족하는 샘플 데이터(각 `// TODO: 실제 내용으로 교체` 표기)를 export. posts 테이블·스토리지 설계가 이 Task 하단 표로 확정됨(마이그레이션 구현은 Task 010)
  - [x] `Profile`(name, tagline, bio, email, github), `ResumeEntry`(title, subtitle?, period?, description?, tags?, link?), `Project`(name, summary, period, role, stack[], links, featured?), `Publication`(title, authors, venue, year, link) 정의
  - [x] `data/` 폴더 생성(루트, `@/data/*` 별칭으로 import) 및 섹션별 샘플 데이터 작성. 어학은 title=언어, subtitle=시험·점수, period=취득일
  - [x] 열린 질문 "대표 프로젝트 선정 기준"은 `Project.featured?: boolean`으로 표시하고 featured가 3개 미만이면 앞에서부터 채우는 규칙으로 기본 결정(변경 시 이 항목 갱신)
  - [x] `lib/types/post.ts`: `PostSummary`(목록 카드용), `Post`(상세), `PostInput`(편집기 입력) 타입. Task 010에서 `lib/supabase/database.types.ts`의 `Tables<'posts'>`에서 파생하도록 교체 완료
  - [x] posts·스토리지 설계 확정(아래 표)
  - posts 테이블 설계 (Task 010에서 구현):

    | 컬럼                    | 타입 / 제약                                                                     |
    | ----------------------- | ------------------------------------------------------------------------------- |
    | id                      | `uuid` PK, `default gen_random_uuid()`                                          |
    | slug                    | `text not null unique`, NFC 정규화된 값 저장, 한글 허용                         |
    | title                   | `text not null`, `char_length between 1 and 200`                                |
    | content                 | `text not null default ''`, 최대 길이 check(예: 100,000자, 서버 검증과 동일 값) |
    | excerpt                 | `text not null default ''`, `char_length <= 150`                                |
    | thumbnail_url           | `text null`                                                                     |
    | category                | `text not null default '일반'`                                                  |
    | tags                    | `text[] not null default '{}'`, `cardinality(tags) <= 10`                       |
    | published               | `boolean not null default false`                                                |
    | published_at            | `timestamptz null`, check `(not published) or published_at is not null`         |
    | created_at / updated_at | `timestamptz not null default now()`, `updated_at`은 트리거로 갱신              |
    - 인덱스: `(published, published_at desc)`, `tags`에 GIN, `category`
    - RLS: `select`는 `published = true` 또는 관리자, `insert/update/delete`는 관리자만. 관리자 판별식 `(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`
    - 스토리지 `blog-images`: public 버킷, `file_size_limit = 5MB`, `allowed_mime_types = image/jpeg, image/png, image/webp, image/gif`(SVG 불가), 경로 `YYYY/MM/<uuid>.<ext>`, 쓰기·삭제 정책은 관리자만

  - 테스트 체크리스트:
    - 정상: 터미널 → `npm run typecheck` → `data/*.ts`가 타입 오류 없이 통과
    - 오류: 터미널 → 임시로 `ResumeEntry`에 필수 필드 누락 → typecheck 실패 확인 후 원복(타입 강제 확인)
    - 엣지: `data/` 배열 하나를 빈 배열로 바꿔도 타입 통과(빈 상태 UI는 Task 007에서 검증)
  - 테스트 결과: `npm run check` 통과. `data/education.ts`에서 `title` 제거 시 TS2741로 실패 후 원복 확인, `languages`를 빈 배열로 바꿔도 통과 후 원복. posts·스토리지 설계 표는 변경 없이 확정. `npm run knip`은 data·types 파일을 `knip.jsonc` `ignore`에 임시 추가해 통과(Task 007에서 제거)

### Phase 2: UI/UX 완성 (더미 데이터 활용) ✅

- **Task 006: 공통 UI 컴포넌트 및 디자인 기반 구축** ✅
  - 관련 기능: F002, F003, F004, F005, F013
  - 관련 파일: `components/ui/{textarea,tabs,dialog,separator}.tsx`(CLI), `components/content/{page-header,empty-state,resume-entry-item,project-card,publication-item}.tsx`, `components/blog/{post-card,tag-badge,category-badge}.tsx`, `app/globals.css`
  - 수락 기준: PRD 지정 shadcn 컴포넌트(textarea, tabs, dialog, separator)가 CLI로 추가되고, 도메인 표시 컴포넌트가 라이트/다크·모바일 폭에서 깨지지 않음. `components/ui`는 수정하지 않고 래핑만 함
  - [x] `npx shadcn@latest add textarea tabs dialog separator` (폼 필드 구성용 `field`는 `forms-react-hook-form.md` 기준 필요 시 함께 추가)
  - [x] `PageHeader`(제목·설명), `EmptyState`(데이터 없음 안내) 공통 컴포넌트
  - [x] `ResumeEntryItem`(제목·부제·기간·설명·태그 배지·외부 링크 `target="_blank" rel="noreferrer"`), `ProjectCard`(기술 스택 배지·GitHub/데모 링크), `PublicationItem`
  - [x] `PostCard`(썸네일·제목·소개글·카테고리·태그·날짜, 썸네일 없을 때 대체 영역), `TagBadge`/`CategoryBadge`(블로그 목록 필터 링크)
  - [x] 날짜 표시 유틸 `lib/format-date.ts`(`ko-KR`, 고정 타임존 `Asia/Seoul`)와 단위 테스트
  - 테스트 체크리스트:
    - 정상: `lib/format-date.test.ts` → ISO 문자열 입력 → `2026. 10. 25.` 형식 출력
    - 엣지: `lib/format-date.test.ts` → UTC 자정 직전 시각 입력 → 서울 기준 다음 날짜로 표시
    - 엣지: Playwright MCP → Task 007/008 페이지에서 다크 모드·375px로 카드 확인 → 텍스트 넘침·대비 문제 없음
    - 오류: (해당 없음, 표시 컴포넌트)
  - 테스트 결과: 2026-10-26 `npm run check` 통과(`lib/format-date.test.ts`의 정상·UTC 자정 직전 케이스 포함). shadcn 4종은 CLI로 추가했고 CLI가 잘못 생성한 `cn` import는 `@/lib/utils`로 수정. Playwright MCP 수동 확인(다크·375px)은 미수행

- **Task 007: 메인·이력·프로젝트·논문 페이지 UI 완성** ✅
  - 관련 기능: F001, F002, F003, F004, F005(메인 최신 글 영역), F013
  - 관련 파일: `app/(site)/page.tsx`, `app/(site)/{education,career,certifications,volunteer,languages,activities,projects,publications}/page.tsx`, `components/content/resume-section.tsx`, `lib/dummy/posts.ts`
  - 수락 기준: 정적 페이지 8종이 `data/*.ts` 기반으로 완성되고(이 단계에서 F001~F004 기능 완료), 메인은 히어로·연락처·섹션 바로가기 카드·대표 프로젝트 3개·최신 글 3개(더미)를 표시. 데이터가 비면 안내 문구 표시. 모든 정적 페이지가 빌드 시 정적 프리렌더됨
  - [x] 메인 히어로(이름·한 줄 소개·소개문)와 이메일(mailto)·GitHub 링크
  - [x] 섹션 바로가기 카드(`lib/site-config.ts` 메뉴 재사용), 대표 프로젝트 3개(`featured` 규칙), 최신 글 3개(`lib/dummy/posts.ts`, 0건이면 안내 문구)
  - [x] 이력 6종은 `ResumeSection` 하나로 렌더링하고 페이지별로 데이터·제목만 주입
  - [x] 프로젝트 페이지 카드 그리드, 논문 페이지는 연도 내림차순 정렬(정렬 함수 단위 테스트)
  - [x] 페이지별 `metadata`(title·description) 지정
  - [x] `e2e/static-pages.spec.ts` 작성
  - [x] `knip.jsonc`의 `ignore`에서 Task 004-b 때 임시로 추가한 `data/*.ts` 8개와 `lib/types/{post,resume}.ts` 항목을 제거하고 `npm run knip` 통과 확인(`lib/types/post.ts`는 `PostInput`이 아직 미사용이라 편집기가 쓰게 되는 Task 013 완료 시점에 제거. 같은 이유로 `components/logout-button.tsx`·`lib/supabase/server.ts`는 Task 011·012에서 사용처가 생기면 ignore에서 제거하고, `auth-button.tsx`는 Task 011에서 삭제한다. 제거 조건은 `knip.jsonc` 주석에 적혀 있다)
  - 테스트 체크리스트:
    - 정상: Playwright MCP → `/` 접속 → 이름, `mailto:koikoilove99@gmail.com` 링크, `https://github.com/hkoikoi` 링크, 프로젝트 카드 3개, 글 카드 최대 3개
    - 정상: Playwright MCP → 메인 "학력" 섹션 카드 클릭 → `/education` 이동, 항목 제목·기간 표시
    - 정상: Playwright MCP → `/publications` 접속 → 연도가 내림차순으로 표시
    - 엣지: `lib/dummy/posts.ts`를 빈 배열로 바꾼 뒤 Playwright MCP → `/` → "아직 작성된 글이 없습니다" 안내
    - 엣지: Playwright MCP → `/languages` → 언어(제목)·시험·점수(부제)·취득일(기간) 형식 표시
    - 오류: 터미널 → `npm run build` → 정적 페이지가 동적 렌더링으로 분류되지 않음(빌드 로그의 라우트 표시 확인)
  - 테스트 결과: 2026-10-26 `npm run check`(Vitest 21개)·`npm run knip`·`npm run build` 통과, 빌드 로그에서 `/`와 이력·프로젝트·논문 페이지가 정적(○)으로 표시. `npm run test:e2e` 24개 통과(메인 mailto·GitHub 링크, 바로가기 카드 9개와 `/education` 이동, 논문 연도 내림차순, 프로젝트 링크 `target=_blank`, 어학 형식). Playwright MCP 수동 확인(2026-10-26): 다크·375px에서 `/`, 이력 6종, `/projects`, `/publications`, `/blog` 계열, not-found 등 14개 페이지 가로 넘침 없음(scrollWidth 375), `/` 스크린샷 육안 확인. `/`는 mailto·GitHub 링크, 바로가기 9개, `/education` 링크, 대표 프로젝트 카드 표시 확인, `/education`·`/languages` 항목·형식 표시 확인. `lib/dummy/posts.ts`를 임시로 빈 배열로 바꿔(원복·미커밋) `/`와 `/blog`에 "아직 작성된 글이 없습니다" 안내가 표시됨을 확인. `data/publications.ts`에 더미 논문 4건(2025 2건·2024·2023)을 추가해 `/publications`가 2025·2025·2024·2023·2022 내림차순이고 같은 해는 입력 순서 유지됨을 확인

- **Task 008: 블로그 목록·상세 UI 완성** ✅
  - 관련 기능: F005, F006, F013
  - 관련 파일: `app/(site)/blog/page.tsx`, `app/(site)/blog/[slug]/page.tsx`, `app/(site)/blog/_components/{post-filter-bar,post-list}.tsx`, `lib/posts/filter.ts`, `lib/dummy/posts.ts`
  - 수락 기준: 더미 글로 목록(최신순, 카테고리/태그 필터·현재 필터 표시·해제)과 상세(제목·날짜·카테고리·태그·본문 자리)가 동작하고, 없는 슬러그는 not-found. `searchParams`를 읽는 부분은 `<Suspense>`로 감쌈
  - [x] `lib/dummy/posts.ts`: 발행/초안이 섞인 더미 글 6건 이상(한글 슬러그·썸네일 없는 글·태그 10개 글 포함)
  - [x] `lib/posts/filter.ts`: 발행 글만·최신순·카테고리/태그 필터 순수 함수 + 단위 테스트(Task 012에서 DB 쿼리로 대체되면 삭제)
  - [x] 목록: `?category=`/`?tag=` 쿼리 기반 필터, 현재 필터 배지와 "필터 해제" 링크, 0건 안내
  - [x] 상세: 메타 영역, 태그/카테고리 클릭 시 `/blog?tag=`·`/blog?category=` 이동, 본문은 임시로 `whitespace-pre-wrap` 텍스트(Task 015에서 마크다운으로 교체)
  - [x] 초안·없는 슬러그는 `notFound()`
  - 테스트 체크리스트:
    - 정상: Playwright MCP → `/blog` → 발행 더미 글만 최신순 카드 표시(초안 제목 미노출)
    - 정상: Playwright MCP → 카드의 태그 클릭 → `/blog?tag=<태그>`, 해당 태그 글만 표시, 현재 필터 배지 표시 → "필터 해제" 클릭 → 전체 목록
    - 정상: Playwright MCP → 카드 클릭 → `/blog/<slug>` 상세, 카테고리 클릭 → 목록 필터 적용
    - 오류: Playwright MCP → `/blog/없는-글` → not-found 화면
    - 오류: Playwright MCP → 초안 더미 글 슬러그로 직접 접속 → not-found 화면
    - 엣지: Playwright MCP → `/blog?tag=존재하지않는태그` → 빈 목록 안내와 필터 해제 링크
    - 엣지: Playwright MCP → `/blog?category=a&tag=b`(동시 지정) → 두 조건 AND로 적용
  - 테스트 결과: 2026-10-26 `npm run check`·`npm run build` 통과. 프로덕션 서버 curl 확인: `/blog` 발행 글 5건(초안 미노출), `?tag=nextjs` 3건, 카테고리+태그 AND, 없는 태그는 빈 목록 안내와 "필터 해제", 초안·없는 슬러그는 not-found 화면(Suspense 스트리밍이라 HTTP 상태는 200, `noindex`). `e2e/routes.spec.ts`에 한글 슬러그 상세와 초안·없는 슬러그 not-found 추가. Playwright MCP 수동 확인(2026-10-26): `/blog` 발행 글 5건(초안 제목 미노출), 태그 클릭 → `/blog?tag=nextjs` 3건과 필터 배지, "필터 해제" 클릭 → `/blog` 복귀, 카드 클릭 → 한글 슬러그 상세(카테고리·태그 링크 확인), 카테고리 클릭 → `/blog?category=개발`, `?category=개발&tag=nextjs` AND 2건, `?tag=존재하지않는태그`와 `?category=a&tag=b`는 0건 안내와 "필터 해제"(`/blog`), `/blog/없는-글`·초안 슬러그 2종은 not-found(HTTP 200, noindex, 초안 제목 미노출). 다크·375px에서 `/blog` 계열 가로 넘침 없음, 스크린샷 육안 확인

- **Task 009: 로그인·관리자 글 목록·글 편집기 UI 완성** ✅
  - 관련 기능: F007(미리보기 자리), F008, F009(업로드 UI 자리), F010, F011, F012
  - 관련 파일: `app/auth/login/page.tsx`, `components/login-form.tsx`, `app/admin/layout.tsx`, `app/admin/posts/page.tsx`, `app/admin/posts/_components/{post-table,delete-post-dialog}.tsx`, `app/admin/posts/edit/page.tsx`, `app/admin/posts/edit/_components/post-editor.tsx`, `lib/posts/slugify.ts`
  - 수락 기준: 더미 데이터로 관리자 글 목록(제목·상태 배지·카테고리·수정일·새 글/수정/삭제/로그아웃 버튼)과 편집기(모든 입력 필드·150자 카운터·슬러그 자동 제안·데스크톱 좌우 분할/모바일 탭)가 표시됨. 저장·삭제는 아직 동작하지 않음(버튼 비활성 또는 콘솔 없는 no-op)
  - [x] 로그인 페이지 한국어화(가입·재설정 링크 없음), 오류 메시지 영역
  - [x] 관리자 레이아웃: 사이트 로고, "글 관리"/"새 글" 링크, 로그아웃 버튼 자리
  - [x] 글 목록 표(초안/발행 배지 구분), 삭제 확인 `Dialog`
  - [x] (009-b) 편집기 필드: 제목, 슬러그(제목 입력 시 자동 제안, 사용자가 직접 수정하면 자동 제안 중단), 카테고리(기본 "일반"), 태그(쉼표 입력·칩 표시·최대 10개), 소개글(150자 카운터), 썸네일 자리, 발행 여부 체크박스, 본문 textarea, 미리보기 영역(009-c에서 본문 입력 옆에 배치). 슬러그 입력은 고정 `/blog/` 접두어 뒤의 값만 수정 가능한 URL 입력으로 구현
  - [x] `lib/posts/slugify.ts`: 공백→하이픈, 영문 소문자화, 한글·숫자·하이픈만 유지, 연속 하이픈 축약, NFC 정규화 + 단위 테스트
  - [x] (009-c) 데스크톱(≥1024px) 좌우 분할, 모바일 `Tabs`(작성/미리보기) 전환
  - 테스트 체크리스트:
    - 정상: `lib/posts/slugify.test.ts` → `"Next.js 16 시작하기!"` → `"nextjs-16-시작하기"`
    - 정상: Playwright MCP → `/admin/posts/edit`(Task 011 이전에는 proxy 보호를 일시 우회한 로컬 환경 또는 수동 확인) → 제목 입력 → 슬러그 자동 제안, 소개글 입력 시 카운터 `n/150` 갱신
    - 엣지: `slugify.test.ts` → NFD로 분해된 한글 입력 → NFC 결과와 동일, 특수문자만 입력 → 빈 문자열
    - 엣지: Playwright MCP → 태그 11개 쉼표 입력 → 10개까지만 칩 생성 또는 초과 경고 표시
    - 엣지: Playwright MCP → 375px 폭 → 작성/미리보기 탭 전환, 1280px → 좌우 분할
    - 오류: Playwright MCP → 소개글 151자 입력 → 카운터가 오류 색으로 표시(제출 차단은 Task 013)
  - 테스트 결과(009-c 범위: 분할/탭): 2026-10-26 `npm run check` 통과. proxy 보호를 로컬에서만 임시 우회(원복·미커밋)하고 Playwright로 `/admin/posts/edit` 확인: 라이트·다크 1280px에서 폼(x=144)과 미리보기(x=656) 좌우 분할·탭 숨김, 본문 입력이 미리보기에 즉시 반영. 375px에서 작성 탭만 표시, 미리보기 탭 전환 시 폼 숨김·미리보기 표시, 작성 탭 복귀 후 제목·본문 입력값 유지, 가로 스크롤 없음(scrollWidth 375). 미리보기는 임시 whitespace-pre-wrap이며 Task 015·016에서 MarkdownContent로 교체
  - 테스트 결과(009-b 범위: 편집기 필드·slugify, 분할/탭·미리보기는 009-c 미수행): 2026-10-26 `npm run check` 통과(Vitest 25개, slugify 4개). proxy 보호를 로컬에서만 임시 우회(원복·미커밋)하고 Playwright로 `/admin/posts/edit` 확인: 제목 입력 시 슬러그 `nextjs-16-시작하기` 제안, 슬러그 직접 수정 후 제목 변경해도 유지, 카테고리 기본 `일반`, 소개글 카운터 `n/150` 갱신(150자까지 일반 색, 151자 text-destructive), 태그 11개+중복 입력 시 칩 10개와 초과 경고, 저장 버튼 비활성. 라이트·다크 1280px, 375px(가로 스크롤 없음) 확인
  - 테스트 결과(009-a 범위: 로그인·관리자 레이아웃·글 목록, 편집기·slugify는 미수행): 2026-10-26 `npm run check` 통과. proxy 보호를 로컬에서만 임시 우회(원복·미커밋)하고 Playwright로 `/admin/posts` 확인: 라이트·다크 1280px에서 7행, 초안 2건/발행 5건 배지 구분, 삭제 클릭 시 Dialog 열림, Dialog 내 삭제 확정 시 닫힘, 375px에서 표 컨테이너만 가로 스크롤(scrollWidth 603 > clientWidth 341, 문서 폭 375 유지). `/auth/login`은 한국어 문구, 링크(가입·재설정) 0개. 로그인 오류 영역은 `role="alert"`로 유지(실제 오류 발생은 Supabase 연동 범위라 미확인)

### Phase 3: 핵심 기능 구현 (DB·인증·블로그)

- **Task 010: posts 테이블·RLS·스토리지 마이그레이션 구축** ✅ - 우선순위 (스토리지 업로드·실제 관리자 JWT 확인은 관리자 UI 연동 후 수동 확인으로 이월)
  - 관련 기능: F005, F006, F008, F009, F010, F011, F012
  - 관련 파일: `supabase/migrations/<timestamp>_create_posts.sql`, `supabase/migrations/<timestamp>_create_blog_images_bucket.sql`, `lib/supabase/database.types.ts`
  - 수락 기준: Task 005 설계대로 테이블·제약·인덱스·`updated_at` 트리거·RLS·버킷·스토리지 정책이 마이그레이션 파일로 존재하고 원격(또는 로컬) 프로젝트에 적용됨. 생성된 DB 타입으로 `lib/types/post.ts`가 파생되고 typecheck 통과. Supabase advisor 보안 경고 0건
  - [x] `supabase/` 디렉터리와 마이그레이션 작성(`.agents/skills/supabase` 스킬·Supabase MCP 참고, 스키마 변경 전 기존 테이블 확인)
  - [x] RLS 활성화 및 정책: 익명/일반 사용자 `select`는 `published = true`만, 관리자(`app_metadata.role = 'admin'`)는 전체 CRUD
  - [x] `blog-images` 버킷(public, 5MB, MIME 제한)과 `storage.objects` 정책(관리자만 insert/update/delete)
  - [x] Supabase MCP `generate_typescript_types`로 `lib/supabase/database.types.ts` 생성, `createClient`에 `Database` 제네릭 적용
  - [x] Supabase MCP `get_advisors`(security) 실행 후 경고 해소(`auth_leaked_password_protection` 1건은 Pro 플랜 미사용으로 예외 수용, 아래 테스트 결과 참조)
  - 테스트 체크리스트:
    - 정상: Supabase MCP `execute_sql` → 관리자 JWT 컨텍스트로 초안 insert → 성공
    - 오류: Supabase MCP `execute_sql` → `published = true, published_at = null` insert → check 제약 위반
    - 오류: Supabase MCP `execute_sql` → 동일 slug 두 번 insert → unique 위반(23505)
    - 오류: Supabase MCP `execute_sql` → `anon` 역할로 초안 select → 0행, insert → RLS 거부
    - 엣지: Supabase MCP `execute_sql` → tags 11개 / excerpt 151자 / title 0자·201자 insert → 각 check 위반
    - 엣지: 브라우저 클라이언트(수동 확인) → 비관리자 세션으로 `blog-images`에 업로드 → 정책 거부, SVG 업로드 → MIME 거부
  - 테스트 결과: 2026-10-26 마이그레이션 2건 원격 적용(version `20261026105752` create_posts, `20261026105803` create_blog_images_bucket, 로컬 파일명과 일치). 롤백 트랜잭션으로 체크리스트의 정상·오류·엣지 SQL 케이스 11건을 실행해 모두 기대 결과를 확인했고 잔존 행 0. `generate_typescript_types`로 `lib/supabase/database.types.ts` 생성, 브라우저·서버·proxy 클라이언트에 `Database` 제네릭 적용, `lib/types/post.ts`를 `Tables<'posts'>`에서 파생(`PostSummary`/`Post`/`PostInput` 이름·필드 형태 유지, 더미 데이터 수정 없이 typecheck 통과). `npm run check` 통과(Vitest 25개), `npm run knip`은 `knip.jsonc` ignore에 `database.types.ts` 추가 후 통과. advisor 보안 경고 1건(`auth_leaked_password_protection`)은 Pro 플랜 미사용이라 예외 수용(대신 회원가입 차단, 최소 비밀번호 12자, 대소문자·숫자·기호 필수 적용)이라 수락 기준 "경고 0건"은 이 1건을 예외로 둔 상태에서 충족(경고 자체는 남아 있음). 성능 advisor INFO `unused_index` 3건은 빈 테이블이라 정상. 관리자 계정은 `app_metadata.role = 'admin'` 부여 완료. 미확인(관리자 UI에 DB 연동 후 수동 확인으로 이월): 비관리자 세션의 `blog-images` 업로드 거부, SVG 업로드 MIME 거부, 5MB 제한, 실제 관리자 JWT 기반 posts CRUD

- **Task 011: 관리자 인증·권한 시스템 구축** ✅
  - 관련 기능: F012, F013("관리" 링크)
  - 관련 파일: `lib/auth/require-admin.ts`, `lib/auth/is-admin.ts`, `app/auth/login/actions.ts`, `components/login-form.tsx`, `components/logout-button.tsx`, `components/auth-button.tsx`(삭제), `components/layout/admin-link.tsx`, `app/admin/**`, `lib/supabase/proxy.ts`
  - 수락 기준: 관리자 계정은 로그인 후 `/admin/posts`로 이동하고, 비로그인 사용자의 `/admin/**` 접근은 `/auth/login`으로, 로그인한 비관리자의 접근은 not-found로 처리됨. 로그아웃 시 `/`로 이동. 관리자 로그인 상태에서만 공개 헤더에 "관리" 링크 표시. 회원가입은 UI와 Supabase 설정 모두에서 차단됨
  - [x] `isAdmin(claims)` 순수 함수(`app_metadata.role === 'admin'`) + 단위 테스트, `requireAdmin()`(서버 전용: `getClaims()` → 없으면 `redirect('/auth/login')`, 비관리자면 `notFound()`)
  - [x] 관리자 페이지와 모든 Server Action 시작부에서 `requireAdmin()` 호출(레이아웃 검사에만 의존하지 않음) — 레이아웃(`AdminGuard`)과 `posts`·`edit` 페이지는 적용 완료. `savePost`·`deletePost`의 시작부 `requireAdmin()` 적용은 Task 013에서 완료
  - [x] 로그인 폼을 Server Action + `useActionState` 패턴으로 전환(`forms-react-hook-form.md`), 실패 시 한국어 오류 유지, 성공 시 `/admin/posts` — e2e로 로그인 성공·실패 확인
  - [x] 로그아웃 버튼을 관리자 레이아웃에 배치, 완료 후 `/`로 이동. 스타터 `auth-button.tsx` 삭제 — e2e로 로그아웃 후 `/` 이동 확인
  - [x] 공개 헤더 `AdminLink`: `<Suspense>` 안에서 claims를 읽어 관리자일 때만 "관리" 링크 렌더링 — 푸터 슬롯에 구현, e2e로 관리자 로그인 시 노출·로그아웃 후 사라짐 확인
  - [x] 수동 설정(2026-10-26 완료): Supabase 대시보드에서 관리자 계정 생성, `app_metadata.role = 'admin'` 부여(SQL), "Allow new users to sign up" 해제(2026-10-27 대시보드에서 해제 상태 재확인), 최소 비밀번호 12자·대소문자·숫자·기호 필수 적용. 남은 항목: 부여 후 재로그인, MFA(선택)
  - [x] `e2e/admin-auth.spec.ts`(`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` 사용, 미설정 시 `test.skip`)
  - 테스트 체크리스트:
    - 정상: Playwright MCP → `/auth/login`에서 관리자 이메일·비밀번호 입력 후 로그인 → `/admin/posts` 이동
    - 정상: Playwright MCP → 관리자 로그인 상태에서 `/` → 헤더 "관리" 링크 표시 → 클릭 시 `/admin/posts`
    - 정상: Playwright MCP → 관리자 레이아웃 "로그아웃" 클릭 → `/` 이동, "관리" 링크 사라짐, `/admin/posts` 재접근 시 `/auth/login`
    - 오류: Playwright MCP → 잘못된 비밀번호로 로그인 → 같은 페이지에 오류 메시지, 입력한 이메일 유지
    - (제외) 비관리자 테스트 계정으로 로그인 후 `/admin/posts`·`/admin/posts/edit` 접속 → not-found 화면: 관리자는 본인 1명만 두는 방침이라 비관리자 계정이 존재하지 않아 수행 대상에서 제외, `requireAdmin()`의 `notFound()` 코드로 보장
    - (제외) Supabase Auth API `signUp` 호출 → 가입 비활성화 오류: 대시보드에서 "Allow new users to sign up" 해제를 직접 확인했으므로 수행 대상에서 제외
    - 엣지: `lib/auth/is-admin.test.ts` → `role` 없음 / `user_metadata.role = 'admin'`(사용자 수정 가능 영역) → false
  - 테스트 결과: 2026-10-27 `npm run check`(Vitest 30개)·`npm run build`·`npm run knip` 통과, 공개 페이지 PPR 분류 유지. 임시 E2E 관리자 계정을 만들어 `npm run test:e2e` 28개 모두 통과(skip 0)를 확인한 뒤, 관리자는 본인 1명만 두는 방침에 따라 그 계정을 삭제함(현재 `auth.users`는 관리자 1건). `playwright.config.ts`가 `.env`의 `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`를 로드하며, 본인 관리자 계정으로 설정해 다시 돌린 `npm run test:e2e`도 28개 모두 통과(skip 0). 값이 없으면 관리자 시나리오는 skip. 통과한 시나리오: 로그인 → `/admin/posts`, 푸터 "관리" 링크 표시, 로그아웃 → `/` 후 링크 사라짐·`/admin/posts` 재접근 시 `/auth/login`, 잘못된 비밀번호 시 오류 메시지·이메일 유지, 비로그인 `/admin/**` 리다이렉트. `knip.jsonc`에서 `logout-button`·`server.ts` 예외를 제거했고 `lib/supabase/client.ts`는 Task 017 전까지 임시 예외로 추가. `hasEnvVars` 검사는 env 미설정 시 공개 페이지 500을 막는 안전장치라 유지(근거는 `lib/supabase/proxy.ts` 주석). advisor 보안 경고는 기존 예외 1건뿐. 2026-10-27 사용자가 Supabase 대시보드에서 "Allow new users to sign up" 해제 상태를 직접 확인함(MCP로는 확인 불가, `signUp` API 호출 테스트는 수행하지 않음). 수행 대상 제외: 로그인한 비관리자의 not-found 확인(관리자 1명만 두는 방침이라 비관리자 계정이 없음, `requireAdmin()`의 `notFound()` 코드로 보장), `signUp` API 호출 시 가입 비활성화 오류 확인(대시보드 해제 상태를 직접 확인). Playwright MCP 수동 시나리오는 e2e(`e2e/admin-auth.spec.ts`)로 대체

- **Task 012: 블로그 공개 조회 데이터 연동** ✅
  - 관련 기능: F005, F006, F010(초안 비노출)
  - 관련 파일: `lib/queries/posts.ts`, `app/(site)/page.tsx`, `app/(site)/blog/page.tsx`, `app/(site)/blog/[slug]/page.tsx`, `lib/dummy/posts.ts`(삭제), `lib/posts/filter.ts`(삭제)
  - 수락 기준: 메인 최신 글 3개·블로그 목록·상세가 Supabase `posts`의 발행 글을 표시하고 더미 데이터·필터 순수 함수가 제거됨. 조회 실패 시 목록은 빈 목록 안내, 상세는 not-found. 한글 슬러그 상세 정상 조회
  - [x] `lib/queries/posts.ts`(서버 전용): `getLatestPosts(limit)`, `getPublishedPosts({ category, tag })`(`published_at desc`, 태그는 `contains`), `getPostBySlug(slug)`(NFC 정규화 후 조회, React `cache()`로 `generateMetadata`와 본문이 한 번만 조회). `generateStaticParams`는 제거해 요청 시점에 조회
  - [x] 공개 조회는 `published = true` 조건을 쿼리에도 명시(RLS와 이중 방어, 관리자 로그인 상태에서도 공개 페이지에 초안이 섞이지 않게)
  - [x] 요청 시점 데이터 컴포넌트를 `<Suspense>` + 스켈레톤으로 감쌈(캐싱 전략은 Task 019)
  - [x] 조회 오류는 `console.error` 후 빈 목록 반환, 상세는 `notFound()`. catch에서 `unstable_rethrow`를 먼저 호출해 프리렌더 중단 신호(`HANGING_PROMISE_REJECTION`)를 삼키지 않음
  - [x] 더미 데이터 제거 후 `npm run knip` 통과 (`lib/types/post.ts` 예외는 `PostInput`이 아직 미사용이라 유지, Task 013에서 제거)
  - 테스트 체크리스트:
    - 정상: Supabase MCP로 발행 글 2건·초안 1건 시드 → Playwright MCP → `/blog` → 발행 2건만 최신순 표시
    - 정상: Playwright MCP → `/` → 최신 글 카드 최대 3개, 클릭 시 상세 이동
    - 정상: Playwright MCP → `/blog?category=일반` → 해당 카테고리 글만
    - 오류: Playwright MCP → 초안 글 슬러그로 `/blog/<slug>` 직접 접속(비로그인·관리자 모두) → not-found
    - 오류: `.env.local`의 Supabase URL을 잘못된 값으로 바꾼 상태(수동 확인) → `/blog` 빈 목록 안내, 페이지 오류 화면 없음
    - 엣지: Playwright MCP → 한글 슬러그 글을 퍼센트 인코딩 URL(`/blog/%ED%85%8C...`)로 접속 → 정상 상세
    - 엣지: Playwright MCP → 발행 글 0건 상태 `/` → 최신 글 안내 문구
  - 테스트 결과: 2026-10-27 `npm run check`(Vitest 38개)·`npm run build`·`npm run knip` 통과, 빌드에서 `/`는 Partial Prerender(◐) 유지. 원격 `posts`(0행)에 `e2e-seed-` 시드(발행 4건·초안 1건, 체크리스트의 2건+1건과 달리 홈 3개 제한까지 보려고 4건)를 넣고 dev 서버에서 Playwright(스크립트)로 확인한 뒤 시드 5건을 삭제함(현재 `posts` 0행).
    - 통과: `/blog` 발행 4건만 최신순(초안 제외) / `/` 최신 글 3개(가장 오래된 글 제외) / `?category=일반` 해당 2건 / `?tag=한글` 1건 / 한글 슬러그를 퍼센트 인코딩 URL로 접속 시 상세 표시 / 비로그인 초안 슬러그·없는 슬러그는 not-found 화면 / 발행 0건에서 `/`·`/blog` 모두 "아직 작성된 글이 없습니다" 표시.
    - 알려진 동작: not-found 화면이 뜨는데도 `curl -I` 기준 HTTP 상태는 200이다(스트리밍 시작 후 `notFound()`). 대신 `noindex` 메타가 주입된다. 404 상태 코드가 필요하면 Task 019(SEO·캐싱)에서 재검토.
    - 통과(2026-10-27 추가): 관리자 로그인 상태에서 초안 슬러그 `/blog/e2e-seed-draft` 접속 시 not-found, `/blog` 목록에 초안 미노출. `e2e/admin-auth.spec.ts`에 시나리오로 추가했고(`playwright.config.ts`가 `.env`의 `E2E_ADMIN_*`를 읽는 기존 경로 사용) 시드(발행 1건·초안 1건)를 넣고 5개 모두 통과, skip 0. 이 시나리오는 초안이 DB에 있을 때만 의미가 있어 시드 없이 돌리면 통과해도 검증이 되지 않으며, 실행 후 시드는 삭제함(`posts` 0행).
    - 통과(2026-10-27 추가): 잘못된 Supabase URL. `.env.local`은 수정하지 않고 셸 환경변수로 `NEXT_PUBLIC_SUPABASE_URL=https://invalid-host.example.invalid npx next dev -p 3100`을 띄워 확인했다(셸 환경변수가 `.env` 파일보다 우선). `/blog`·`/`는 200과 "아직 작성된 글이 없습니다" 안내, `/blog/anything`은 not-found 화면, 오류 오버레이 없음. 서버 로그에는 `[getLatestPosts]`·`[getPublishedPosts]` `TypeError: fetch failed`가 `console.error`로 남았다.
    - `npm run test:e2e` 27개 통과. `e2e/routes.spec.ts`의 더미 슬러그 시나리오는 시드 비의존 "없는 슬러그 not-found"로, `e2e/static-pages.spec.ts`의 최신 글 항목 수 검사는 섹션 표시 검사로 바꿈(글은 DB 데이터라 0건일 수 있음).
    - `app/admin/posts/page.tsx`는 더미를 지우면서 빈 목록 TODO로 바꿨고 실데이터 연결은 Task 013에서 한다.

- **Task 013: 글 저장·발행·삭제 Server Action 구현** ✅
  - 관련 기능: F008, F010, F011, F012
  - 관련 파일: `lib/schemas/post.ts`, `app/admin/posts/actions.ts`, `app/admin/posts/page.tsx`, `app/admin/posts/edit/page.tsx`, `app/admin/posts/edit/_components/post-editor.tsx`, `lib/queries/admin-posts.ts`
  - 수락 기준: 관리자가 새 글·수정을 초안/발행으로 저장하면 `/admin/posts`로 이동하고 공개 영역 노출 여부가 상태와 일치. 검증 실패·슬러그 중복은 해당 필드 옆에 오류로 표시되고 입력값 유지. 삭제는 확인 후 목록과 공개 목록에 즉시 반영
  - [x] `zod` 설치 및 `lib/schemas/post.ts`: title 1~200, slug(NFC 정규화·`slugify` 규칙 일치·비어 있지 않음), category(기본 "일반"), tags(trim·중복 제거·최대 10), excerpt ≤150, content 최대 길이(Task 005 값), thumbnail_url은 `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/` 접두만 허용 + 단위 테스트
  - [x] `savePost`(create/update 공용) Server Action: `requireAdmin()` → 스키마 검증 → upsert → unique 위반(23505)을 slug 필드 오류로 변환 → 성공 시 `redirect('/admin/posts')`
  - [x] 발행 규칙: 처음 발행할 때 `published_at = now()`, 이미 발행된 글 수정 시 기존 값 유지, 초안 전환 시 유지/초기화 정책을 정해 주석으로 명시(기본: 유지)
  - [x] (Task 011 이월) `savePost`·`deletePost` 등 모든 관리자 Server Action 시작부에서 `requireAdmin()` 호출(레이아웃 검사에만 의존하지 않음)
  - [x] `deletePost` Server Action + 확인 `Dialog`, 삭제 후 목록 갱신(`revalidatePath`/`updateTag` 중 Task 019 캐싱 전략과 일치하는 방식, `nextjs-16.md` 확인)
  - [x] 관리자 글 목록·편집기(수정 모드 `?id=`)를 실제 데이터로 연결, 존재하지 않는 id는 not-found (Task 012 이월: `app/admin/posts/page.tsx`가 현재 빈 목록 TODO이므로 `lib/queries/admin-posts.ts`로 초안 포함 전체 글을 연결하고, 이때 `lib/types/post.ts`의 `PostInput` 사용으로 `knip.jsonc` 예외도 제거)
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 관리자 로그인 → "새 글" → 제목·본문 입력, 발행 체크 후 저장 → `/admin/posts`에 "발행" 배지 → `/blog`에 노출
    - 정상: Playwright MCP → 초안으로 저장 → 목록 "초안" 배지, `/blog` 미노출, 상세 URL은 not-found
    - 정상: Playwright MCP → 기존 글 "수정" → 제목 변경 저장 → 목록·상세에 반영, `published_at` 불변
    - 정상: Playwright MCP → "삭제" → 확인 대화상자 "삭제" → 목록에서 사라지고 `/blog`에서도 즉시 미노출
    - 오류: Playwright MCP → 이미 있는 슬러그로 저장 → 슬러그 필드에 "이미 사용 중인 슬러그" 오류, 다른 입력값 유지
    - 오류: Playwright MCP → 제목 비움 / 소개글 151자 → 필드별 서버 검증 오류
    - 오류: 터미널(수동 확인) → 비로그인 상태로 Server Action 요청 재전송 → 실패(리다이렉트), DB 변경 없음
    - 엣지: `lib/schemas/post.test.ts` → 외부 도메인 썸네일 URL / `javascript:` URL → 거부, 버킷 URL → 통과
    - 엣지: `lib/schemas/post.test.ts` → NFD 한글 슬러그 입력 → NFC로 정규화되어 저장 값과 조회 값 일치
    - 엣지: Playwright MCP → 삭제 대화상자에서 "취소" → 글 유지
  - 테스트 결과: 2026-10-27 수행.
    - 통과: `e2e/admin-posts.spec.ts` 7개 시나리오 통과(`npx playwright test e2e/admin-posts.spec.ts`, skip 0). 발행 저장→'발행' 배지→`/blog` 노출 / 초안 저장→'초안' 배지→`/blog` 미노출·상세 URL not-found / 수정 후 목록·상세 제목 반영 / 삭제 확인→목록·`/blog`에서 사라짐 / 삭제 취소→글 유지 / 중복 슬러그→슬러그 필드 '이미 사용 중인 슬러그입니다' 오류와 제목·소개글·본문 입력값 유지 / 제목 비움·소개글 151자→`aria-invalid`와 필드별 오류. 테스트 글은 `e2e-` 접두로 만들고 `afterAll`에서 UI로 지우며, 실행 후 `posts`의 `e2e-` 행 0건을 SQL로 확인했다.
    - 통과: 비로그인 상태 Server Action 재전송(curl, 쿠키 없음). 서버 참조 매니페스트에서 `savePost`·`deletePost` action ID를 찾아 `/admin/posts`(deletePost)·`/admin/posts/edit`(savePost 신규·수정)로 POST하면 모두 307 `/auth/login`. 관리자 경로가 아닌 `/blog`·`/auth/login`으로 보내면 409 'Server Action unavailable'. 요청 후 확인용 글(`e2e-curl-probe`)은 삭제·수정되지 않았고 `e2e-curl-hack` 글도 생기지 않았다(확인 후 확인용 글은 삭제).
    - 통과: `lib/schemas/post.test.ts`의 외부 도메인·`javascript:` 썸네일 거부, 버킷 URL 통과, NFD 한글 슬러그의 NFC 정규화. `npm run check`(Vitest 76개)·`npm run knip` 통과.
    - 제한 사항: 체크리스트의 'Playwright MCP' 항목은 MCP 브라우저가 아니라 위 Playwright e2e 스펙으로 같은 시나리오를 확인했다(관리자 자격 증명이 `.env`에만 있고 에이전트가 읽지 못해 MCP 브라우저로는 로그인하지 않음). `published_at` 불변은 e2e에서 상세 페이지의 발행일 표시(일 단위)가 수정 전후 같은지만 확인했고, 초 단위 값은 `lib/posts/published-at.test.ts` 단위 테스트가 보장한다. 비관리자(로그인했지만 admin이 아닌) 계정의 Server Action 호출은 미수행(`requireAdmin()`이 `notFound()`로 처리하는 경로는 코드 리뷰와 단위 테스트 범위).

- **Task 014: 핵심 기능 통합 테스트**
  - 관련 기능: F001~F006, F008, F010~F013
  - 관련 파일: `e2e/visitor-flow.spec.ts`, `e2e/admin-flow.spec.ts`, `e2e/access-control.spec.ts`, `e2e/fixtures/**`
  - 수락 기준: PRD 사용자 여정 1~7(방문자·관리자)이 E2E로 통과하고, 테스트가 만든 글은 종료 시 정리됨. 실패 시나리오(권한·검증·없는 글)가 모두 포함됨
  - [x] 방문자 여정: 메인 → 섹션 카드 → 이력 페이지 → 헤더로 프로젝트·논문 → 블로그 목록 → 태그 필터 → 상세 → 카테고리 → 로고로 메인
  - [x] 관리자 여정: 로그인 → 새 글(초안) → 수정 후 발행 → 공개 확인 → 삭제 → 로그아웃
  - [x] 접근 제어: 비로그인의 관리자 영역 접근 차단
    - (제외) 비관리자의 관리자 영역·Server Action 접근 차단: 수행 대상 제외(관리자 1명만 두는 방침, `requireAdmin()`의 `notFound()` 코드와 `isAdmin` 단위 테스트로 보장)
  - [x] 테스트 데이터 고유 접두(`e2e-visitor-`·`e2e-flow-`·`e2e-posts-`) 사용 및 `afterAll` 정리
  - [x] 발견된 결함은 해당 Task로 되돌려 수정 후 재실행(앱 결함은 없었고 e2e 헬퍼의 삭제 대기 레이스를 수정)
  - 테스트 체크리스트:
    - 정상: 방문자 여정 전체 → 각 단계 URL·제목 일치 (Playwright MCP 대신 `e2e/visitor-flow.spec.ts`로 확인)
    - 정상: 관리자 여정 전체 → 상태 배지·공개 노출이 단계별로 일치 (Playwright MCP 대신 `e2e/admin-flow.spec.ts`로 확인)
    - (제외) 비관리자 계정으로 `/admin/posts/edit?id=<실제 id>` → not-found: 수행 대상 제외(관리자 1명만 두는 방침, `requireAdmin()`의 `notFound()` 코드와 `isAdmin` 단위 테스트로 보장)
    - 오류: 로그인 실패 3회 반복 → 매번 오류 표시, 페이지 깨짐 없음 (`e2e/access-control.spec.ts`로 확인)
    - 엣지: 한글 슬러그 글 생성 → 목록 카드 클릭 → 상세 → 브라우저 뒤로 가기 시 필터 상태 유지 (`e2e/visitor-flow.spec.ts`로 확인)
    - 엣지: 터미널 → `npm run test:e2e` → 전체 통과(관리자 자격 증명 미설정 시 관리자 스펙만 skip)
  - 테스트 결과: 2026-10-27 `npm run check`(Vitest 76개)·`npm run knip` 통과. `npm run test:e2e`는 관리자 자격 증명 설정 상태에서 42개 모두 통과(skip 0)를 3회 연속 확인했고, 자격 증명을 비운 상태에서는 28개 통과·14개 skip(관리자 스펙만)·실패 0. 통과한 시나리오: 방문자 여정(정적 구간, 태그 필터·상세·뒤로 가기 필터 유지, 카테고리·로고), 관리자 여정(초안→발행→삭제→로그아웃, 단계별 배지·공개 노출), 비로그인의 `/admin/posts`·`/admin/posts/edit` 리다이렉트, 임의 계정 로그인 실패 3회 반복 시 매번 오류 표시. 종료 후 DB에 `e2e-` 접두 글 0건. 삭제 직후 `/blog`에 글이 간헐적으로 남는 현상(약 10~30%)이 발견됐으나 캐시·앱 결함이 아니라 `confirmDelete`가 Server Action 완료 전에 반환하는 e2e 헬퍼 레이스였다(삭제 모달이 열린 동안 뒤쪽 표가 `aria-hidden`이라 row 단언이 먼저 통과). 모달이 닫힐 때까지 기다리도록 `e2e/fixtures/admin.ts`를 수정했고 수정 전 임시 스펙으로 dev 40회·프로덕션 30회 반복에서 stale 0건을 확인했다. 수행 대상 제외: 비관리자 계정 시나리오(관리자 1명만 두는 방침, `requireAdmin()`의 `notFound()` 코드와 `isAdmin` 단위 테스트로 보장), Server Action 직접 호출 검증(`savePost`·`deletePost` 첫 줄의 `requireAdmin()` 호출은 코드로 확인). Playwright MCP 수동 재확인은 하지 않고 e2e로 대체

### Phase 4: 마크다운 렌더링 및 편집기 고도화

> Task 015는 DB와 무관하므로 Phase 2 이후 언제든 병렬로 진행할 수 있다.

- **Task 015: 마크다운 렌더링 파이프라인 구축** - 우선순위
  - 관련 기능: F007, F006
  - 관련 파일: `components/markdown/markdown-content.tsx`, `lib/markdown/sanitize-schema.ts`, `lib/markdown/plugins.ts`, `lib/markdown/*.test.ts(x)`, `app/globals.css`, `app/(site)/blog/[slug]/page.tsx`
  - 수락 기준: 상세 본문이 GFM(표·체크리스트·취소선), LaTeX(인라인·블록), 코드 하이라이트(라이트/다크 색), raw HTML(`<style>`, `figure/figcaption`, `details/summary`)을 렌더링하고, 위험 요소가 제거됨. 같은 컴포넌트가 서버(상세)와 클라이언트(편집기 미리보기) 양쪽에서 동작. sanitize 동작이 단위 테스트로 고정됨
  - [ ] 설치: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-raw`, `rehype-sanitize`, `rehype-katex`, `katex`, `rehype-highlight`, `@tailwindcss/typography`(`highlight.js` 직접 설치·`rehype-slug` 미사용)
  - [ ] 플러그인 순서 고정: remark-gfm/remark-math → rehype-raw → rehype-sanitize(확장 스키마) → rehype-katex → rehype-highlight. KaTeX `trust` 비활성, `throwOnError: false`
  - [ ] `sanitize-schema.ts`: 기본 스키마 확장 — `style` 태그, `figure/figcaption`, `post-` 접두 class(+ `math-inline`/`math-display`/`language-*`), `img`의 `loading/width/height` 허용. `script`·`on*`·`javascript:` 제거, id는 `user-content-` 접두 유지
  - [ ] `MarkdownContent`: `.post-content prose dark:prose-invert` 래퍼, 본문 `img`는 `loading="lazy"`, 외부 링크 `rel="noreferrer"`. `<style>` 영향 범위(페이지 전체)를 컴포넌트 주석과 작성 안내에 명시
  - [ ] `katex/dist/katex.min.css` 로드, 코드 토큰 색을 `app/globals.css`의 CSS 변수(`--hljs-*`)로 라이트/다크 정의
  - [ ] 상세 페이지 임시 텍스트 본문을 `MarkdownContent`로 교체
  - 테스트 체크리스트:
    - 정상: `markdown-content.test.tsx` → 표 마크다운 → `<table>` 렌더링, `$a^2$` → `.katex` 요소, ` ```ts ` → `hljs` 클래스 토큰
    - 정상: `markdown-content.test.tsx` → `<style>.post-box{color:red}</style><div class="post-box">x</div>` → `style` 요소 유지, div에 `post-box` class 유지(규칙 매칭 가능)
    - 오류: `markdown-content.test.tsx` → `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `[a](javascript:alert(1))` → script 제거, `onerror` 제거, href 제거
    - 오류: `markdown-content.test.tsx` → `class="evil post-ok"` → `post-ok`만 남음, `id="intro"` → `id="user-content-intro"`
    - 엣지: `markdown-content.test.tsx` → 미완성 수식 `$\frac{1}{` / 미지원 언어 ` ```foobar ` → 예외 없이 렌더링
    - 엣지: Playwright MCP → 수식·코드·표·이미지가 포함된 발행 글 상세 → 라이트/다크 모두 가독성 확인, 이미지 `loading="lazy"`
  - 테스트 결과: (미수행)

- **Task 016: 편집기 실시간 미리보기 및 스타일 격리 구현**
  - 관련 기능: F007, F008
  - 관련 파일: `app/admin/posts/edit/_components/{post-editor,markdown-preview}.tsx`, `components/markdown/markdown-content.tsx`
  - 수락 기준: 본문 입력이 미리보기에 실시간 반영되고(입력 지연 체감 없음), 본문의 `<style>`이 편집기 UI(헤더·입력란·버튼)에 영향을 주지 않음. 미리보기 렌더링은 상세 페이지와 동일 결과
  - [ ] 격리 방식 결정 및 구현: Shadow DOM(권장, `MarkdownContent`를 portal로 shadow root에 렌더링 + KaTeX·typography·hljs CSS 주입) 또는 `iframe srcdoc`. 선택 근거를 이 항목에 기록
  - [ ] `useDeferredValue`로 입력과 렌더링 분리, 미완성 마크다운에서도 예외 없이 표시
  - [ ] 데스크톱 좌우 분할 스크롤, 모바일 탭 전환 시 입력값 유지
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 편집기 본문에 `# 제목` 입력 → 미리보기에 `h1` 즉시 표시
    - 정상: Playwright MCP → 본문에 수식·코드 블록 입력 → 미리보기에 KaTeX·하이라이트 표시
    - 오류: Playwright MCP → 본문에 `<style>button{display:none} body{background:red}</style>` 입력 → 편집기의 저장 버튼 표시 유지, 편집기 배경 변화 없음
    - 엣지: Playwright MCP → `$$` 하나만 입력한 상태 → 미리보기 오류 화면 없음
    - 엣지: Playwright MCP → 375px에서 작성 탭 입력 → 미리보기 탭 → 작성 탭 복귀 시 입력 유지
  - 테스트 결과: (미수행)

- **Task 017: 이미지 업로드 및 썸네일 지정 구현**
  - 관련 기능: F009, F008
  - 관련 파일: `lib/storage/upload-image.ts`, `lib/storage/validate-image.ts`, `lib/editor/insert-at-cursor.ts`, `app/admin/posts/edit/_components/{image-upload-button,thumbnail-field}.tsx`, `next.config.ts`
  - 수락 기준: 파일 선택·붙여넣기·드래그앤드롭으로 이미지를 올리면 `blog-images/YYYY/MM/<uuid>.<ext>`에 저장되고 커서 위치에 `![파일명](공개 URL)`이 삽입됨. 썸네일 업로드·제거가 가능하고 저장 시 서버 검증 통과. jpeg/png/webp/gif 외 형식과 5MB 초과는 업로드 전에 거부
  - [ ] `validate-image.ts`(MIME·확장자·크기) + 단위 테스트, 업로드 경로 생성(`crypto.randomUUID`)
  - [ ] 업로드는 브라우저 Supabase 클라이언트로 스토리지에 직접 전송(Server Action 본문 크기 제한 회피, 스토리지 RLS가 관리자만 허용)
  - [ ] `insert-at-cursor.ts`: textarea 선택 영역 기준 삽입 순수 함수 + 단위 테스트, 업로드 중 자리표시(`![업로드 중…]()`) 후 URL로 치환
  - [ ] `paste`/`drop` 이벤트 처리(여러 파일 순차 업로드), 실패 시 자리표시 제거 및 오류 표시
  - [ ] 썸네일 필드: 업로드·미리보기·제거, 값은 공개 URL(Task 013 스키마로 검증). 공개 페이지 썸네일을 `next/image`로 쓰면 `next.config.ts`의 `images.remotePatterns`에 Supabase 호스트 추가
  - [ ] 고아 파일 정리는 MVP 범위 밖임을 주석으로 명시
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 편집기 이미지 버튼으로 PNG 선택 → 커서 위치에 `![이름](https://…/blog-images/2026/10/<uuid>.png)` 삽입, 미리보기에 이미지 표시
    - 정상: Playwright MCP → 썸네일 업로드 후 발행 저장 → `/blog` 카드에 썸네일 표시
    - 오류: Playwright MCP → SVG 또는 PDF 파일 선택 → "jpeg/png/webp/gif만 가능" 오류, 업로드 요청 없음
    - 오류: Playwright MCP → 6MB 이미지 선택 → 크기 초과 오류, 본문 변화 없음
    - 엣지: Playwright MCP(수동 확인 가능) → 클립보드 이미지 붙여넣기·파일 드래그앤드롭 → 각각 삽입
    - 엣지: `insert-at-cursor.test.ts` → 선택 영역이 있을 때 → 선택 텍스트를 대체, 커서가 삽입 끝으로 이동
  - 테스트 결과: (미수행)

### Phase 5: SEO·최적화·마무리

- **Task 018: 블로그 SEO 메타데이터·sitemap·robots 구축**
  - 관련 기능: F014, F006
  - 관련 파일: `app/(site)/blog/[slug]/page.tsx`(`generateMetadata`), `app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx`, `lib/site-url.ts`, `.env.example`, `.github/workflows/ci.yml`
  - 수락 기준: 글 상세에 title·description(=소개글)·OG 이미지(=썸네일, 없으면 기본 `opengraph-image.png`)가 설정되고, `/sitemap.xml`에 고정 페이지 10개 + 발행 글(`lastModified = updated_at`)이, `/robots.txt`에 `/admin`·`/auth` 제외가 포함됨. 절대 URL은 모두 `NEXT_PUBLIC_SITE_URL` 기준. 없는 글·초안은 noindex
  - [ ] `NEXT_PUBLIC_SITE_URL` 도입: `lib/site-url.ts`, `.env.example` 키 추가, CI `build` env에 자리표시자, `app/layout.tsx`의 `metadataBase` 교체(`VERCEL_URL` 의존 제거)
  - [ ] `generateMetadata`: `getPostBySlug` 재사용(같은 요청 내 중복 조회 방지를 위해 `React.cache` 또는 캐시 함수 사용), 없으면 `robots: { index: false }`
  - [ ] `app/sitemap.ts`: `lib/site-config.ts` 메뉴 + 발행 글(슬러그 인코딩)
  - [ ] `app/robots.ts`: `disallow: ['/admin', '/auth']`, sitemap 절대 URL
  - [ ] 트레이드오프 기록: 없는 글은 스트리밍 이후 `notFound()`라 HTTP 200 + noindex(soft 404) 수용
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 발행 글 상세 → `<title>`에 글 제목, `meta[name=description]`=소개글, `meta[property="og:image"]`=썸네일 절대 URL
    - 정상: Playwright MCP → `/sitemap.xml` → 고정 페이지와 발행 글 URL, 초안 URL 없음
    - 정상: Playwright MCP → `/robots.txt` → `Disallow: /admin`, `Disallow: /auth`, `Sitemap:` 절대 URL
    - 오류: Playwright MCP → `/blog/없는-글` → `meta[name=robots]`에 `noindex`
    - 엣지: Playwright MCP → 썸네일 없는 글 → 기본 OG 이미지
    - 엣지: Playwright MCP → 한글 슬러그 글 → sitemap의 `loc`이 퍼센트 인코딩된 유효 URL
  - 테스트 결과: (미수행)

- **Task 019: 캐싱·성능·접근성 최적화**
  - 관련 기능: F005, F006, F011, F013
  - 관련 파일: `lib/queries/posts.ts`, `lib/supabase/public.ts`, `app/admin/posts/actions.ts`, `app/(site)/**`, `next.config.ts`
  - 수락 기준: 공개 글 조회가 Cache Components(`'use cache'` + `cacheTag`)로 캐시되고, 저장·삭제 시 태그 무효화로 공개 목록·상세에 즉시 반영(F011). 주요 공개 페이지 Lighthouse(모바일) 성능·접근성 90점 이상, 키보드만으로 헤더·필터·편집기 조작 가능
  - [ ] `node_modules/next/dist/docs/`에서 `use cache`, `cacheTag`, `updateTag`/`revalidateTag` 문서 확인 후 전략 확정(쿠키를 읽는 서버 클라이언트는 캐시 함수 안에서 쓸 수 없으므로, 공개 조회용 쿠키 없는 Supabase 클라이언트 `lib/supabase/public.ts` 도입)
  - [ ] 태그 설계: `posts`(목록), `post:<slug>`(상세). Server Action에서 저장·삭제 시 무효화, 슬러그 변경 시 이전·새 슬러그 모두 무효화
  - [ ] 썸네일 `next/image`(크기 지정·`sizes`), 폰트 `display: swap`, 불필요한 Client Component 경계 축소, `npm run analyze`로 KaTeX·highlight 번들이 공개 상세 클라이언트 번들에 포함되지 않는지 확인
  - [ ] 접근성: 랜드마크·`aria-current`·포커스 링·대비(라이트/다크), 폼 라벨·오류 `aria-describedby`
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 관리자가 글 제목 수정 저장 → 비로그인 탭에서 `/blog`·상세 새로고침 → 즉시 새 제목
    - 정상: Playwright MCP → 글 삭제 → `/blog` 새로고침 → 즉시 미노출, 상세 not-found
    - 오류: Playwright MCP → 발행 글을 초안으로 전환 → 공개 상세 즉시 not-found(캐시 잔존 없음)
    - 엣지: Playwright MCP → 슬러그 변경 → 이전 슬러그 not-found, 새 슬러그 정상
    - 엣지: Playwright MCP → Tab 키로 헤더 메뉴·테마 전환·블로그 필터 순회 → 포커스 표시, Enter로 동작
  - 테스트 결과: (미수행)

- **Task 020: 최종 회귀 테스트 및 배포 준비**
  - 관련 기능: F001~F014
  - 관련 파일: `e2e/**`, `README.md`, `docs/guides/project-structure.md`, `.env.example`, `data/*.ts`
  - 수락 기준: `npm run check`·`npm run build`·`npm run knip`·`npm run test:e2e` 전체 통과, 배포 환경(예: Vercel)에서 공개·관리자 흐름 확인, 문서가 실제 구조와 일치
  - [ ] 전체 E2E 회귀(방문자·관리자·마크다운·이미지·SEO) 실행 및 결함 수정
  - [ ] 배포 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`) 설정, Supabase Auth의 Site URL·Redirect URL을 운영 도메인으로 설정
  - [ ] README 최종 점검: hkoikoi.dev 기준 기본판은 작성되어 있으므로(설치·환경 변수·관리자 계정 설정 절차), 배포 절차와 `<style>` 작성 규칙(`post-` class, `#user-content-{id}`)을 채우고 실제 구현 상태와 맞는지 확인
  - [ ] `docs/guides/project-structure.md`의 구조·정리 대상 목록을 실제 상태로 갱신
  - [ ] `data/*.ts`의 `// TODO` 샘플을 실제 이력으로 교체하도록 사용자에게 안내(실제 내용은 사용자 제공)
  - 테스트 체크리스트:
    - 정상: 터미널 → `npm run check && npm run build && npm run knip` → 모두 통과
    - 정상: Playwright MCP → 배포 URL에서 방문자 여정 → 모든 페이지 정상, 콘솔 오류 0건(`browser_console_messages`)
    - 정상: Playwright MCP → 배포 URL에서 관리자 로그인 → 글 작성·이미지 업로드·발행 → 공개 확인 → 삭제
    - 오류: Playwright MCP → 배포 URL `/admin/posts` 비로그인 접근 → `/auth/login`
    - 엣지: Playwright MCP → 배포 URL `/robots.txt`·`/sitemap.xml` → 운영 도메인 절대 URL
  - 테스트 결과: (미수행)

## 기능 ID 매핑

| 기능 ID | 기능명                | 담당 Task               |
| ------- | --------------------- | ----------------------- |
| F001    | 프로필·연락처 표시    | 004, 005, 007           |
| F002    | 이력 섹션 목록        | 003, 005, 006, 007      |
| F003    | 프로젝트 목록         | 003, 005, 006, 007      |
| F004    | 논문 목록             | 003, 005, 006, 007      |
| F005    | 블로그 글 목록·필터   | 006, 008, 012, 014, 019 |
| F006    | 블로그 글 상세        | 008, 012, 015, 018      |
| F007    | 마크다운 렌더링       | 015, 016                |
| F008    | 글 작성·수정          | 009, 013, 016, 017      |
| F009    | 이미지 업로드·썸네일  | 010, 017                |
| F010    | 발행 상태 관리        | 009, 010, 012, 013      |
| F011    | 글 삭제               | 009, 013, 019           |
| F012    | 관리자 인증·권한      | 002, 003, 010, 011, 013 |
| F013    | 공통 내비게이션·테마  | 002, 004, 011           |
| F014    | 블로그 SEO 메타데이터 | 018                     |

## 의존성과 병렬 진행

- 순서 의존: 002 → 003 → 004 / 005 → 006 → 007·008·009 → 010 → 011 → 012·013 → 014 → 017 → 018 → 019 → 020
- 병렬 가능: Task 007·008·009(UI)는 서로 독립. Task 010(DB)·Task 015(마크다운)는 Phase 2와 병렬 진행 가능. Task 016은 015 이후, Task 017은 010·013 이후.
- UI와 백엔드 분리: Phase 2의 더미 데이터(`lib/dummy/posts.ts`)와 `lib/types/post.ts`가 계약 역할을 하며, Task 012에서 `lib/queries/posts.ts`로 교체한다.

## 열린 질문과 기본 결정

PRD의 열린 질문은 아래 기본값으로 진행하고, 사용자 결정이 바뀌면 해당 Task를 갱신한다.

| 질문                                        | 기본 결정                                                   | 관련 Task |
| ------------------------------------------- | ----------------------------------------------------------- | --------- |
| 대표 프로젝트 3개 선정 기준                 | `Project.featured` 우선, 부족하면 배열 앞에서 채움          | 005, 007  |
| 블로그 기본 카테고리명 "일반" 유지 여부     | "일반" 유지(DB default·스키마 기본값 한 곳에서 상수로 관리) | 010, 013  |
| 관리자 보조 진입 경로(푸터 등) 필요 여부    | MVP는 헤더 "관리" 링크와 `/auth/login` 직접 진입만 제공     | 004, 011  |
| 비밀번호 재설정 흐름 유지 여부(로드맵 추가) | 제거, 재설정은 Supabase 대시보드에서 수행                   | 002       |
| 편집기 미리보기 격리 방식(로드맵 추가)      | Shadow DOM 우선 검토, 제약 시 `iframe srcdoc`               | 016       |

## 알려진 트레이드오프 (PRD 반영)

- `<style>` 허용으로 글 CSS가 해당 페이지 전체에 영향 가능(작성자 1인이라 수용, 스코프 변환은 MVP 밖). 편집기 미리보기만 격리(Task 016).
- 스타일 변조(`position:fixed` 오버레이, `url()` 외부 요청) 가능성은 관리자 계정 보호(강한 비밀번호·MFA)로 완화(Task 011).
- 없는 글은 soft 404(HTTP 200 + noindex)로 응답(Task 018).
- 관리자 role 회수 후에도 기존 JWT는 만료 전까지 유효(RLS 동일). 역할 변경 후 재로그인 필요(Task 011).
- 스토리지 고아 파일은 정리하지 않음(Task 017).
- Supabase advisor 보안 경고 `auth_leaked_password_protection`(유출 비밀번호 보호)은 Pro 플랜 전용이라 예외로 수용. 완화책: 회원가입 차단, 최소 비밀번호 12자, 대소문자·숫자·기호 필수(Task 010, 011).

## MVP 이후 (범위 밖)

댓글, RSS, 검색, 페이지네이션, 조회수, 스토리지 고아 이미지 정리, 임시저장 자동화, `<style>` 글 단위 스코프 변환, 정적 섹션의 DB 저장·관리자 편집.
