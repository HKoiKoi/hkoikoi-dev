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
- 상태: **MVP(F001~F014, Task 001~020) 완료 — 2026-11-05.** 근거는 Task 020의 운영 배포 검증(`https://www.hkoikoi.dev`)과 각 Task의 `테스트 결과`다. 완료 처리 때 확인하지 못한 항목은 완료로 바꾸지 않고 Task 021(MVP 잔여 검증)로 넘겼다. 다음 작업은 Phase 6(MVP 이후 범위)이다. 2026-11-07에 운영을 Vercel에서 Mac mini 홈 서버로 이전하고 `main` push 자동 배포를 구성했다(Phase 7, Task 035~044). 정식 호스트는 `hkoikoi.dev`(apex)다.

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
- 관리자 E2E에는 테스트용 관리자 계정이 필요하다. 자격 증명은 `.env.local`의 `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`(접두 `NEXT_PUBLIC_` 금지)로 두고, 키 이름만 `.env.example`에 추가한다. CI에서는 시크릿 없는 `e2e/access-control.spec.ts`만 `e2e-smoke` job으로 실행하고, 관리자 자격 증명이 필요한 나머지 E2E는 로컬에서만 돌린다(2026-10-28 결정: placeholder Supabase 값으로 7개+로그인 실패 1개가 통과, 실제 Supabase 시크릿·관리자 계정을 CI에 두지 않으며 DB 쓰기·업로드가 없어 blog-images 고아 파일이 생기지 않음. 한계: 로그인 실패 시나리오는 placeholder URL에서도 같은 오류 문구가 떠서 실제 인증 거부는 검증하지 않음).

### 라우트 맵 (Task 003에서 확정)

PRD는 블로그 상세 주소(`/blog/{slug}`)만 정한다. 나머지 경로는 아래 안으로 진행하고, 바꾸면 이 표와 헤더 메뉴 설정(`lib/site-config.ts`)을 함께 고친다.

| 페이지             | 경로                                                       | 파일 (예정)                                                                        | 인증        | 기능 ID                |
| ------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------- | ---------------------- |
| 메인               | `/`                                                        | `app/(site)/page.tsx`                                                              | 불필요      | F001, F003, F005, F013 |
| 학력               | `/education`                                               | `app/(site)/education/page.tsx`                                                    | 불필요      | F002                   |
| 경력               | `/career`                                                  | `app/(site)/career/page.tsx`                                                       | 불필요      | F002                   |
| 자격증             | `/certifications`                                          | `app/(site)/certifications/page.tsx`                                               | 불필요      | F002                   |
| 사회봉사           | `/volunteer`                                               | `app/(site)/volunteer/page.tsx`                                                    | 불필요      | F002                   |
| 어학               | `/languages`                                               | `app/(site)/languages/page.tsx`                                                    | 불필요      | F002                   |
| 사회활동           | `/activities`                                              | `app/(site)/activities/page.tsx`                                                   | 불필요      | F002                   |
| 프로젝트           | `/projects`                                                | `app/(site)/projects/page.tsx`                                                     | 불필요      | F003                   |
| 논문               | `/publications`                                            | `app/(site)/publications/page.tsx`                                                 | 불필요      | F004                   |
| 블로그 목록        | `/blog?category=&tag=`                                     | `app/(site)/blog/page.tsx`                                                         | 불필요      | F005                   |
| 블로그 상세        | `/blog/{slug}` (한글 슬러그 허용)                          | `app/(site)/blog/[slug]/page.tsx`                                                  | 불필요      | F006, F007, F014       |
| 로그인             | `/auth/login`                                              | `app/auth/login/page.tsx` (스타터 재사용)                                          | 불필요      | F012                   |
| 관리자 글 목록     | `/admin/posts`                                             | `app/admin/posts/page.tsx`                                                         | 관리자 역할 | F010, F011, F012       |
| 새 글 작성         | `/admin/posts/new`                                         | `app/admin/posts/new/page.tsx`                                                     | 관리자 역할 | F007~F010, F012        |
| 글 수정            | `/admin/posts/[id]/edit`                                   | `app/admin/posts/[id]/edit/page.tsx`                                               | 관리자 역할 | F007~F010, F012        |
| 이력 관리          | `/admin/resume/[section]`                                  | `app/admin/resume/[section]/page.tsx`                                              | 관리자 역할 | F025(제안), F012       |
| 이력 새 항목       | `/admin/resume/[section]/new`                              | `app/admin/resume/[section]/new/page.tsx`                                          | 관리자 역할 | F025(제안), F012       |
| 이력 수정          | `/admin/resume/[section]/[id]/edit`                        | `app/admin/resume/[section]/[id]/edit/page.tsx`                                    | 관리자 역할 | F025(제안), F012       |
| 프로젝트 관리      | `/admin/projects`                                          | `app/admin/projects/page.tsx`                                                      | 관리자 역할 | F025(제안), F012       |
| 프로젝트 작성·수정 | `/admin/projects/new`, `/admin/projects/[id]/edit`         | `app/admin/projects/new/page.tsx`, `app/admin/projects/[id]/edit/page.tsx`         | 관리자 역할 | F025(제안), F012       |
| 논문 관리          | `/admin/publications`                                      | `app/admin/publications/page.tsx`                                                  | 관리자 역할 | F025(제안), F012       |
| 논문 작성·수정     | `/admin/publications/new`, `/admin/publications/[id]/edit` | `app/admin/publications/new/page.tsx`, `app/admin/publications/[id]/edit/page.tsx` | 관리자 역할 | F025(제안), F012       |

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
  - [x] `hasEnvVars` 검사 제거 여부 결정: 홈·`app/protected/layout.tsx` 참조는 제거하고, `lib/supabase/proxy.ts`의 검사는 env 미설정 시 공개 페이지 500을 막는 안전장치라 유지(Task 011에서 재검토해 유지로 결정, 근거는 `lib/supabase/proxy.ts` 주석)
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
  - [x] "관리" 링크 슬롯(`AdminLink`, 이후 푸터에 배치)을 `<Suspense>`로 감싸 자리만 마련(실제 역할 판별은 Task 011). 스타터 `auth-button.tsx`는 Task 011에서 대체·삭제
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
  - 테스트 결과: 2026-10-26 `npm run check` 통과(`lib/format-date.test.ts`의 정상·UTC 자정 직전 케이스 포함). shadcn 4종은 CLI로 추가했고 CLI가 잘못 생성한 `cn` import는 `@/lib/utils`로 수정. Playwright MCP 수동 확인(다크·375px)은 미수행 → Task 007에서 수행

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
  - 테스트 결과(009-a 범위: 로그인·관리자 레이아웃·글 목록, 편집기·slugify는 미수행): 2026-10-26 `npm run check` 통과. proxy 보호를 로컬에서만 임시 우회(원복·미커밋)하고 Playwright로 `/admin/posts` 확인: 라이트·다크 1280px에서 7행, 초안 2건/발행 5건 배지 구분, 삭제 클릭 시 Dialog 열림, Dialog 내 삭제 확정 시 닫힘, 375px에서 표 컨테이너만 가로 스크롤(scrollWidth 603 > clientWidth 341, 문서 폭 375 유지). `/auth/login`은 한국어 문구, 링크(가입·재설정) 0개. 로그인 오류 영역은 `role="alert"`로 유지(실제 오류 발생은 Supabase 연동 범위라 당시 미확인 → Task 011 e2e(잘못된 비밀번호)로 확인됨)

### Phase 3: 핵심 기능 구현 (DB·인증·블로그) ✅

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
  - 테스트 결과: 2026-10-26 마이그레이션 2건 원격 적용(version `20261026105752` create_posts, `20261026105803` create_blog_images_bucket, 로컬 파일명과 일치). 롤백 트랜잭션으로 체크리스트의 정상·오류·엣지 SQL 케이스 11건을 실행해 모두 기대 결과를 확인했고 잔존 행 0. `generate_typescript_types`로 `lib/supabase/database.types.ts` 생성, 브라우저·서버·proxy 클라이언트에 `Database` 제네릭 적용, `lib/types/post.ts`를 `Tables<'posts'>`에서 파생(`PostSummary`/`Post`/`PostInput` 이름·필드 형태 유지, 더미 데이터 수정 없이 typecheck 통과). `npm run check` 통과(Vitest 25개), `npm run knip`은 `knip.jsonc` ignore에 `database.types.ts` 추가 후 통과. advisor 보안 경고 1건(`auth_leaked_password_protection`)은 Pro 플랜 미사용이라 예외 수용(대신 회원가입 차단, 최소 비밀번호 12자, 대소문자·숫자·기호 필수 적용)이라 수락 기준 "경고 0건"은 이 1건을 예외로 둔 상태에서 충족(경고 자체는 남아 있음). 성능 advisor INFO `unused_index` 3건은 빈 테이블이라 정상. 관리자 계정은 `app_metadata.role = 'admin'` 부여 완료. 실제 관리자 JWT 기반 posts CRUD는 Task 013 e2e로 검증됨. 미확인(Task 017 이월, 2026-10-28 Task 017에서 확인 완료): 비관리자 세션의 `blog-images` 업로드 거부, SVG 업로드 MIME 거부, 5MB 제한

- **Task 011: 관리자 인증·권한 시스템 구축** ✅
  - 관련 기능: F012, F013("관리" 링크)
  - 관련 파일: `lib/auth/require-admin.ts`, `lib/auth/is-admin.ts`, `app/auth/login/actions.ts`, `components/login-form.tsx`, `components/logout-button.tsx`, `components/auth-button.tsx`(삭제), `components/layout/admin-link.tsx`, `app/admin/**`, `lib/supabase/proxy.ts`
  - 수락 기준: 관리자 계정은 로그인 후 `/admin/posts`로 이동하고, 비로그인 사용자의 `/admin/**` 접근은 `/auth/login`으로, 로그인한 비관리자의 접근은 not-found로 처리됨. 로그아웃 시 `/`로 이동. 관리자 로그인 상태에서만 공개 푸터의 "관리" 링크 슬롯에 링크 표시. 회원가입은 UI와 Supabase 설정 모두에서 차단됨
  - [x] `isAdmin(claims)` 순수 함수(`app_metadata.role === 'admin'`) + 단위 테스트, `requireAdmin()`(서버 전용: `getClaims()` → 없으면 `redirect('/auth/login')`, 비관리자면 `notFound()`)
  - [x] 관리자 페이지와 모든 Server Action 시작부에서 `requireAdmin()` 호출(레이아웃 검사에만 의존하지 않음) — 레이아웃(`AdminGuard`)과 `posts`·`edit` 페이지는 적용 완료. `savePost`·`deletePost`의 시작부 `requireAdmin()` 적용은 Task 013에서 완료
  - [x] 로그인 폼을 Server Action + `useActionState` 패턴으로 전환(`forms-react-hook-form.md`), 실패 시 한국어 오류 유지, 성공 시 `/admin/posts` — e2e로 로그인 성공·실패 확인
  - [x] 로그아웃 버튼을 관리자 레이아웃에 배치, 완료 후 `/`로 이동. 스타터 `auth-button.tsx` 삭제 — e2e로 로그아웃 후 `/` 이동 확인
  - [x] 공개 푸터 `AdminLink`: `<Suspense>` 안에서 claims를 읽어 관리자일 때만 "관리" 링크 렌더링 — 푸터 슬롯에 구현, e2e로 관리자 로그인 시 노출·로그아웃 후 사라짐 확인
  - [x] 수동 설정(2026-10-26 완료): Supabase 대시보드에서 관리자 계정 생성, `app_metadata.role = 'admin'` 부여(SQL), "Allow new users to sign up" 해제(2026-10-27 대시보드에서 해제 상태 재확인), 최소 비밀번호 12자·대소문자·숫자·기호 필수 적용. 남은 항목: 부여 후 재로그인, MFA(선택)
  - [x] `e2e/admin-auth.spec.ts`(`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` 사용, 미설정 시 `test.skip`)
  - 테스트 체크리스트:
    - 정상: Playwright MCP → `/auth/login`에서 관리자 이메일·비밀번호 입력 후 로그인 → `/admin/posts` 이동
    - 정상: Playwright MCP → 관리자 로그인 상태에서 `/` → 푸터 "관리" 링크 표시 → 클릭 시 `/admin/posts`
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
  - 관련 파일: `lib/schemas/post.ts`, `app/admin/posts/actions.ts`, `app/admin/posts/page.tsx`, `app/admin/posts/new/page.tsx`, `app/admin/posts/[id]/edit/page.tsx`, `app/admin/posts/_components/post-editor.tsx`, `lib/queries/admin-posts.ts`
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
  - 후속 개선(2026-10-28, 편집기 UX): 사용자 피드백 3건 반영.
    - [x] 편집기 라우트 분리: `/admin/posts/edit(?id=)` → 새 글 `/admin/posts/new`, 수정 `/admin/posts/[id]/edit`. 공용 `post-editor.tsx`는 `app/admin/posts/_components/`로 이동하고 수정 페이지는 `key={id}`로 렌더링(같은 페이지를 재사용하며 이전 입력 상태가 남아 수정 화면이 비던 문제의 유력 원인 제거). 목록·헤더 링크와 e2e 경로 갱신
    - [x] 하단 고정 바: 왼쪽 `←` 나가기(`/admin/posts`), 오른쪽 "임시 저장"과 "발행하기"(수정 모드는 "수정하기"). 발행 체크박스는 제거하고 발행 버튼이 `published=on`을 보내 상태를 결정(임시 저장은 값 없음 → 초안)
    - [x] 임시 저장은 목록으로 이동하지 않고 편집 화면에 머문다. 수정 모드는 `{ ok: true, message }`를 반환해 바에 "임시 저장했습니다."를 표시하고, 새 글은 insert한 id의 `/admin/posts/{id}/edit`으로 redirect(이후 저장이 중복 생성이 되지 않게 함). 발행 저장은 기존처럼 `/admin/posts`로 redirect
    - 테스트 결과: 2026-10-28 `npm run check`(Vitest 123개)·`npm run knip` 통과. `npx playwright test e2e/admin-posts.spec.ts e2e/admin-flow.spec.ts` 10개 통과(skip 0): 새 글 임시 저장→수정 화면 이동·재저장해도 1건·초안 배지 / 수정 화면 임시 저장→URL·입력값 유지·초안 전환·공개 상세 not-found / 수정 화면에 기존 제목 표시. e2e 헬퍼 `createPost`는 임시 저장 시 수정 화면 도착을 확인한 뒤 목록으로 이동하도록 변경, `savePost` 단위 테스트(임시 저장 redirect·ok 반환) 갱신. 하단 바는 Playwright 스크린샷으로 1280px·390px, 라이트·다크에서 스크롤 끝까지 바가 하단에 고정되고 내용이 가려지지 않음을 확인했다.
    - 제한 사항: Playwright MCP 브라우저가 아니라 e2e 스펙과 임시 스펙(삭제함)으로 확인했다(관리자 자격 증명을 에이전트가 읽지 못함). 발행된 글을 수정 화면에서 "임시 저장"하면 초안으로 되돌아가 공개에서 내려가는 동작은 의도 확인이 필요하다. 개발 서버의 Next 인디케이터가 모바일에서 "나가기"를 일부 가리지만 프로덕션에는 없다.

- **Task 014: 핵심 기능 통합 테스트** ✅
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
  - 테스트 결과: 2026-10-27 `npm run check`(Vitest 76개)·`npm run knip` 통과. `npm run test:e2e`는 관리자 자격 증명 설정 상태에서 42개 모두 통과(skip 0)를 3회 연속 확인했고, 자격 증명을 비운 상태에서는 28개 통과·14개 skip(관리자 스펙만)·실패 0. 통과한 시나리오: 방문자 여정(정적 구간, 태그 필터·상세·뒤로 가기 필터 유지, 카테고리·로고), 관리자 여정(초안→발행→삭제→로그아웃, 단계별 배지·공개 노출), 비로그인의 `/admin/posts`·`/admin/posts/edit` 리다이렉트, 임의 계정 로그인 실패 3회 반복 시 매번 오류 표시. 종료 후 DB에 `e2e-` 접두 글 0건. 삭제 직후 `/blog`에 글이 간헐적으로 남는 현상(약 10~30%)이 발견됐으나 캐시·앱 결함이 아니라 `confirmDelete`가 Server Action 완료 전에 반환하는 e2e 헬퍼 레이스였다(삭제 모달이 열린 동안 뒤쪽 표가 `aria-hidden`이라 row 단언이 먼저 통과). 모달이 닫힐 때까지 기다리도록 `e2e/fixtures/admin.ts`를 수정했고 수정 전 임시 스펙으로 dev 40회·프로덕션 30회 반복에서 stale 0건을 확인했다. 수행 대상 제외: 비관리자 계정 시나리오(관리자 1명만 두는 방침, `requireAdmin()`의 `notFound()` 코드와 `isAdmin` 단위 테스트로 보장), Server Action 직접 호출 검증(`savePost`·`deletePost` 첫 줄의 `requireAdmin()` 호출은 코드로 확인). Playwright MCP 수동 재확인은 하지 않고 e2e로 대체. 2026-10-28 리뷰 후속 재검증: `npm run check`(Vitest 13 파일 / 81개)·`npm run knip`·`npm run build` 통과(빌드에서 공개 페이지는 Partial Prerender ◐ 유지), 관리자 자격 증명 설정 상태에서 `npm run test:e2e` 45개 모두 통과(실패 0). Supabase advisor는 security `auth_leaked_password_protection` 1건(기존 예외)뿐이고 performance는 INFO `unused_index`(`posts_tags_idx`, `posts` 0행이라 정상)만 남았다. 원격 마이그레이션 3건의 version이 로컬 파일명과 일치하고 `posts_category_length_check`는 validated 상태다. 같은 날 후속 처리(인코딩 경로 e2e 단언 고정, `savePost`·`deletePost` 단위 테스트 추가) 뒤 재검증: `npm run check`(Vitest 14 파일 / 97개)·`npm run knip`·`npm run build` 통과, `npm run test:e2e` 47개 모두 통과(실패 0), advisor 결과는 위와 동일(새 경고 없음)

### Phase 4: 마크다운 렌더링 및 편집기 고도화 ✅

> Task 015는 DB와 무관하므로 Phase 2 이후 언제든 병렬로 진행할 수 있다.

- **Task 015: 마크다운 렌더링 파이프라인 구축** ✅ - 우선순위
  - 관련 기능: F007, F006
  - 관련 파일: `components/markdown/markdown-content.tsx`, `lib/markdown/sanitize-schema.ts`, `lib/markdown/plugins.ts`, `lib/markdown/*.test.ts(x)`, `app/globals.css`, `app/(site)/blog/[slug]/page.tsx`
  - 수락 기준: 상세 본문이 GFM(표·체크리스트·취소선), LaTeX(인라인·블록), 코드 하이라이트(라이트/다크 색), raw HTML(`<style>`, `figure/figcaption`, `details/summary`)을 렌더링하고, 위험 요소가 제거됨. 같은 컴포넌트가 서버(상세)와 클라이언트(편집기 미리보기) 양쪽에서 동작. sanitize 동작이 단위 테스트로 고정됨
  - [x] 설치: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-raw`, `rehype-sanitize`, `rehype-katex`, `katex`, `rehype-highlight`, `@tailwindcss/typography`(`highlight.js` 직접 설치·`rehype-slug` 미사용)
  - [x] 플러그인 순서 고정: remark-gfm/remark-math → rehype-raw → rehype-sanitize(확장 스키마) → rehype-sanitize-style → rehype-katex → rehype-highlight. KaTeX `trust` 비활성, `throwOnError: false`
  - [x] `sanitize-schema.ts`: 기본 스키마 확장 — `style` 태그, `figure/figcaption`, `post-` 접두 class(+ `math-inline`/`math-display`/`language-*`), `img`의 `loading/width/height` 허용. `script`·`on*`·`javascript:` 제거, id는 `user-content-` 접두 유지
  - [x] `MarkdownContent`: `.post-content prose dark:prose-invert` 래퍼, 본문 `img`는 `loading="lazy"`, 외부 링크 `rel="noreferrer"`. `<style>` 영향 범위(페이지 전체)를 컴포넌트 주석과 작성 안내에 명시
  - [x] `katex/dist/katex.min.css` 로드, 코드 토큰 색을 `app/globals.css`의 CSS 변수(`--hljs-*`)로 라이트/다크 정의
  - [x] 상세 페이지 임시 텍스트 본문을 `MarkdownContent`로 교체
  - 테스트 체크리스트:
    - 정상: `markdown-content.test.tsx` → 표 마크다운 → `<table>` 렌더링, `$a^2$` → `.katex` 요소, ` ```ts ` → `hljs` 클래스 토큰
    - 정상: `markdown-content.test.tsx` → `<style>.post-box{color:red}</style><div class="post-box">x</div>` → `style` 요소 유지, div에 `post-box` class 유지(규칙 매칭 가능)
    - 오류: `markdown-content.test.tsx` → `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `[a](javascript:alert(1))` → script 제거, `onerror` 제거, href 제거
    - 오류: `markdown-content.test.tsx` → `class="evil post-ok"` → `post-ok`만 남음, `id="intro"` → `id="user-content-intro"`
    - 엣지: `markdown-content.test.tsx` → 미완성 수식 `$\frac{1}{` / 미지원 언어 ` ```foobar ` → 예외 없이 렌더링
    - 엣지: Playwright MCP → 수식·코드·표·이미지가 포함된 발행 글 상세 → 라이트/다크 모두 가독성 확인, 이미지 `loading="lazy"`
  - 테스트 결과: 2026-10-28 `npm run check`(Vitest 16 파일 / 123개, `lib/markdown` 7개·`components/markdown` 19개 포함)·`npm run knip`(katex 오탐 없음)·`npm run build` 통과(공개 페이지 Partial Prerender ◐ 유지). 사전 검증(소스·임시 테스트로 확인, 임시 파일 삭제): class에 RegExp 허용·class 배열 토큰별 검사, 기본 `clobberPrefix` `user-content-`, vitest(jsdom)와 `renderToString`에서 ESM unified 계열 import 가능, 동기 `Markdown`은 훅 없음(훅은 `MarkdownHooks`뿐). 미지원 언어는 `rehype-highlight`가 경고만 남기고 건너뛰어 별도 옵션 불필요. Playwright MCP 확인: 관리자 자격 증명을 읽을 수 없어 Supabase MCP로 원격 프로젝트(`.mcp.json` 고정 ref와 일치 확인)에 `e2e-md-seed` 발행 글을 시드하고 dev 서버(`/blog/e2e-md-seed`)에서 확인한 뒤 SQL로 삭제해 `e2e-` 행 0건을 확인했다(제한 사항: 실제 관리자 UI 작성 경로가 아니라 SQL 시드 경로). 표·인라인/블록 수식·ts 코드 하이라이트·체크리스트·취소선·이미지·`<style>` `post-box`·details를 라이트/다크 모두 가독성 있게 렌더링, `img loading="lazy"`·외부 링크 `rel="noreferrer"`·체크박스 disabled 확인, 본문의 `<script>`는 DOM에 없음. 라이트에서 미체크 체크박스가 어둡게 보이는 점은 기본 `accent-color` 때문이며 이번 범위에서는 손대지 않았다. 모바일 폭은 확인하지 않았다

- **Task 016: 편집기 실시간 미리보기 및 스타일 격리 구현** ✅
  - 관련 기능: F007, F008
  - 관련 파일: `app/admin/posts/_components/{post-editor,markdown-preview}.tsx`, `components/markdown/markdown-content.tsx`
  - 수락 기준: 본문 입력이 미리보기에 실시간 반영되고(입력 지연 체감 없음), 본문의 `<style>`이 편집기 UI(헤더·입력란·버튼)에 영향을 주지 않음. 미리보기 렌더링은 상세 페이지와 동일 결과
  - [x] 격리 방식 결정 및 구현: Shadow DOM(권장, `MarkdownContent`를 portal로 shadow root에 렌더링 + KaTeX·typography·hljs CSS 주입) 또는 `iframe srcdoc`. 선택 근거를 이 항목에 기록
    - 선택 근거(Shadow DOM 채택): 같은 React 트리에서 portal로 렌더링하므로 `MarkdownContent`를 그대로 재사용해 상세 페이지와 결과가 같고, 입력 상태·테마(`next-themes`)를 props/context로 바로 전달할 수 있다. iframe `srcdoc`은 격리는 가장 강하지만 문서·스크립트가 분리돼 스타일시트 주입·높이 동기화·테마 전달·`postMessage` 같은 별도 연동이 필요하고, 입력마다 문서를 다시 쓰면 깜빡임·스크롤 초기화 위험이 있다. Shadow DOM의 대가로 문서 스타일시트를 복제해 주입해야 한다(`:root`→`:host` 치환, `.dark`는 shadow 안 래퍼에 직접 부여, 마운트 시 1회 복제라 HMR 변경은 새로고침 필요, cross-origin 시트는 건너뜀).
  - [x] `useDeferredValue`로 입력과 렌더링 분리, 미완성 마크다운에서도 예외 없이 표시
  - [x] 데스크톱 좌우 분할 스크롤, 모바일 탭 전환 시 입력값 유지
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 편집기 본문에 `# 제목` 입력 → 미리보기에 `h1` 즉시 표시
    - 정상: Playwright MCP → 본문에 수식·코드 블록 입력 → 미리보기에 KaTeX·하이라이트 표시
    - 오류: Playwright MCP → 본문에 `<style>button{display:none} body{background:red}</style>` 입력 → 편집기의 저장 버튼 표시 유지, 편집기 배경 변화 없음
    - 엣지: Playwright MCP → `$$` 하나만 입력한 상태 → 미리보기 오류 화면 없음
    - 엣지: Playwright MCP → 375px에서 작성 탭 입력 → 미리보기 탭 → 작성 탭 복귀 시 입력 유지
  - 테스트 결과: 2026-10-28 `npm run check`(typecheck·lint·prettier 통과, Vitest 17 파일 / 135개, `markdown-preview.test.tsx` 포함)·`npm run knip`(종료 코드 0)·`npm run build`(placeholder Supabase 환경변수, `/admin/posts/new`·`/admin/posts/[id]/edit` Partial Prerender ◐ 유지) 통과. `e2e/admin-preview.spec.ts` 5개 시나리오(h1·수식/코드·`<style>` 격리·`$` 단독·375px 탭 유지) 5/5 통과. 관리자 자격 증명이 없어 Supabase MCP로 원격 프로젝트(`.mcp.json` 고정 ref와 일치 확인)에 `app_metadata.role='admin'` 임시 사용자를 만들어 e2e와 Playwright MCP 확인에 쓰고, 끝난 뒤 삭제해 `e2e-` 사용자·글 0건을 확인했다(제한 사항: 실제 관리자 계정이 아니라 임시 계정 경로). Playwright MCP(dev 서버): 데스크톱 1280px 라이트/다크에서 h1·표·인라인/블록 수식·ts 하이라이트·체크리스트·본문 `<style>`(`.post-box` 적색)이 shadow 안에서만 적용되고 body 배경·버튼 `display`는 그대로, 다크에서는 shadow 래퍼에 `dark` 클래스가 붙어 h1·본문이 가독성 있게 표시됨. 미리보기 영역은 `scrollHeight` 2027 > `clientHeight` 536으로 독립 세로 스크롤. 375px에서 작성→미리보기→작성 전환 후 본문 203자 유지, 가로 넘침 없음, 다크 미리보기 가독성 확인. 미확인: 라이트 모드 375px 시각 확인(다크만 확인), Safari·Firefox(Chromium만 확인), 개발 중 HMR로 바뀐 CSS의 미리보기 반영(알려진 한계로 새로고침 필요)

- **Task 017: 이미지 업로드 및 썸네일 지정 구현** ✅
  - 관련 기능: F009, F008
  - 관련 파일: `lib/storage/upload-image.ts`, `lib/storage/validate-image.ts`, `lib/editor/insert-at-cursor.ts`, `app/admin/posts/_components/{image-upload-button,thumbnail-field,post-editor}.tsx`, `next.config.ts`
  - 수락 기준: 파일 선택·붙여넣기·드래그앤드롭으로 이미지를 올리면 `blog-images/YYYY/MM/<uuid>.<ext>`에 저장되고 커서 위치에 `![파일명](공개 URL)`이 삽입됨. 썸네일 업로드·제거가 가능하고 저장 시 서버 검증 통과. jpeg/png/webp/gif 외 형식과 5MB 초과는 업로드 전에 거부
  - [x] `validate-image.ts`(MIME·확장자·크기) + 단위 테스트, 업로드 경로 생성(`crypto.randomUUID`)
  - [x] 업로드는 브라우저 Supabase 클라이언트로 스토리지에 직접 전송(Server Action 본문 크기 제한 회피, 스토리지 RLS가 관리자만 허용)
  - [x] `insert-at-cursor.ts`: textarea 선택 영역 기준 삽입 순수 함수 + 단위 테스트, 업로드 중 자리표시(구현은 동시 업로드 구분을 위해 `![업로드 중…](#upload-<id>)`) 후 URL로 치환, 치환 뒤 캐럿 보정(`replaceWithCaret`)
  - [x] `paste`/`drop` 이벤트 처리(여러 파일 순차 업로드), 실패 시 자리표시 제거 및 오류 표시
  - [x] 썸네일 필드: 업로드·미리보기·제거, 값은 공개 URL(Task 013 스키마로 검증). 공개 카드는 기존 `<img>`를 유지해 `next/image`·`remotePatterns`는 도입하지 않음(임의 업로드 URL이라 `<img>` 유지, `next.config.ts` 변경 없음)
  - [x] 고아 파일 정리는 MVP 범위 밖임을 주석으로 명시
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 편집기 이미지 버튼으로 PNG 선택 → 커서 위치에 `![이름](https://…/blog-images/2026/10/<uuid>.png)` 삽입, 미리보기에 이미지 표시
    - 정상: Playwright MCP → 썸네일 업로드 후 발행 저장 → `/blog` 카드에 썸네일 표시
    - 오류: Playwright MCP → SVG 또는 PDF 파일 선택 → "jpeg/png/webp/gif만 가능" 오류, 업로드 요청 없음
    - 오류: Playwright MCP → 6MB 이미지 선택 → 크기 초과 오류, 본문 변화 없음
    - 엣지: Playwright MCP(수동 확인 가능) → 클립보드 이미지 붙여넣기·파일 드래그앤드롭 → 각각 삽입
    - 엣지: `insert-at-cursor.test.ts` → 선택 영역이 있을 때 → 선택 텍스트를 대체, 커서가 삽입 끝으로 이동
  - 테스트 결과: 2026-10-28 `npm run check`(typecheck·lint·prettier 통과, Vitest 21 파일 / 174개)·`npm run build`(21 페이지 생성, `/admin/posts/new`·`[id]/edit` Partial Prerender ◐ 유지)·`npm run knip`(종료 코드 0, `knip.jsonc`의 `lib/supabase/client.ts` 임시 예외 제거 후) 통과. 관리자 자격 증명(`.env`의 `E2E_ADMIN_*`)이 있어 임시 사용자는 만들지 않았다. `e2e/admin-image-upload.spec.ts` 12개 시나리오: PNG 선택→커서 위치(`앞|뒤` 사이)에 `![sample](…/blog-images/YYYY/MM/<uuid>.png)` 삽입·미리보기 이미지, 썸네일 업로드→발행 저장→`/blog` 카드 썸네일, 썸네일 제거, SVG·PDF 선택→형식 오류·업로드 요청 0건·본문 불변, 6MB→크기 오류·업로드 요청 0건·본문 불변, 여러 파일 순차 삽입, 업로드 요청 실패(`route.abort`)→자리표시 제거·오류 표시·본문 불변, 붙여넣기(이미지는 가로채고 텍스트는 가로채지 않음)·드롭 삽입, 업로드 요청을 붙잡아 둔 동안 임시 저장·발행 버튼 비활성화와 종료 후 복구, 375px 폭에서 가로 넘침 없음·이미지 버튼/썸네일 UI 표시·작성↔미리보기 탭 전환 후 유지. 전체 e2e `npm run test:e2e` 66/66 통과(skip 0).
    - 구현 중 발견·수정한 결함: 여러 파일을 올리면 두 번째 이미지가 첫 번째 URL 중간에 삽입됨(자리표시를 URL로 치환한 뒤 textarea 캐럿이 옛 위치에 남음. 단일 파일에서도 캐럿이 URL 중간에 남아 이어 입력 시 URL이 깨짐). `lib/editor/insert-at-cursor.ts`에 `replaceWithCaret`을 추가하고(단위 테스트 5개) 에디터가 치환 후 캐럿을 보정하며 다음 파일에는 보정된 캐럿을 넘기도록 수정. 수정 직후 전체 실행에서 1회 이 시나리오가 실패했으나 원인은 확정하지 못했고(이후 전체 3회·단독 3회 통과), 같은 결함이 남은 것인지 일시적 문제인지는 구분하지 못했다.
    - 이월 항목(실제 Supabase 원격, `.mcp.json` 고정 ref `gfrewivdclcitgysgsbi` 확인): 관리자 세션에서 클라이언트 검증을 우회해 Storage API 직접 호출 시 `image/svg+xml`·`application/pdf`는 415 `invalid_mime_type`, 6MB PNG는 413 `EntityTooLarge`로 서버가 거부. 로그인하지 않고 publishable key만으로 업로드하면 403 RLS 위반. 비관리자 INSERT 거부는 롤백되는 DO 블록으로 확인(anon과 `app_metadata.role='user'`(`user_metadata.role='admin'` 위조 포함) 모두 RLS 위반, `app_metadata.role='admin'` 대조군은 허용). 실제 비관리자 계정으로 로그인한 세션은 만들지 않았다(관리자 1명만 두는 방침).
    - 잔존 데이터: `posts` e2e 글 0건, `auth.users` e2e 사용자 0건(총 1건), 프로브 객체 0건. 단 `blog-images`에는 테스트가 올린 1x1 PNG(70바이트)가 71건 남아 있다. 버킷에 select 정책이 없어 관리자 세션의 Storage API 삭제가 403이고, SQL 삭제는 `storage.protect_delete()` 트리거가 막는다. 사용자 결정으로 고아 파일을 수용했고(스키마 변경 없음), e2e를 실행할 때마다 객체가 늘어난다. 수락 기준의 "스토리지 잔존 0건"은 충족하지 못했다.
    - 제한 사항·미확인: 자동 테스트의 붙여넣기·드롭은 `ClipboardEvent`/`DragEvent`를 합성한 것이다. Playwright MCP 수동 시나리오는 Playwright Test e2e로 대체했고 MCP는 사용하지 않음. Chromium만 확인했으며(375px 폭은 Chromium 뷰포트 크기 조정) Safari·Firefox·실제 휴대폰은 확인하지 않음(사용자가 Chrome만 쓰므로 범위에서 제외). 2026-10-28 사용자가 로컬 Chrome에서 실제 OS 클립보드 붙여넣기와 실제 파일 드래그앤드롭으로 삽입·미리보기 표시를 직접 확인함. Supabase 스키마 변경이 없어 `get_advisors`는 다시 실행하지 않음.

### Phase 5: SEO·최적화·마무리 ✅

> 2026-11-05 MVP 완료 처리. Task 018~020의 체크박스는 이미 실제 결과로 채워져 있었고, 수락 기준 중 확인하지 못한 부분은 각 Task 제목 옆 괄호와 `테스트 결과`의 "제한 사항·미확인"에 남긴 채 Task 021로 넘겼다.

- **Task 018: 블로그 SEO 메타데이터·sitemap·robots 구축** ✅ - 완료 (썸네일 있는 글의 `og:image`와 sitemap `lastModified`는 단위 테스트로만 확인)
  - 관련 기능: F014, F006
  - 관련 파일: `app/(site)/blog/[slug]/page.tsx`(`generateMetadata`), `app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx`, `lib/site-url.ts`, `.env.example`, `.github/workflows/ci.yml`
  - 수락 기준: 글 상세에 title·description(=소개글)·OG 이미지(=썸네일, 없으면 기본 `opengraph-image.png`)가 설정되고, `/sitemap.xml`에 고정 페이지 10개 + 발행 글(`lastModified = updated_at`)이, `/robots.txt`에 `/admin`·`/auth` 제외가 포함됨. 절대 URL은 모두 `NEXT_PUBLIC_SITE_URL` 기준. 없는 글·초안은 noindex
  - [x] `NEXT_PUBLIC_SITE_URL` 도입: `lib/site-url.ts`, `.env.example` 키 추가, CI `build` env에 자리표시자, `app/layout.tsx`의 `metadataBase` 교체(`VERCEL_URL` 의존 제거)
  - [x] `generateMetadata`: `getPostBySlug` 재사용(같은 요청 내 중복 조회 방지를 위해 `React.cache` 또는 캐시 함수 사용), 없으면 `robots: { index: false }`
  - [x] `app/sitemap.ts`: `lib/site-config.ts` 메뉴 + 발행 글(슬러그 인코딩)
  - [x] `app/robots.ts`: `disallow: ['/admin', '/auth']`, sitemap 절대 URL
  - [x] `/admin`·`/auth/login`·`/auth/error` 페이지 단위 noindex: `app/admin/layout.tsx`와 `app/auth/*/page.tsx`(또는 `app/auth/layout.tsx` 신설)에 정적 `export const metadata = { robots: { index: false, follow: false } }` 추가(robots.txt disallow는 색인 차단을 보장하지 않음). `robots`는 얕은 병합이라 하위 page에서 `robots`를 다시 지정하면 layout 값이 사라지므로 하위에서는 지정하지 않는다. 출력 태그(`noindex, nofollow`)는 번들 문서에 명시가 없어 빌드 후 HTML로 확인한다
  - [x] 트레이드오프 기록: 없는 글은 스트리밍 이후 `notFound()`라 HTTP 200 + noindex(soft 404) 수용
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 발행 글 상세 → `<title>`에 글 제목, `meta[name=description]`=소개글, `meta[property="og:image"]`=썸네일 절대 URL
    - 정상: Playwright MCP → `/sitemap.xml` → 고정 페이지와 발행 글 URL, 초안 URL 없음
    - 정상: Playwright MCP → `/robots.txt` → `Disallow: /admin`, `Disallow: /auth`, `Sitemap:` 절대 URL
    - 오류: Playwright MCP → `/blog/없는-글` → `meta[name=robots]`에 `noindex`
    - 엣지: Playwright MCP → 썸네일 없는 글 → 기본 OG 이미지
    - 엣지: Playwright MCP → 한글 슬러그 글 → sitemap의 `loc`이 퍼센트 인코딩된 유효 URL
  - 테스트 결과: 2026-10-29 `npm run check`(typecheck·lint·prettier 통과, Vitest 31 파일 / 242개)·`npm run build`(placeholder env, `/robots.txt` ○ 정적, `/sitemap.xml` ƒ 동적)·`npm run knip`(종료 코드 0) 통과. `e2e/seo.spec.ts` 7개 통과(skip 0, 관리자 자격 증명 사용): `/robots.txt`의 `Disallow: /admin`·`/auth`와 `Sitemap:` 절대 URL, `/sitemap.xml`의 고정 페이지 10개, `/auth/login`·`/auth/error`의 noindex, 없는 글 noindex(HTTP 200), 발행 글의 `<title>`(`제목 | hkoikoi.dev`)·`meta[name=description]`(=소개글)·기본 `og:image`와 sitemap 포함·초안 제외, 한글 슬러그 `loc`의 퍼센트 인코딩과 그 URL 접근. 테스트 후 원격 `posts`의 `e2e-` 글 잔존 0건(읽기 전용 SQL로 확인). Playwright MCP는 쓰지 않고 Playwright Test e2e로 대체했다.
    - 확인한 사실: noindex는 `<meta name="robots" content="noindex, nofollow"/>`로 출력된다(`/auth/login`·`/auth/error`는 서버 응답과 e2e로 확인. `/admin`은 비로그인 시 로그인으로 리다이렉트되어 HTML을 확인하지 못했고 layout의 `metadata` 코드만 확인). 없는 글은 `content="noindex"`이고 스트리밍 때문에 같은 태그가 두 번 나온다(원인은 확인하지 않음). 없는 글은 상태 코드 200이라 soft 404 트레이드오프를 그대로 수용한다. `openGraph`·`twitter`를 지정하면 `app/opengraph-image.png`가 상속되지 않아(임시 라우트의 빌드 HTML로 확인) 썸네일이 없을 때 `lib/post-metadata.ts`가 기본 이미지를 절대 URL로 명시한다.
    - 제한 사항·미확인: 썸네일이 있는 글의 `og:image`는 단위 테스트(`lib/post-metadata.test.ts`)로만 확인했고 e2e로는 확인하지 않았다(썸네일 업로드는 `blog-images` 고아 파일을 늘리므로 하지 않음). sitemap의 `lastModified`(=`updated_at`)도 단위 테스트로만 확인했다. Chromium과 dev 서버 기준이며 배포 환경의 `NEXT_PUBLIC_SITE_URL`은 Task 020에서 확인한다. `seo.spec.ts`는 CI `e2e-smoke`에 넣지 않았다(발행 글 시나리오가 관리자 계정을 쓰므로 로컬 전용).

- **Task 019: 캐싱·성능·접근성 최적화** ✅ - 완료 (편집기를 키보드만으로 조작하는 확인, 이력 4종·`/volunteer`·`/activities` Lighthouse 측정은 미확인 → Task 021로 이월)
  - 관련 기능: F005, F006, F011, F013
  - 관련 파일: `lib/queries/posts.ts`, `lib/supabase/public.ts`, `app/admin/posts/actions.ts`, `app/(site)/**`, `next.config.ts`
  - 수락 기준: 공개 글 조회가 Cache Components(`'use cache'` + `cacheTag`)로 캐시되고, 저장·삭제 시 태그 무효화로 공개 목록·상세에 즉시 반영(F011). 주요 공개 페이지 Lighthouse(모바일) 성능·접근성 90점 이상, 키보드만으로 헤더·필터·편집기 조작 가능
  - [x] `node_modules/next/dist/docs/`에서 `use cache`, `cacheTag`, `updateTag`/`revalidateTag` 문서 확인 후 전략 확정(쿠키를 읽는 서버 클라이언트는 캐시 함수 안에서 쓸 수 없으므로, 공개 조회용 쿠키 없는 Supabase 클라이언트 `lib/supabase/public.ts` 도입)
    - 결정: 태그 `posts`·`post:<NFC slug>`, `cacheLife('max')`(수명은 길게 두고 갱신은 태그 무효화로), 저장·삭제는 read-your-writes가 필요해 `revalidateTag`(SWR) 대신 `updateTag`. `createPublicClient()`는 `Database` 제네릭, 공개 환경변수, `persistSession`·`autoRefreshToken` false이며 호출마다 새로 만든다. 관리자 쿼리(`admin-posts.ts`)는 캐시하지 않는다.
  - [x] 태그 설계: `posts`(목록), `post:<slug>`(상세). Server Action에서 저장·삭제 시 무효화, 슬러그 변경 시 이전·새 슬러그 모두 무효화
    - 구현: `lib/queries/posts.ts`의 `fetchLatestPosts`·`fetchPublishedPosts`·`fetchPostBySlug`가 `'use cache'` + `cacheTag` + `cacheLife('max')`이고, 바깥 래퍼가 `unstable_rethrow` → `console.error` → 빈 값/`null`을 맡는다. 캐시 안에서 throw하면 프리렌더 오류로 빌드가 실패하므로 실패 결과를 돌려주되 `cacheLife({ stale: 0, revalidate: 0, expire: 0 })`로 저장되지 않게 했다. `actions.ts`의 `invalidatePostTags`가 `updateTag`로 `posts`와 이전·새 슬러그의 `post:<NFC slug>`를 만료하고 `/admin/posts`만 `revalidatePath`를 유지한다.
  - [x] 썸네일 `next/image`(크기 지정·`sizes`), 폰트 `display: swap`, 불필요한 Client Component 경계 축소, `npm run analyze`로 KaTeX·highlight 번들이 공개 상세 클라이언트 번들에 포함되지 않는지 확인
    - 결과: `PostCard` 썸네일을 `next/image`(`fill`, `sizes`)로 바꾸고 `next.config.ts`의 `images.remotePatterns`에 `NEXT_PUBLIC_SUPABASE_URL` 기반 `blog-images` 공개 경로만 등록했다(환경변수가 없으면 빈 배열). 상세 페이지에는 썸네일 `<img>`가 없어 변경하지 않았다. 폰트는 Pretendard Variable(CSS `font-display: swap`)과 JetBrains Mono(`display: 'swap'`) 모두 swap이다. `'use client'` 파일은 모두 상태·이벤트가 있어 서버로 되돌릴 대상이 없었다. `npm run analyze` 결과 `katex`·`highlight.js`는 admin 편집기 라우트 청크에만 있고 공개 `blog/[slug]` 매니페스트에는 없다(해당 Task 실행 시 기록한 결과이며 이번에 다시 측정하지 않았다).
  - [x] 접근성: 랜드마크·`aria-current`·포커스 링·대비(라이트/다크), 폼 라벨·오류 `aria-describedby`
    - 점검 전: `/admin`·`/auth/login`에 `<main>` 없음, 스킵 링크 없음, 관리자 메뉴에 `aria-current` 없음, 로그인 오류·썸네일 오류가 입력과 `aria-describedby`로 연결되지 않음. 포커스 링(`ring-ring/50`) 대비 1.75(라이트)·1.85(다크):1로 3:1 미달. 버튼 글자 대비 `primary-foreground`/`primary` 2.84(라이트)·2.66(다크):1, 다크 `secondary` 배지 3.63:1로 4.5:1 미달(oklch→sRGB 상대 휘도로 계산).
    - 수정: 공개·관리자·로그인 `<main id="main-content">`와 `SkipLink`(루트 레이아웃), `AdminNav`(`aria-current`), 로그인 오류 `aria-invalid`·`aria-describedby`·`autocomplete`, 썸네일 오류 연결. 도메인 컴포넌트 포커스 링을 불투명 `ring-ring`으로 변경. 토큰: 라이트 `--primary` L 0.6995→0.56(흰 글자 4.97:1), 다크 `--primary-foreground`를 어두운 배경색으로(6.17:1), 다크 `--secondary` L 0.5943→0.50(5.39:1), 다크 `--ring` L 0.5054→0.68(배경 5.57:1). `components/ui`는 수정하지 않았다(`border-ring`이 함께 바뀌므로 입력·버튼 포커스는 불투명 테두리로도 구분됨).
    - 검증: 2026-10-29 `npm run check`·`npm run knip`·`npm run build` 통과, `e2e/a11y.spec.ts` 8개(랜드마크, `aria-current`, 로그인 오류 연결, 스킵 링크, Tab 순회·포커스 링 box-shadow, 이력 드롭다운·테마 전환·블로그 필터 해제 키보드 조작)와 기존 관리자·방문자·공개 경로 e2e 통과. 미확인: 편집기를 키보드만으로 조작하는 e2e(라벨·`aria-describedby`는 코드로만 확인), 수정 후 대비 재측정 결과의 시각 확인, Lighthouse 접근성 점수(후속 Task).
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 관리자가 글 제목 수정 저장 → 비로그인 탭에서 `/blog`·상세 새로고침 → 즉시 새 제목
    - 정상: Playwright MCP → 글 삭제 → `/blog` 새로고침 → 즉시 미노출, 상세 not-found
    - 오류: Playwright MCP → 발행 글을 초안으로 전환 → 공개 상세 즉시 not-found(캐시 잔존 없음)
    - 엣지: Playwright MCP → 슬러그 변경 → 이전 슬러그 not-found, 새 슬러그 정상
    - 엣지: Playwright MCP → Tab 키로 헤더 메뉴·테마 전환·블로그 필터 순회 → 포커스 표시, Enter로 동작
  - 테스트 결과: 2026-10-31 `npm run check`(typecheck·lint·prettier 통과, Vitest 32 파일 / 253개)·`npm run build`(Partial Prerender ◐ 유지, `/blog`·`/blog/[slug]`는 `cacheLife('max')`로 표시)·`npm run knip`(종료 코드 0) 통과. production 빌드(`npm run build && npm run start`) 위에서 전체 e2e `npx playwright test` 85/85 통과(skip 0, 관리자 자격 증명 사용). 새 `e2e/cache-invalidation.spec.ts` 4개 시나리오는 로그인 쿠키가 없는 별도 브라우저 컨텍스트를 방문자로 두고, 캐시를 데운 뒤 관리자가 변경하면: 제목 수정→`/blog`와 상세에 즉시 새 제목, 삭제→목록에서 사라지고 상세 not-found, 발행→초안 전환→상세 즉시 not-found, 슬러그 변경→이전 슬러그 not-found·새 슬러그 정상. Tab 순회·포커스 링은 기존 `e2e/a11y.spec.ts`가 확인한다. 테스트 후 원격 `posts`의 `e2e-` 글 잔존 0건(읽기 전용 SQL, `.mcp.json` 고정 ref `gfrewivdclcitgysgsbi`). Playwright MCP는 쓰지 않고 Playwright Test e2e로 대체했다.
    - Lighthouse(모바일 프리셋, production 빌드, 로컬 `localhost:3000`, headless Chrome): `/` 성능 100·접근성 100, `/projects` 100·100, `/career` 100·98, `/publications` 100·98, `/blog` 성능 88(첫 측정)→재측정 3회 100·접근성 100, 블로그 상세 성능 90·100·접근성 100. `/blog` 첫 측정 88은 90점 기준 미달이었다. 첫 요청이라 이미지 최적화(`/_next/image`) 캐시가 비어 있었기 때문으로 추정하며 원인은 확정하지 못했다.
    - 구현 중 발견·수정한 결함: 썸네일을 `next/image`로 바꾼 뒤 `src`가 `/_next/image?url=…%2Fblog-images%2F…`로 인코딩되어 `admin-image-upload.spec.ts`의 `img[src*="/blog-images/"]` 셀렉터가 맞지 않았다(`blog-images`로 수정). `a11y.spec.ts`의 이력 드롭다운 테스트는 메뉴가 열린 직후 첫 항목에 포커스가 가기 전에 ArrowDown을 눌러 `/career` 대신 `/education`으로 가는 경우가 있었다(첫 항목 포커스를 기다리도록 수정, 5회 반복 40/40 통과).
    - 제한 사항·미확인: Supabase Auth 로그인은 `/auth/v1/token`의 IP당 버스트 한도(30건)에 걸린다. 전체 e2e는 로그인을 약 40번 해서 기본 한도(token refreshes 150/5min)에서는 약 37번째 로그인부터 429가 나고 로그인이 필요한 테스트가 실패했다. 85/85 통과는 대시보드에서 "Rate limit for token refreshes"를 500/5min으로 올린 상태에서 얻은 결과다(이 값과 "sign-ups and sign-ins" 100/5min은 테스트 후 원래대로 되돌려야 하며, 되돌리면 전체 e2e를 한 번에 통과시키려면 로그인 세션 재사용이 필요하다). 이 원격은 `main PRODUCTION`으로 표시된 프로젝트다. Lighthouse는 로컬 production 빌드의 `/`·`/projects`·`/career`·`/publications`·`/blog`와 블로그 상세 1건만 측정했고(그 상세는 e2e가 남긴 테스트 글이었다) 나머지 공개 페이지와 관리자 화면은 측정하지 않았다. 편집기를 키보드만으로 조작하는 e2e와, 실제 Supabase 썸네일의 `next/image` 런타임 렌더링을 업로드해 확인하는 e2e는 고아 파일을 늘리므로 하지 않았다. 캐시 무효화 e2e는 단일 인스턴스 production 서버 기준이며 배포 환경(여러 인스턴스·CDN)은 Task 020에서 확인한다. Chromium만 확인했다.

- **Task 020: 최종 회귀 테스트 및 배포 준비** ✅ - 완료 2026-11-05 (콘텐츠 교체·sitemap 수정 뒤 전체 e2e·`knip` 재실행, Rate Limits 원복, Auth URL 설정 값 확인은 미확인 → Task 021로 이월)
  - 관련 기능: F001~F014
  - 관련 파일: `e2e/**`, `README.md`, `docs/guides/project-structure.md`, `.env.example`, `data/*.ts`
  - 수락 기준: `npm run check`·`npm run build`·`npm run knip`·`npm run test:e2e` 전체 통과, 배포 환경(예: Vercel)에서 공개·관리자 흐름 확인, 문서가 실제 구조와 일치
  - [x] 전체 E2E 회귀(방문자·관리자·마크다운·이미지·SEO) 실행 및 결함 수정
  - [x] 배포 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`) 설정, Supabase Auth의 Site URL·Redirect URL을 운영 도메인으로 설정
  - [x] README 최종 점검: hkoikoi.dev 기준 기본판은 작성되어 있으므로(설치·환경 변수·관리자 계정 설정 절차), 배포 절차와 `<style>` 작성 규칙(`post-` class, `#user-content-{id}`)을 채우고 실제 구현 상태와 맞는지 확인
  - [x] `docs/guides/project-structure.md`의 구조·정리 대상 목록을 실제 상태로 갱신
  - [x] `data/*.ts`의 `// TODO` 샘플을 실제 이력으로 교체하도록 사용자에게 안내(실제 내용은 사용자 제공)
  - [x] 기본 OG 이미지 교체: `app/opengraph-image.png`·`app/twitter-image.png`가 Supabase 스타터의 "Next.js Starter Kit" 이미지(1200x600, 두 파일 동일)로 남아 있다. hkoikoi.dev용 이미지(권장 1200x630)로 두 파일을 같은 이름으로 덮어쓴다(코드 변경 없음, 이미지는 사용자 제공). Task 018에서 홈과 썸네일 없는 글의 `og:image`가 이 파일을 가리킨다
  - 테스트 체크리스트:
    - 정상: 터미널 → `npm run check && npm run build && npm run knip` → 모두 통과
    - 정상: Playwright MCP → 배포 URL에서 방문자 여정 → 모든 페이지 정상, 콘솔 오류 0건(`browser_console_messages`)
    - 정상: Playwright MCP → 배포 URL에서 관리자 로그인 → 글 작성·이미지 업로드·발행 → 공개 확인 → 삭제
    - 오류: Playwright MCP → 배포 URL `/admin/posts` 비로그인 접근 → `/auth/login`
    - 엣지: Playwright MCP → 배포 URL `/robots.txt`·`/sitemap.xml` → 운영 도메인 절대 URL
    - 엣지: Playwright MCP → 배포 URL 홈·썸네일 없는 글의 `og:image` → 교체한 hkoikoi.dev 이미지(스타터 이미지 아님)
  - 테스트 결과: 2026-11-01~05 로컬 게이트, 2026-11-05 운영 배포 검증.
    - 로컬 게이트: `npm run check`(typecheck·lint·prettier 통과, Vitest 32 파일 / 253개)·`npm run build`·`npm run knip` 모두 종료 코드 0(11-01). 이후 sitemap 수정 때 `npm run check` 구성 중 typecheck·eslint·prettier·Vitest(32 파일 / 254개)와 `npm run build`를 다시 통과시켰고, `knip`은 다시 돌리지 않았다.
    - 전체 e2e: `npx playwright test` 85/85 통과(로컬 dev 서버, Chromium, 관리자 자격 증명 사용, 48.3초, 실패 없음). Supabase Auth 한도 때문에 "token refreshes"를 500/5min으로 올린 상태에서 얻은 결과다. 이 e2e는 실제 이력·로고·OG 이미지 교체(`data/*.ts` 등)와 sitemap 수정 이전에 실행했고 그 뒤로 전체를 다시 돌리지 않았다. 교체 때 이름·어학 값을 데이터 파일에서 읽도록 e2e를 고쳤으나, `visitor-flow` e2e는 운영 DB 쓰기를 포함해 다시 실행하지 않았다. 실행 뒤 원격 `posts`에는 기존 실제 글 1건만 남았다(테스트 글 잔존 0건).
    - 운영 배포 검증(Playwright MCP, `https://www.hkoikoi.dev`, Chromium, Vercel 배포, Cloudflare DNS는 DNS only):
      - 방문자 여정: 공개 11개 경로(`/`, 이력 6종·프로젝트·논문, `/blog`, 글 상세)가 모두 200이고 제목이 맞다. 콘솔 오류·경고는 홈과 글 상세에서 0건을 확인했다. 나머지 공개 경로는 상태 코드·제목·`og:image`만 확인했고 콘솔은 보지 않았다.
      - 관리자 흐름: 사용자가 로그인 폼에 직접 입력한 세션으로 글 작성 → 본문 이미지 1회 업로드(스토리지 URL 삽입) → 발행 → 공개 상세에서 제목·이미지 로드·블로그 목록 노출·콘솔 오류 0건 확인 → 삭제 후 목록에서 사라지고 상세가 not-found임을 확인했다.
      - 비로그인 `/admin/posts` → `/auth/login`으로 이동하고 로그인 폼이 표시된다.
      - `/robots.txt`의 `Sitemap:`과 `/sitemap.xml`의 모든 `loc`이 `https://www.hkoikoi.dev` 절대 URL이다.
      - 홈과 썸네일 없는 글의 `og:image`가 `https://www.hkoikoi.dev/opengraph-image.png`이고 200(PNG)으로 열린다. 이미지는 `file` 명령으로 1200x630을 확인했다(교체본).
    - 확인한 사실: 운영 도메인은 `www.hkoikoi.dev`가 기본이고 `hkoikoi.dev`는 308로 `www`에 리다이렉트된다(`NEXT_PUBLIC_SITE_URL=https://www.hkoikoi.dev`). 환경 변수 3개는 Vercel에서 Config 타입으로 설정했다(`NEXT_PUBLIC_` 접두사가 붙은 변수를 Secret으로 두면 Vercel이 저장을 막는다). 처음 배포 때 `main`이 `develop`보다 44커밋 뒤처져 `/robots.txt`·`/sitemap.xml`이 404였고 `og:image`가 `vercel.app` 주소를 가리켰으나, PR #34 머지로 해결됐다.
    - 발견·수정한 결함: `/sitemap.xml`이 빌드 때 정적으로 프리렌더(`○ Static`, revalidate 30d)되어 글을 발행·삭제해도 갱신되지 않았다. 글 조회가 `'use cache'`라 요청 시점 API가 아니기 때문이다. 운영의 캐시 항목 생성 시각이 발행·삭제보다 앞선 시각에 고정된 것으로 확인했다. `app/sitemap.ts`에서 `await connection()`으로 요청 시점 렌더링을 강제해(빌드 표 `ƒ`) 고쳤고(PR #35, #36), 운영에서 테스트 글 발행 직후 sitemap에 포함되고 삭제 직후 사라지는 것을 확인했다. Task 018 기록의 "`/sitemap.xml` ƒ 동적"은 placeholder env 빌드 결과이며, 실제 Supabase 값으로 빌드하면 정적이 되는 것으로 보인다(placeholder에서는 조회가 실패해 캐시되지 않고 동적이 되는 것으로 추정하며 확인하지 않았다). CI는 placeholder env로 빌드하므로 이 결함을 잡지 못한다.
    - 제한 사항·미확인: `updateTag('posts')`가 정적 Route Handler의 캐시 항목을 만료시키지 못한 정확한 원인(Vercel 동작인지 Next 동작인지)은 확정하지 못했다. 운영 캐시 무효화는 글 발행·삭제 시 목록·상세·sitemap 반영만 확인했고 제목 수정·초안 전환·슬러그 변경은 운영에서 확인하지 않았다(로컬 e2e로만 확인). 삭제된·없는 글 주소는 not-found 화면과 `noindex`를 보이지만 HTTP 200이다(Task 018에서 수용한 soft 404). 썸네일이 있는 글의 `og:image`와 썸네일 업로드는 운영에서 하지 않았다. 운영에서 Lighthouse는 측정하지 않았다(Task 019의 로컬 측정만 있음). Chromium만 확인했고 Safari·Firefox·실제 휴대폰은 확인하지 않았다. 브라우저 탭의 실제 파비콘과 카카오톡·슬랙 공유 카드는 확인하지 못했다. Supabase Auth의 Site URL·Redirect URL은 사용자가 대시보드에서 `www.hkoikoi.dev` 기준으로 변경했다고 알려 왔으나 MCP로 읽을 수 없어 값은 직접 확인하지 못했다(운영 관리자 로그인은 정상 동작했다). Rate Limits(token refreshes) 원복 여부도 확인하지 못했다. 운영 검증 중 `blog-images`에 70바이트 고아 파일이 1개 늘었다(삭제 불가, 수용된 예외). 운영 관리자 계정으로 로그인한 세션이 Playwright 브라우저에 남아 있었으므로 필요하면 로그아웃하거나 비밀번호를 바꾼다.
    - 후속 수정(2026-11-05, PR #39, 커밋 `5350944`): 운영에서 글을 삭제해도 홈 최신 글에 계속 보이는 결함이 있었다(글 조회가 `'use cache'`라 결과가 홈의 정적 셸에 포함됨). `app/(site)/_components/latest-posts.tsx`에서 `connection()`을 기다려 이 영역만 요청 시점 렌더링으로 분리했다. 이 수정의 테스트·운영 반영 결과는 ROADMAP에 기록되지 않았다 → Task 021에서 확인한다.

### Phase 6: MVP 이후 범위 (Post-MVP)

> PRD의 "MVP 이후 기능(제외)" 목록과 추가 요청(이전/다음 글, 태그 정렬, 태그·카테고리 필터)을 Task로 나눴다. 기능 ID **F015~F025는 ROADMAP의 제안**이며 PRD에는 아직 반영하지 않았다. Task를 시작하기 전에 해당 기능을 PRD에 추가할지 사용자와 정하고, 추가하면 `prd-validator`로 점검한다.

#### Phase 6 공통 전제

- **마이그레이션**: 새 테이블·함수·정책은 `supabase/migrations/`에 파일로 두고 Supabase MCP `apply_migration`으로 적용한다. 원격(`gfrewivdclcitgysgsbi`)은 `main PRODUCTION`이므로 적용 전에 `.mcp.json`의 ref를 확인하고 사용자 확인을 받는다. 적용한 뒤에는 `generate_typescript_types`로 `lib/supabase/database.types.ts`를 다시 만들고 `get_advisors`(security·performance)를 돌린다.
- **GRANT**: `public` 스키마의 default privileges 때문에 새 테이블은 anon·authenticated에 과잉 권한(`TRUNCATE`·`REFERENCES`·`TRIGGER` 등)을 받는다(`docs/guides/rls-verification.md`, `fix/posts-grants` 기록). 마이그레이션에서 필요한 권한만 남기도록 `revoke`를 함께 둔다. 관리자 판별은 `app_metadata.role = 'admin'`만 쓰고 `user_metadata`는 쓰지 않는다.
- **캐싱**: 공개 조회는 `lib/queries/posts.ts` 패턴(`createPublicClient()` + `'use cache'` + `cacheTag` + `cacheLife('max')`, 실패는 `failUncached`, 바깥 래퍼에서 `unstable_rethrow` → `console.error` → 빈 값)을 따르고, 쓰기 쪽은 `updateTag`로 무효화한다. 요청 시점 데이터(`searchParams`, 쿠키, 조회수 등)는 `<Suspense>` 안에서 읽는다.
- **운영 반영 확인 필수**: 운영(Vercel)에서 캐시 결과가 정적 셸에 굳어 태그 무효화가 반영되지 않은 사례가 두 번 있었다(Task 020 sitemap, PR #39 홈 최신 글). 공개 화면에 새 데이터 영역을 붙이면 **실제 Supabase env로** `npm run build`를 돌려 빌드 표(○/◐/ƒ)를 확인하고, 운영에서 발행·삭제 직후 반영되는지 직접 본다. 필요하면 그 영역을 `<Suspense>` + `await connection()`으로 분리한다. CI와 placeholder env 빌드는 이 문제를 잡지 못한다.
- **테스트 데이터**: DB 쓰기 e2e는 운영 DB를 쓰므로 `e2e-` 접두와 `afterAll` 정리를 지킨다. 이미지 업로드 e2e는 고아 파일을 늘리므로 최소화하고, 쌓인 파일은 7일 뒤 `/admin/storage`에서 정리한다.

#### 우선순위와 권장 구현 순서

| 순서 | Task                                   | 기능 ID(제안) | 우선순위      | 스키마 변경                    | 선행 Task |
| ---- | -------------------------------------- | ------------- | ------------- | ------------------------------ | --------- |
| 1    | 021 MVP 잔여 검증·운영 점검            | (F001~F014)   | 즉시          | 없음                           | -         |
| 2    | 022 이전/다음 글 내비게이션            | F015          | 높음          | 없음                           | 021       |
| 3    | 023 태그·카테고리 필터 탐색·태그 정렬  | F016          | 높음          | 없음 (필요할 때만 집계 RPC)    | 021       |
| 4    | 024 블로그 목록 페이지네이션           | F017          | 중간          | 없음                           | 023       |
| 5    | 025 키워드 검색                        | F018          | 중간          | 있음 (`pg_trgm`·검색 RPC)      | 023, 024  |
| 6    | 026 RSS 피드                           | F019          | 중간          | 없음                           | 021       |
| 7    | 027 편집기 임시저장 자동화             | F020          | 중간          | 없음                           | 021       |
| 8    | 029 스토리지 고아 이미지 정리          | F022          | 중간          | 있음 (관리자 SELECT 정책)      | 021       |
| 9    | 028 `<style>` 글 단위 스코프 변환      | F021          | 낮음          | 없음                           | 021       |
| 10   | 030 조회수                             | F023          | 낮음          | 있음 (테이블·RPC)              | 022       |
| 11   | 031 댓글                               | F024          | 낮음          | 기본안 없음 (방식에 따라 다름) | 021       |
| 12   | 032 정적 섹션 DB 스키마·공개 조회 전환 | F025          | 낮음          | 있음 (테이블 3개·시드)         | 021       |
| 13   | 033 정적 섹션 관리자 편집 UI           | F025          | 낮음          | 없음                           | 032       |
| 14   | 045 글 본문 `##`~`####` 제목 색상 체계 | F026          | 낮음          | 없음                           | -         |
| 15   | 046 편집기 모바일 탭 tabpanel 연결     | F006          | 낮음          | 없음                           | -         |
| 16   | 034 Post-MVP 통합 회귀·배포 검증       | F015~F026     | 묶음 완료마다 | 없음                           | 대상 Task |

- 순서 근거: (1) 스키마 변경이 없고 읽기만 하는 블로그 탐색 기능(022·023·026)을 먼저 해서 방문자 가치를 빨리 낸다. (2) 목록 기능은 **URL 상태 유틸·목록 쿼리 → 페이지네이션 → 검색(스키마 변경)** 순서로 쌓는다. 023이 `/blog`의 URL 상태(`category`, `tag`)와 조회 함수 시그니처를 정리하고, 024가 `page`, 025가 `q`를 더한다. (3) 관리자 작성 경험·운영 부채(027·029)는 탐색 묶음과 병렬로 진행할 수 있다. (4) 새 테이블·익명 쓰기·외부 서비스가 필요한 기능(030·031)은 남용 대책 결정이 필요해 뒤에 둔다. (5) 정적 섹션 DB 전환(032·033)은 규모가 가장 크고, 지금의 `data/*.ts` 방식으로도 운영에 문제가 없어 마지막에 둔다.
- 병렬 가능: 022·023·026·027·028·029·045는 서로 독립이다. 030은 022(상세 하단 레이아웃) 뒤를 권장하며, 032→033은 순서 의존이다.

- **Task 021: MVP 잔여 검증 및 운영 점검** ✅ - 완료 2026-11-09 (편집기 오류 `aria-describedby` 7개 필드와 제출 실패 뒤 포커스 이동은 `fix/editor-error-focus`에서 실행 확인)
  - 관련 기능: F001~F014 (MVP 완료 처리 때 이월한 미확인 항목)
  - 목표: MVP 완료 처리 때 근거가 부족했던 항목을 확인하고 운영 설정을 원래대로 돌려, Post-MVP 작업을 녹색 회귀(전체 e2e 통과)와 확인된 운영 설정에서 시작한다
  - 의존성: 없음
  - 관련 파일: `e2e/**`, `e2e/fixtures/admin.ts`, `playwright.config.ts`, `knip.jsonc`, `app/(site)/_components/latest-posts.tsx`, Supabase 대시보드(Authentication → Rate Limits, URL Configuration)
  - 수락 기준: 현재 `develop` 기준 `npm run check`·실제 env `npm run build`·`npm run knip`·전체 e2e가 통과하고, 운영에서 홈 최신 글·목록·상세·sitemap이 발행·제목 수정·초안 전환·슬러그 변경·삭제 직후 반영되며, Rate Limits·Auth URL 설정 값이 기록됨
  - [x] 현재 `develop`(PR #39 포함)에서 `npm run check`·`npm run knip`(Task 020의 sitemap 수정 뒤 미실행)과 실제 Supabase env로 `npm run build` 재실행, 빌드 표에서 `/`·`/blog`·`/sitemap.xml` 분류 기록
  - [x] 전체 e2e 재실행(실제 이력·로고·OG 이미지 교체 뒤 미실행, `visitor-flow` 포함). Rate Limit 대응은 파일 분할·6분 간격 실행 또는 일시 상향 후 원복
  - [x] Supabase Auth Rate Limits(token refreshes)가 기본값(150/5min)으로 원복됐는지, Site URL·Redirect URL이 정식 호스트 `https://hkoikoi.dev` 기준인지 사용자 확인 결과를 기록(MCP로 읽을 수 없음)
  - [x] PR #39 운영 반영 확인: 테스트 글 발행·삭제 직후 홈 최신 글 영역 반영
  - [x] 운영에서 확인하지 못한 캐시 무효화 시나리오(제목 수정·초안 전환·슬러그 변경) 확인
  - [x] Task 019 이월: 편집기를 키보드만으로 조작(라벨·포커스 순서·포커스 링·제목/URL 오류 연결), 이력 4종·`/volunteer`·`/activities` 모바일 Lighthouse 측정
  - [x] Task 019 이월(잔여): 편집기 카테고리·태그·소개글·본문·썸네일의 오류 `aria-describedby`가 실제 오류 요소로 연결되는지 실행 확인 (2026-11-09, `fix/editor-error-focus`: `e2e/admin-posts.spec.ts`에 7개 필드 케이스와 빈 폼 Enter 케이스 추가, 전체 e2e 95/95 통과)
  - [x] (선택) e2e 로그인 세션 재사용(Playwright `storageState`)으로 전체 실행의 로그인 횟수를 30회 미만으로 줄여, Rate Limit을 올리지 않고도 한 번에 통과하게 개선
  - 테스트 체크리스트:
    - 정상: 터미널 → `npm run check && npm run knip` → 종료 코드 0
    - 정상: Playwright MCP → 운영 `/` → 관리자가 테스트 글(`e2e-` 접두) 발행 직후 새로고침 → 최신 글 카드에 노출, 삭제 직후 사라짐
    - 정상: Playwright MCP → 운영에서 발행 글 제목 수정 → 비로그인 컨텍스트로 `/blog`·상세 새로고침 → 새 제목
    - 오류: Playwright MCP → 운영에서 발행 글을 임시 저장(초안 전환) → 공개 상세 not-found, `/blog`·홈·sitemap에서 제외
    - 엣지: Playwright MCP → 운영에서 슬러그 변경 → 이전 슬러그 not-found, 새 슬러그 정상, sitemap에 새 슬러그만
    - 엣지: 키보드만(Tab/Shift+Tab/Enter/Space) → 편집기 제목 → 슬러그 → 메타 필드 → 본문 → 이미지 버튼 → 하단 바 버튼 순회, 포커스 링 표시, 검증 오류가 입력과 연결되어 읽힘
  - 테스트 결과: 2026-11-09 (시각은 KST)
    - 정적 검증: HEAD `6eb48ee`(`develop`과 동일, PR #39 포함)에서 `npm run check`(단위 테스트 254개)·`npm run knip` 종료 코드 0, 실제 Supabase env `npm run build` 성공. 빌드 표 분류는 `/` ◐ Partial Prerender(Revalidate 1d·Expire 1w), `/blog` ◐(1d·1w), `/sitemap.xml` ƒ Dynamic. 빌드 경고 `cacheComponents` 켠 채 `partialPrefetching` 미설정은 PR #47(`partialPrefetching: true`)로 해소했고 분류는 같았다.
    - 전체 e2e: 첫 실행은 Rate Limit 회피를 위해 그룹으로 나눠 370초 간격으로 돌렸고 85건 중 84건 통과, 1건 실패였다. 실패는 `e2e/home.spec.ts`의 `getByText("Deploy")`가 대소문자 무시 부분 일치라 홈 최신 글 링크(`…auto-deploy-github-actions`)와 `#deployment` 태그에 걸린 것으로, 앱 결함이 아니라 테스트 취약성이다(PR #48에서 exact 일치로 수정). 이어서 로그아웃을 `signOut({ scope: "local" })`로 바꾸고(PR #49) 로그인 세션 재사용을 넣은(PR #50) 뒤 전체 `npx playwright test`를 분할 없이 한 번에 돌려 86개(setup 1개 포함) 통과, 약 49초, 429 없음. Supabase 로그의 같은 구간 `/auth/v1/token`(password grant)은 13건이다(틀린 비밀번호 테스트 포함, 성공·실패 구분은 못 함. 이전 약 44회는 코드를 읽고 센 값). 실행 후 `e2e-` 접두 글은 0건이고 `blog-images` 객체는 알려진 70바이트 고아 파일만 늘었다(34→41→48).
    - 사용자 확인(Supabase 대시보드, MCP로 읽을 수 없어 사용자 보고 값): Authentication → Rate Limits의 token refreshes는 기본값 150/5min이다(상향 상태 아님). Site URL은 `https://hkoikoi.dev`, Redirect URLs는 `localhost:3000/**`, `https://www.hkoikoi.dev/**`, `https://hkoikoi.dev/**`다(사용자가 적은 표기 그대로). `www` 항목이 남아 있으나 앱은 `signInWithPassword`만 써서 영향이 없다(Task 039 기록 기준).
    - 운영 캐시 반영(`https://hkoikoi.dev`, `e2e-prod-cache-1109a` 글, 쿠키 없는 curl로 확인): 발행 12:06:56 직후 홈·`/blog`·상세·sitemap에 노출. 제목 수정 12:07:32 직후 홈·`/blog`·상세에 새 제목(옛 제목 텍스트 0건은 12:08:08에 확인). 초안 전환 12:08:36·12:10:55 직후 상세가 not-found이고 `/blog`·홈·sitemap에서 제외. 재발행 12:09:30·12:11:12 직후 다시 노출. 슬러그 변경 12:10:19 직후 이전 슬러그 not-found, 새 슬러그 정상, sitemap·`/blog`·홈 링크에 새 슬러그만. 삭제 12:11:34 직후 홈·`/blog`·sitemap에서 사라지고 상세는 not-found(PR #39 선례 재현 안 됨). 삭제 뒤 DB의 `e2e-` 행 0건이고 실제 글은 바뀌지 않았다. not-found 판별은 `페이지를 찾을 수 없습니다` 문구가 정상 글에도 2건씩 들어 있어 쓸 수 없고, `<h1>`이 없고 `<title>`이 `hkoikoi.dev`뿐인지로 했다.
    - 편집기 키보드(임시 Playwright 스펙, 저장 없이 실행, 실행 뒤 삭제): 데스크톱 `/admin/posts/new`의 Tab 정지점 16개가 DOM 순서와 일치(본문 바로가기 → 헤더 링크·로그아웃 → 제목 → URL → 카테고리 → 태그 → 소개글 → 썸네일 업로드 → 이미지 추가 → 본문 → 나가기 → 임시 저장 → 발행하기, 이미지 버튼이 본문보다 앞), Shift+Tab은 정확히 대칭, 모든 정지점에서 `:focus-visible`과 링이 보였다. 빈 폼을 Enter로 제출하면 제목·URL 입력의 `aria-describedby`가 실제 오류 요소(`post-title-error`, `post-slug-error`)를 가리켰다. 모바일(375px) 탭은 방향키로 포커스만 이동하고 Enter로 전환된다.
    - 모바일 Lighthouse 13.6.0(운영 URL, 모바일 simulate, 11:58~12:00): 성능/접근성/모범사례/SEO — `/education` 87/98/100/100, `/career` 99/98/100/100, `/certifications` 88/98/100/100, `/languages` 88/98/100/91, `/volunteer` 94/98/100/100, `/activities` 98/98/100/100. 접근성 98은 6경로 모두 `heading-order`(`h3`) 때문이다. `/languages`는 3회 측정해 성능 88·92·86, SEO 91·100·100이었고 91은 `robots-txt` 감사가 한 번 실패한 것으로 재측정에서 재현되지 않았다(원인 미확인). "이력 4종"은 문서에 정의가 없어 헤더 "이력" 드롭다운(`/education`·`/career`·`/certifications`·`/languages`)으로 해석했다.
    - 제한 사항·미확인: 편집기 카테고리·태그·소개글·본문·썸네일의 오류 `aria-describedby`는 코드상 id 일치만 확인했고 실행으로는 확인하지 못했다. 모바일 탭 트리거가 Tab 정지점인지는 첫 측정에서 건너뛰고 재측정에서는 `작성` 탭이 정지점이어서 일관되지 않으며 원인을 찾지 못했다. Lighthouse는 경로당 1회 측정이라 성능 점수 변동(±수 점)이 있다. 운영 캐시 확인은 curl 1회 호출 기준이며 브라우저 캐시는 확인하지 않았다.
    - 새로 발견(수정하지 않음): (1) 빈 폼 제출 뒤 포커스가 `BODY`로 떨어진다(오류는 `role="alert"`로만 알림). → `fix/editor-error-focus`에서 수정: 서버 검증이 실패하면 `post-editor.tsx`가 첫 `aria-invalid` 입력으로 포커스를 옮기고, 모바일 미리보기 탭이면 작성 탭으로 되돌린 뒤 옮긴다. 썸네일 버튼에 `aria-invalid`를 추가했다. (2) 모바일 탭에 `tabpanel`·`aria-controls` 연결이 없다. (3) 개발 서버가 `/admin/posts`·`/admin/posts/new`에서 `Date.now()` 프리렌더 오류를 낸다(이전 e2e 로그에도 있었고 `npm run build`에는 없음, 원인 조사 안 함). (4) `app/admin/layout.tsx:35`의 `<main>` 안에 `new/page.tsx:10`이 또 `<main>`을 둔다(코드 읽기로만 확인). (5) CLAUDE.md의 e2e 문단(로그인 약 40번, Rate Limit 우회 절차)이 PR #50 이후 사실과 다르다.

- **Task 022: 블로그 상세 이전/다음 글 내비게이션 구현** ✅ - 완료 2026-11-09 (동률 `published_at` 실제 DB 동작, 글 삭제 직후 인접 링크 변경, 데스크톱 2열 배치는 미확인 — `테스트 결과`의 제한 사항 참고)
  - 관련 기능: F015(제안: 이전/다음 글 내비게이션), F006
  - 목표: 상세 하단에서 인접한 발행 글로 바로 이동해 연속 열람을 돕는다
  - 의존성: Task 021(권장). 스키마 변경 없음
  - 관련 파일: `lib/queries/posts.ts`(`getAdjacentPosts`), `lib/queries/posts.test.ts`, `components/blog/post-pager.tsx`(신규), `app/(site)/blog/[slug]/page.tsx`, `e2e/post-navigation.spec.ts`(신규)
  - 수락 기준: 상세 하단에 "이전 글"(더 오래된 글)·"다음 글"(더 최근 글) 링크가 제목과 함께 표시되고, 가장 오래된·가장 최근 글에서는 해당 쪽이 비어 있음. 초안은 포함되지 않고, 글 저장·삭제·발행 상태 변경 뒤 인접 링크가 즉시 바뀜
  - [x] 정렬 기준: 목록과 같은 `published_at desc`, 동률은 `id`로 결정(같은 시각 발행 글의 누락·순환 방지). "이전 = 더 오래된 글, 다음 = 더 최근 글"로 정하고 컴포넌트 주석에 적음
  - [x] `fetchAdjacentPosts(publishedAt, id)`: `'use cache'` + `cacheTag('posts')` + `cacheLife('max')`, `published = true` 명시, 양쪽 각 1건(비교 + 정렬 + `limit(1)`, 동률 조건은 PostgREST `or` 필터 `published_at.lt.<X>,and(published_at.eq.<X>,id.lt.<Y>)` — 값은 DB에서 온 timestamp·uuid라 사용자 입력이 아님), 컬럼은 `slug, title`만. 실패는 `failUncached`, 바깥 래퍼는 `{ prev: null, next: null }`
  - [x] `PostPager`(Server Component): `<nav aria-label="이전·다음 글">`, 한글 슬러그는 기존 링크와 같은 방식으로 인코딩, 모바일에서는 세로 배치·긴 제목 말줄임
  - [x] 상세 페이지에서 본문 조회 뒤 같은 `<Suspense>` 경계 안에서 렌더링(상세가 이미 `params`를 읽는 Suspense 안에 있는지 확인)
  - [x] 무효화: 기존 `invalidatePostTags`가 `posts`를 만료하므로 인접 글 제목 변경·삭제도 반영되는지 확인하고, 추가 태그가 필요 없으면 그 근거를 주석으로 남김
  - [x] 단위 테스트: 쿼리 인자(published 필터·정렬·동률 조건), 실패 시 빈 값
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 발행 글 3건(시드 `e2e-nav-`) 중 가운데 글 상세 → 이전 글 = 가장 오래된 글, 다음 글 = 가장 최근 글의 제목·링크, 클릭 시 이동
    - 정상: Playwright MCP → 관리자가 인접 글 제목 수정 → 비로그인 컨텍스트로 상세 새로고침 → 새 제목
    - 오류: Playwright MCP → 인접 위치에 초안이 있는 상태 → 초안을 건너뛰고 그다음 발행 글 표시
    - 엣지: Playwright MCP → 가장 최근 글 → "다음 글" 없음, 가장 오래된 글 → "이전 글" 없음, 발행 글 1건뿐 → 내비게이션 미표시
    - 엣지: `posts.test.ts` → 같은 `published_at`의 두 글 → `id` 기준으로 서로를 가리킴(누락·순환 없음)
    - 엣지: Playwright MCP → 한글 슬러그 인접 글 링크 클릭 → 정상 상세
  - 테스트 결과 (2026-11-09):
    - 자동 검사: `npm run check` 통과(vitest 33파일 269건 — `posts.test.ts` 26건(인접 글 9건), `post-pager.test.tsx` 6건 포함), `npm run build` 통과(`/blog/[slug]` `◐ Partial Prerender`, Revalidate 1d·Expire 1w, 프리렌더 오류 없음). `npm run knip`은 첫 실행에서 `AdjacentPost` 타입의 불필요한 export를 지적해 export를 제거한 뒤 통과했다.
    - e2e: `e2e/post-navigation.spec.ts` 5건 통과, 전체 `npx playwright test` 100건이 2회 연속 통과. 실행 뒤 DB의 `e2e-` 글 0건(Supabase MCP로 확인), 이미지 업로드는 하지 않아 `blog-images` 고아 파일 없음. 확인한 시나리오: 가운데 글의 이전(더 오래된 글)·다음(더 최근 글) 제목·href와 클릭 이동, 한글 슬러그 인접 글 링크 클릭, 인접 글 제목 수정 뒤 쿠키 없는 컨텍스트 새로고침에 새 제목, 인접 글을 초안으로 바꾸면 초안을 건너뛰고 그다음 발행 글 표시.
    - 개발 서버: 가운데 글에는 이전·다음이, 가장 최근 글에는 이전만 표시됐고 콘솔·서버 로그에 새 오류는 없었다. 375px에서 두 링크가 세로로 쌓이고 다음 글은 우측 정렬이었다. PostgREST `or` 필터는 `+`·`:`가 든 timestamptz를 인용 없이도 읽기 전용 curl로 정상 처리했다.
    - 결정: 목록 쿼리(`getLatestPosts`, `getPublishedPosts`)에 `id desc` 보조 정렬을 더해 같은 `published_at` 글의 목록 순서와 이전·다음 순서를 맞췄다.
    - 첫 전체 e2e 실행에서 병렬 스펙의 발행이 시드 글 사이에 끼어 1건 실패했다. 시드 직후 `/blog` 목록 순서로 연속 여부를 확인하고 아니면 다시 만들도록 고친 뒤 통과했다.
    - 제한 사항·미확인: (1) 동률 `published_at`의 실제 DB 동작은 확인하지 못했다(편집기에 발행 시각 입력이 없어 e2e로 만들 수 없고, 단위 테스트는 `or` 필터 문자열의 `lt`·`gt` 대칭과 정렬 인자만 확인한다). (2) 실제 글이 DB에 있어 "가장 오래된 글에는 이전 글 없음"과 "발행 글 1건뿐이면 내비게이션 미표시"는 e2e로 재현하지 못했다(후자는 `PostPager`의 둘 다 null 단위 테스트로 대체). 가장 최근 글의 "다음 글 없음"도 병렬 스펙이 글을 발행할 수 있어 e2e에서는 시드 글이 아님만 확인한다. (3) 글 삭제 직후 인접 링크가 바뀌는지는 e2e로 확인하지 않았다(제목 수정·초안 전환만 확인, 삭제도 같은 `posts` 태그 만료를 쓴다). (4) 데스크톱 폭(`sm` 이상) 2열 배치는 눈으로 확인하지 못했다(클래스와 단위 테스트로만 확인). (5) 체크리스트의 Playwright MCP 대신 Playwright 스펙과 개발 서버 응답으로 확인했다.

- **Task 023: 태그·카테고리 필터 탐색 및 태그 정렬 규칙 구축** ✅ - 완료 2026-11-09 (JavaScript 비활성 동작, 다크 모드 육안, 태그 12개 초과 시 화면, 발행 글 수백 건 규모의 집계 비용은 미확인 — `테스트 결과`의 제한 사항 참고)
  - 관련 기능: F016(제안: 태그·카테고리 필터 탐색과 정렬), F005
  - 목표: 카드·상세의 배지를 눌러야만 쓸 수 있던 필터를 `/blog` 상단의 카테고리·태그 목록(글 수 포함)에서 바로 고르게 하고, 영어·한글이 섞인 태그를 일관된 순서로 보여 준다
  - 스키마 확인 결과(2026-11-05, `supabase/migrations/20261026105752_create_posts.sql`·`20261028040654_add_posts_category_tags_length_checks.sql`): `category text not null default '일반'`(1~50자), `tags text[] not null default '{}'`(최대 10개, 요소 50자 이하) 컬럼과 `posts_tags_idx`(GIN)·`posts_category_idx` 인덱스가 이미 있고, 공개 조회도 `?category=&tag=`(정확 일치, AND)를 지원한다. **필터를 위한 스키마·마이그레이션 Task는 필요 없다.** 집계는 앱에서 먼저 하고, 발행 글이 수백 건을 넘어 집계 비용이 문제 되면 그때 집계 RPC(`security invoker`, 내부 `published = true`)를 마이그레이션으로 추가한다
  - 검색(Task 025)과의 관계: 필터는 정해진 값(카테고리·태그)의 **정확 일치**, 검색은 자유 키워드의 **부분 일치**다. 둘은 `/blog`의 같은 URL 상태(`category`, `tag`, 이후 `page`, `q`)와 같은 조회 함수에서 AND로 결합하되, 스키마 변경 여부와 위험이 달라 Task는 분리한다. 이 Task가 URL 상태 유틸을 먼저 만들고 024·025가 확장한다
  - 의존성: Task 021(권장). 스키마 변경 없음
  - 관련 파일: `lib/posts/sort-tags.ts`(+test), `lib/posts/list-params.ts`(+test), `lib/posts/taxonomy.ts`(+test, 집계 순수 함수), `lib/queries/posts.ts`(`getTaxonomy`), `app/(site)/blog/page.tsx`, `app/(site)/blog/_components/{taxonomy-filter,post-filter-bar}.tsx`, `e2e/blog-filter.spec.ts`(신규)
  - 수락 기준: `/blog` 상단에 카테고리 목록과 태그 목록이 글 수와 함께 표시되고, 선택 상태가 시각과 `aria-current`로 구분되며, 카테고리+태그 AND 조합·해제가 링크만으로(JavaScript 없이도) 동작. 태그·카테고리 목록은 아래 정렬 규칙을 따르고 서버·브라우저에서 같은 결과. 기존 `?category=&tag=` URL은 그대로 동작
  - [x] 태그 정렬 규칙(`sortTags`): 그룹 순서 **숫자·기호 → 영문 → 한글 → 기타 문자**. 영문 그룹은 `Intl.Collator('en', { sensitivity: 'base', numeric: true })`(대소문자 무시), 한글 그룹은 `Intl.Collator('ko', { numeric: true })`(가나다순), 비교 결과가 같으면(`React`/`react`) 코드포인트 순으로 결정. 근거:
    - 이 블로그의 태그는 대부분 기술 고유명사(Next.js, React, Supabase 등)라 영문을 앞에 두면 자주 쓰는 태그가 먼저 보이고, 개발 블로그·문서의 흔한 배치와 같다
    - 로케일 기본값은 순서가 서로 다르다. 2026-11-05 Node 24에서 `Intl.Collator('ko')`는 한글을 영문보다 앞에, `Intl.Collator('en')`은 영문을 앞에 두었다. 로케일에 맡기지 않고 그룹 순서를 코드로 고정한다
    - 기본 `Array.prototype.sort()`는 코드포인트 순이라 대문자가 소문자보다 앞서고 기호가 사이에 끼어(`Next.js` → `_draft` → `nextjs`) 사람이 기대하는 순서가 아니다
    - 로케일을 명시하면 서버(Node ICU)와 브라우저 결과가 같아 하이드레이션 불일치가 없다
    - 한글을 앞에 두고 싶으면 그룹 순서 상수만 바꾼다(사용자 결정 시 이 항목 갱신)
  - [x] 정렬 적용 범위: `/blog` 상단의 태그·카테고리 목록에 적용. 기본 카테고리 "일반"도 규칙대로 정렬(맨 앞 고정은 하지 않음). **결정 변경(2026-11-09, 사용자 요청)**: 처음에는 카드·상세의 글별 태그를 작성자 입력 순서로 두기로 했으나, 필터 칩과 순서가 달라 보여 카드(`post-card.tsx`)와 상세 헤더(`blog/[slug]/page.tsx`)도 같은 `sortTags`로 정렬한다. 편집기에 입력한 순서와 DB 저장 순서는 바꾸지 않고 표시할 때만 정렬한다
  - [x] `getTaxonomy()`: 발행 글의 `category, tags`만 조회하는 `'use cache'` + `cacheTag('posts')` + `cacheLife('max')` 함수, 카테고리별·태그별 글 수는 순수 함수(`lib/posts/taxonomy.ts`)로 집계, 실패하면 빈 목록
  - [x] `lib/posts/list-params.ts`: `searchParams` → `{ category?, tag? }` 파싱(배열은 첫 값, 빈 값 무시, 50자 초과 무시, NFC 정규화)과 `buildBlogHref(current, patch)`(다른 조건 유지, 이후 추가될 `page`는 필터가 바뀌면 초기화). `app/(site)/blog/page.tsx`의 `first()`를 대체. 구현 메모: `page`는 아직 없어(Task 024) `buildBlogHref`에 필터 변경 시 `page`를 지울 확장 지점을 주석으로만 남겼다. 카드·상세의 배지는 기존처럼 그 조건 하나만 적용하는 링크(`buildBlogHref({}, {…})`)
  - [x] `TaxonomyFilter` UI: 카테고리 칩 줄, 태그 칩(많으면 상위 N개 + `details` "전체 태그"), 선택된 칩을 다시 누르면 해당 조건 해제, 글 수 표시, `aria-current="true"`. 기존 `PostFilterBar`(현재 필터·해제)는 유지하거나 통합. `searchParams`를 읽으므로 기존 Suspense 안에 둠. 0건 조합은 기존 빈 목록 안내 유지. 구현 메모: "상위 N개"는 ROADMAP에 기준이 없어 **글 수 내림차순 상위 12개(동률은 정렬 규칙 순, 선택된 태그는 반드시 포함해 가장 글 수가 적은 마지막 칸과 교체)**로 해석했고(`splitTopTags`), 나머지는 `<details>` "전체 태그 (n)" 안에 정렬 순서로 둔다. `PostFilterBar`는 e2e(`visitor-flow`의 "현재 필터", `a11y`의 "필터 해제" 링크)가 직접 의존해 **통합하지 않고 유지**했다. 칩 접근성 이름은 `<이름>글 N개`이고 "필터 해제"라는 문구는 쓰지 않는다(`a11y.spec`의 링크 이름 검색과 겹침 방지)
  - [x] 결정 기록: 다중 태그 선택(`?tag=a&tag=b`)은 기본 미지원(단일 태그 유지). 대소문자만 다른 태그(`Next.js`/`next.js`)는 별개로 취급하고, 표기 흔들림을 줄이기 위해 편집기 태그 입력에 기존 태그 후보(`datalist`, 관리자 쿼리)를 제안하는 것은 선택 구현으로 둠. 처리 결과: 다중 태그 미지원·대소문자 별개 취급은 구현에 반영했고(`countTaxonomy`는 대소문자만 다른 태그를 따로 센다), 편집기 태그 `datalist` 제안은 선택 구현이라 **하지 않았다**
  - 테스트 체크리스트:
    - 정상: `sort-tags.test.ts` → `['react', '회고', 'Next.js', 'AI', '가나다', '2026']` → `['2026', 'AI', 'Next.js', 'react', '가나다', '회고']`
    - 정상: Playwright MCP → `/blog` → 카테고리·태그 목록과 글 수 표시, 태그 칩 클릭 → `/blog?tag=<태그>`, 해당 글만, 칩 `aria-current`
    - 정상: Playwright MCP → 태그 선택 상태에서 카테고리 칩 클릭 → URL에 두 조건 모두, AND 결과, 선택 칩 재클릭 → 해당 조건만 해제
    - 오류: Playwright MCP → `/blog?tag=<51자 문자열>` → 필터 무시(전체 목록) 또는 빈 목록 안내, 오류 화면 없음
    - 오류: 셸 env로 잘못된 Supabase URL(수동 확인) → 필터 목록 미표시, 글 목록 빈 안내, 오류 화면 없음
    - 엣지: `sort-tags.test.ts` → `React`/`react` 동시 존재 → 항상 같은 순서, `v2`/`v10` → `v2`가 앞(numeric), 일본어·이모지 태그 → 맨 뒤 그룹
    - 엣지: Playwright MCP → 관리자가 새 태그로 글 발행 → 비로그인 `/blog` 새로고침 → 태그 목록에 즉시 추가, 글 삭제 뒤 글 수 0인 태그는 사라짐
    - 엣지: Playwright MCP → JavaScript 비활성 컨텍스트 → 칩 링크로 필터 적용·해제 동작
  - 테스트 결과 (2026-11-09):
    - 자동 검사: `npm run check` 통과(vitest 36파일 311건 — `sort-tags.test.ts` 11건, `list-params.test.ts` 14건, `taxonomy.test.ts` 11건, `posts.test.ts`의 `getTaxonomy` 6건 포함), `npm run knip` 통과(중간에 `TaxonomyItem` 불필요 export를 지적해 정리), 실제 env `npm run build` 통과(`/blog` `◐ Partial Prerender`, Revalidate 1d·Expire 1w, 프리렌더 오류 없음).
    - e2e: `e2e/blog-filter.spec.ts` 5건(로그인 setup 포함 6건 실행)과 `post-navigation`·`visitor-flow`·`a11y`를 함께 돌린 23건 통과. 확인한 시나리오: 태그 칩 클릭 → `?tag=`·해당 글만·글 수·`aria-current`, 태그 선택 상태에서 카테고리 칩 클릭 → 두 조건 AND, 선택 칩 재클릭 → 해당 조건만 해제, 맞지 않는 조합의 빈 목록 안내와 "필터 해제", `?tag=<51자>` → HTTP 400 미만·h1 표시·필터 무시·전체 목록, 새 태그로 발행 → 쿠키 없는 컨텍스트 `/blog` 새로고침에 칩 즉시 추가, 글 삭제 → 칩 사라짐. 글 수가 적은 태그는 "전체 태그" 접힘 안에 있어 스펙이 펼친 뒤 클릭한다. 관련 외 스펙과 전체 `npx playwright test`는 이번에 돌리지 않았다.
    - 개발 서버(Playwright MCP): `/blog`에 카테고리 2개·태그 12개와 "전체 태그 (20)"이 글 수와 함께 표시됐고, 태그 칩 → `?tag=python`, 카테고리 칩 클릭 → `?category=…&tag=python` 9건과 `aria-current` 2개, 선택 카테고리 재클릭 → `?tag=python`만 남았다. 데스크톱·375px 스크린샷 육안 확인, 가로 넘침 없음(`scrollWidth` = `clientWidth`).
    - 오류 경로: 셸 env로 잘못된 `NEXT_PUBLIC_SUPABASE_URL`을 준 개발 서버(포트 3100)에서 `/blog`는 HTTP 200, 필터 목록(`글 탐색` nav) 미표시, "아직 작성된 글이 없습니다" 안내, 오류 화면 없음, 서버 로그에는 `[getTaxonomy]`·`[getPublishedPosts]` `fetch failed`만 기록됐다.
    - 제한 사항·미확인: (1) JavaScript 비활성 컨텍스트에서 칩 링크로 필터를 적용·해제하는 동작은 확인하지 못했다(칩은 `Link`와 `<details>`뿐이고 새 `'use client'`는 없다). (2) 다크 모드 육안 확인은 하지 않았다. (3) 태그가 12개를 넘을 때 선택 태그가 마지막 칸과 교체되는 동작은 단위 테스트(`splitTopTags`)로만 확인했고 화면에서는 보지 않았다. (4) 50자짜리 긴 카테고리명은 `max-w-full`만 적용했고 실제 줄바꿈은 확인하지 않았다. (5) 집계는 발행 글의 `category, tags`를 앱에서 세므로, 글이 수백 건을 넘으면 집계 RPC(`security invoker`, 내부 `published = true`)로 바꾸는 판단이 남아 있다(이번에는 구현하지 않음). (6) 카드·상세 태그 정렬은 `/blog` 카드 한 장의 순서만 직접 확인했고 상세 페이지 화면은 열어 보지 않았다.

- **Task 024: 블로그 목록 페이지네이션 구현** ✅ - 완료 2026-11-09 (실제 모바일 기기·Safari, 데스크톱 번호 목록 육안, 다크 모드, JavaScript 비활성 동작, 운영 canonical 호스트는 미확인 — `테스트 결과`의 제한 사항 참고)
  - 관련 기능: F017(제안: 블로그 목록 페이지네이션), F005
  - 목표: 글이 늘어도 목록 응답 크기와 렌더링 비용을 일정하게 유지한다
  - 의존성: Task 023(`list-params`·`buildBlogHref`). 스키마 변경 없음(기존 `(published, published_at desc)` 인덱스 사용)
  - 관련 파일: `lib/queries/posts.ts`, `lib/posts/list-params.ts`, `lib/posts/pagination.ts`(+test), `lib/posts/page-size.ts`(+test, 신규), `lib/posts/list-metadata.ts`(+test, 신규), `app/(site)/blog/page.tsx`, `app/(site)/blog/_components/pagination.tsx`(+test, 신규), `e2e/blog-pagination.spec.ts`(신규), `e2e/blog-filter.spec.ts`(수정)
  - 수락 기준: `/blog?page=n`이 페이지당 글을 최신순으로 표시하고(모바일 6개, 그 외 10개, 서버가 요청 헤더로 판별) 필터와 함께 동작하며, 필터를 바꾸면 1페이지로 돌아감. 이전/다음·번호 링크가 총 페이지 수에 맞게 표시되고 잘못된 값·범위 밖 페이지는 오류 없이 처리. 홈 최신 3개·sitemap은 영향 없음
  - [x] 페이지 크기(2026-11-09 사용자 결정): 모바일 6개, 그 외 10개. 목록은 서버에서 DB를 잘라 가져오므로 CSS 미디어쿼리로는 나눌 수 없어 `lib/posts/page-size.ts`가 요청 헤더로 기기를 판별한다(`Sec-CH-UA-Mobile`이 `?1`·`?0`이면 그 값, 없으면 User-Agent의 `Mobi|iPhone|iPod`, 태블릿은 10개). 페이지 크기를 캐시 키에 넣고 총 페이지 수·번호 링크도 그 크기로 계산한다. 한계: 화면 너비가 아니라 요청 헤더로 판별하므로 데스크톱 브라우저 창을 좁혀도 10개다. 같은 `?page=n` URL이 기기마다 다른 글을 보여 주고(공유 링크·검색 크롤러 포함), 헤더 판별은 추정이다. 응답이 `User-Agent`에 따라 달라지므로 Caddy·Cloudflare가 HTML을 캐시하면 안 되는데 이 설정은 확인하지 않았다
  - [x] 방식: 오프셋 기반(`range(from, to)` + `count: 'exact'`)을 기본으로 한다(1인 블로그 규모, 번호 링크·URL 공유가 쉬움). 커서 방식은 글이 수천 건이 되면 재검토
  - [x] 조회 함수: 구현은 `getPublishedPostsPage({ category, tag, page, pageSize })`(안쪽 캐시 함수 `fetchPublishedPostsPage`)가 `{ posts, total }`을 반환하고, 캐시 키에 `page`·`pageSize` 포함, `cacheTag('posts')`, `id` 보조 정렬로 페이지 경계의 중복·누락을 막는다. 이름이 처음 계획한 `fetchPublishedPosts(category, tag, page)`와 달라진 이유는 sitemap이 쓰는 전체 조회 `getPublishedPosts`의 시그니처·동작을 바꾸지 않기 위해서다. 필터 조건은 `applyPostFilter`로 추출해 둘이 공유한다. **범위 밖 offset은 오류로 온다**: 운영 REST에 발행 글 18건 상태로 `range 9990-10001`을 요청하니 HTTP 416 `PGRST103`("An offset of 9990 was requested, but there are only 18 rows")에 `content-range: */18`이고 `count`는 오지 않았다(`0-11`은 206 `0-11/18`, `12-23`은 206 `12-17/18`). 그대로 두면 `?page=999`에서 마지막 페이지 링크를 만들 수 없어, `PGRST103`이면 오류로 보지 않고 head 요청으로 전체 글 수만 다시 세어 빈 목록과 함께 돌려준다(재집계가 실패하면 저장하지 않음)
  - [x] `page` 파싱: 양의 정수 문자열만 받고 정수가 아니거나 1 미만이면 1(`page=1`도 URL에 쓰지 않음). 구현 메모: 임의의 큰 `page`마다 캐시 항목이 생기지 않도록 상한 10000을 두어 넘으면 10000으로 고정한다. 마지막 페이지 초과는 빈 목록 안내("없는 페이지입니다") + 첫/마지막 페이지 링크(soft 404 선례와 일관되게 `notFound()`는 쓰지 않고 HTTP 200). `buildBlogHref`는 `category`·`tag`가 바뀌면 `page`를 지우고 `page`만 바뀌면 필터를 유지한다
  - [x] `Pagination`: `<nav aria-label="페이지">`, 현재 페이지 `aria-current="page"`, 링크는 `buildBlogHref`로 필터 유지, 모바일(sm 미만)에서는 번호 목록을 숨기고 이전/다음과 "현재 / 전체"만 표시(새 `'use client'` 없음). 마크업은 `ui-markup-specialist` 에이전트가 작성했고 새 shadcn 컴포넌트는 추가하지 않았다(`buttonVariants` 재사용). 첫 페이지의 "이전"·마지막 페이지의 "다음"은 `aria-disabled` span
  - [x] 메타데이터: 2페이지 이상은 title에 "(n페이지)", canonical은 필터와 `page`를 포함한 자기 자신(`lib/posts/list-metadata.ts`의 `buildBlogListMetadata`), sitemap에는 페이지 URL을 넣지 않음. 구현 메모: `searchParams`를 읽는 `generateMetadata`는 `cacheComponents`에서 허용되며(`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`의 "With Cache Components" 절), `/blog` 본문이 이미 `<Suspense>` 안에서 요청 시점 데이터를 읽으므로 에러 없이 메타데이터가 본문과 함께 스트리밍된다. 정적 셸에는 title이 들어가지 않는다. title은 `page` 값만으로 정하고 DB 조회·`headers()`는 쓰지 않는다
  - 테스트 체크리스트:
    - 정상: `e2e/blog-pagination.spec.ts` → 고유 카테고리로 시드한 발행 글 11건 → 데스크톱 `/blog?category=…` 10건, "다음" 클릭 → `?page=2`에 1건. iPhone User-Agent 컨텍스트는 6건과 5건
    - 정상: `?category=…&page=2`에서 태그 칩 클릭 → URL에서 `page` 제거, 1페이지(계획의 `?tag=x&page=2`에서 카테고리 칩 클릭과 같은 검증, 시드 글이 한 카테고리·한 태그라 태그 칩으로 확인)
    - 오류: `?page=abc`·`?page=0`·`?page=-1` → 1페이지와 같은 결과
    - 오류: `?page=999` → HTTP 200, 빈 목록 안내와 첫/마지막 페이지 링크, 오류 화면 없음
    - 엣지: 2페이지를 보는 중 관리자가 새 글 발행 → 새로고침 시 경계 글이 2페이지로 밀리고 중복 없음
    - 엣지: `pagination.test.ts` → 크기 10에서 total 0·10·11 → 페이지 수 1(빈 안내)·1·2, 크기 6에서 6·7·18 → 1·2·3
  - 테스트 결과 (2026-11-09):
    - 자동 검사: `npm run check` 통과(vitest 40파일 374건 — `pagination.test.ts`, `page-size.test.ts`, `list-metadata.test.ts`, `list-params.test.ts`의 `page` 케이스, `posts.test.ts`의 `getPublishedPostsPage` 10건, `pagination.test.tsx` 8건 포함), `npm run knip` 종료 코드 0, 실제 env `npm run build` 통과(`/blog` `◐ Partial Prerender`, Revalidate 1d·Expire 1w, 프리렌더 오류 없음).
    - e2e: `e2e/blog-pagination.spec.ts` 8건(로그인 setup 포함 9건 실행)이 통과했고, 전체 `npx playwright test` 113건이 두 번 연속 통과했다. 스펙이 실제로 검증하는지 보려고 `DESKTOP_PAGE_SIZE`를 10에서 9로 바꾸자 데스크톱 시나리오가 실패했고 원복했다. 실행 뒤 Supabase MCP로 `title`·`category`가 `e2e-`로 시작하는 글을 세어 0건(남은 시드 없음)임을 확인했다. 전체 실행에서 기존 `e2e/blog-filter.spec.ts` 2건("51자 태그 값…", "새 태그로 발행하면…")이 실패했다: `/blog` 1페이지에 특정 시드 글이 보인다고 가정했는데, 병렬 스펙이 발행한 새 글에 시드 글이 2페이지로 밀렸다. 단일 실행에서는 통과해 전체 실행에서만 드러났다. 특정 시드 글 대신 글 카드·필터 칩이 그려졌는지 확인하도록 고쳤다.
    - 개발 서버(운영 DB 발행 글 19건): curl로 데스크톱 UA는 `/blog` 10건, `?page=2` 9건(합계 19건, 중복 0), `?page=3`부터는 범위 밖 안내, iPhone UA는 1~4페이지가 6·6·6·1건(번호 링크 4개, 중복 0), `Sec-CH-UA-Mobile: ?1`+데스크톱 UA는 6건, `?0`+iPhone UA는 10건이다. Playwright MCP로 데스크톱(1280px)과 iPhone(390px) 컨텍스트에서 "다음 페이지" 클릭 이동, `aria-current`, `?page=abc`·`0`·`-1`이 1페이지와 같음, `?page=999`의 안내와 두 링크(`첫 페이지로 → /blog`, `마지막 페이지로 → /blog?page=2`), `?page=2`에서 카테고리 칩 클릭 시 `page` 제거를 확인했고 가로 넘침은 없었다(375px `scrollWidth` = `clientWidth`, 스크린샷 육안 확인: 이전·`2 / 2`·비활성 다음).
    - 메타데이터: 에이전트가 프로덕션(`next start`)과 개발 서버 응답 HTML로 `/blog` `블로그 | hkoikoi.dev`·canonical `/blog`, `?page=2` `블로그 (2페이지) | hkoikoi.dev`·canonical `?page=2`, `?page=abc`는 `/blog`와 같음, `?category=개발&page=2` canonical에 두 값 포함을 확인했다. 일반 브라우저 UA에서 title은 `<head>` 밖(스트리밍)에 들어가고 `Twitterbot`은 `<head>` 안, `Googlebot` UA는 프로덕션에서 `<head>` 밖이었다(문서의 스트리밍 메타데이터 설명과 일치).
    - 제한 사항·미확인: (1) 실제 모바일 기기와 Safari에서의 동작은 확인하지 못했다(User-Agent를 흉내 낸 컨텍스트로만 확인). 데스크톱 브라우저 창만 좁히면 10개가 나오는 것은 설계에 따른 동작이다. (2) 데스크톱(sm 이상) 번호 목록의 육안 확인은 하지 않았다(e2e가 링크 수·`aria-current`만 확인). (3) 다크 모드 육안 확인은 하지 않았다. (4) JavaScript 비활성 동작은 확인하지 못했다(링크와 서버 컴포넌트뿐이고 새 `'use client'`는 없다). (5) canonical의 운영 호스트(`https://hkoikoi.dev`)는 확인하지 않았다(로컬은 `NEXT_PUBLIC_SITE_URL` 미설정이라 `localhost`). (6) Googlebot이 `<head>` 밖 스트리밍 title·canonical로 색인하는지, 같은 `?page=n`이 기기마다 다른 글을 보여 주는 한계가 검색 노출에 미치는 영향은 확인하지 못했다. (7) Caddy·Cloudflare가 User-Agent에 따라 달라지는 HTML을 캐시하지 않는지 확인하지 않았다. (8) 개발 서버 첫 요청에서 `/blog`만 title이 `<head>` 안에 있던 현상의 원인은 확인하지 않았다(첫 컴파일 타이밍으로 추정). (9) `count: 'exact'`는 필터된 행 전체를 세므로 글이 수천 건이 되면 커서·추정 카운트를 재검토해야 한다.

- **Task 025: 블로그 키워드 검색 구현** ✅ - 완료 2026-11-10 (초안 차단의 SQL 데이터 확인, 다크 모드, JavaScript 비활성 동작, 실제 모바일 기기, 운영 canonical 호스트, anon 역할의 trigram 인덱스 사용은 미확인 — `테스트 결과`의 제한 사항 참고)
  - 관련 기능: F018(제안: 블로그 키워드 검색), F005
  - 목표: 제목·소개글(선택: 본문·태그)의 키워드로 발행 글을 찾는다
  - 의존성: Task 023(URL 상태), Task 024(검색 결과 페이지네이션). **스키마 변경 있음**
  - 관련 파일: `supabase/migrations/<timestamp>_add_posts_search.sql`, `lib/supabase/database.types.ts`(재생성), `lib/queries/posts.ts`(`searchPosts`), `lib/posts/list-params.ts`, `app/(site)/blog/_components/search-form.tsx`(신규), `app/(site)/blog/page.tsx`, `e2e/blog-search.spec.ts`(신규)
  - 수락 기준: `/blog?q=키워드`가 발행 글 중 부분 일치 결과를 최신순으로 보여 주고 필터·페이지와 AND로 결합. 한글 부분 문자열(예: "캐시" → "캐시무효화")이 검색됨. 초안은 결과에 없고 `%`·`_`·`,`·`(`·따옴표 입력이 오류나 필터 주입을 일으키지 않음
  - [x] 방식 결정·기록: Postgres 전문 검색(`to_tsvector('simple')`)은 한국어를 형태소로 나누지 못해 부분 문자열 검색이 안 되므로, `pg_trgm` + GIN trigram 인덱스(`title`, `excerpt`, 선택 `content`) + `ilike`를 기본안으로 한다. 외부 검색 서비스(Algolia 등)는 비용·의존성 대비 이득이 작아 제외
  - [x] 마이그레이션: `create extension if not exists pg_trgm with schema extensions`, trigram 인덱스, 검색 RPC `search_published_posts(q text, p_category text, p_tag text, p_limit int, p_offset int)`(`security invoker`, `set search_path = ''`, 내부에서 `published = true`, `like` 와일드카드 이스케이프, 총 건수 반환 방식 결정). PostgREST `or()` 필터 문자열에 사용자 입력을 넣지 않으려고 RPC로 한다. EXECUTE는 `revoke ... from public` 뒤 anon·authenticated에만 부여
  - [x] 적용 뒤 `generate_typescript_types`, `get_advisors`(security: `function_search_path_mutable`·`extension_in_public` 없음 확인, performance)
  - [x] `q` 파싱: trim, NFC 정규화, 2~50자(1자는 검색하지 않고 안내, 50자 초과는 자름)
  - [x] 캐싱 결정(확정: a, 캐시 없음): `use-cache.md` 확인 결과 캐시 키가 직렬화된 인자라 `q`마다 항목이 생긴다. `searchPosts`(`lib/queries/posts.ts`)는 `'use cache'` 없이 `createPublicClient()`로 RPC 두 개(행·count)를 병렬 호출하고, 호출 측이 Suspense 안에서 요청 시점에 조회한다. 아래는 원래 결정 항목: 검색어는 키 공간이 사실상 무한이라 `'use cache'`로 저장하면 캐시가 커질 수 있다. `node_modules/next/dist/docs/`의 `use cache`·`cacheLife` 문서를 확인한 뒤 (a) 캐시 없이 Suspense 안에서 요청 시점 조회, (b) 짧은 `cacheLife` + `cacheTag('posts')` 중 결정(기본: a)
  - [x] `SearchForm`: `<form action="/blog" method="get" role="search">`(JavaScript 없이 동작), 라벨, 현재 `category`·`tag`는 hidden으로 유지하고 `page`는 초기화. 결과 수와 검색어 옆 "초기화" 링크
  - [x] 검색 결과 화면은 `robots: { index: false }`(검색어 URL 색인 방지)
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 발행 글 `e2e-search-캐시무효화-정리` 시드 → `/blog`에서 "캐시" 검색 → 해당 글 표시, URL `?q=캐시`
    - 정상: Playwright MCP → `?q=캐시&tag=nextjs` → 두 조건 AND
    - 오류: Playwright MCP → 초안에만 있는 키워드 검색 → 0건 안내(초안 미노출)
    - 오류: Playwright MCP → `q`에 `%`, `_`, `a,b)`, `' or 1=1 --` 입력 → 오류 화면 없이 문자 그대로 검색(0건 또는 실제 일치만)
    - 엣지: Playwright MCP → 1자 검색 → 검색하지 않고 안내, 51자 이상 → 잘린 값으로 검색
    - 엣지: Supabase MCP `execute_sql`(읽기 전용 트랜잭션, rollback) → anon 역할로 RPC 호출 → 초안 0건
    - 엣지: Playwright MCP → NFD 한글 검색어(URL 직접 입력) → NFC 검색과 같은 결과
  - 구현 메모(2026-11-10): 마이그레이션 `20261110025008_add_posts_search`(`pg_trgm`, `title`·`excerpt` GIN trigram 인덱스, `search_published_posts`·`search_published_posts_count` RPC 두 개: `security invoker`, `search_path = ''`, 내부 `published = true`, `\`·`%`·`_` 이스케이프, `revoke ... from public` 뒤 anon·authenticated만 grant). `searchPosts`는 캐시 없이 행·건수 RPC를 병렬 호출한다. `SearchForm`은 서버 컴포넌트 GET 폼(`role="search"`)에 카테고리 select, hidden `tag`, 초기화 링크(`search-reset-link.tsx`만 입력창을 비우려고 `'use client'`)를 둔다. 검색 결과는 `robots: { index: false }`이고 canonical은 검색어·page를 뺀 필터 목록 URL이다. `PostFilterBar`(e2e `visitor-flow`·`a11y`가 의존)는 통합하지 않고 유지하되 필터 해제 href가 `q`를 유지한다. `q`는 1자면 검색하지 않고 안내하며, 입력만으로 자동 검색하지 않고 제출(Enter·검색 버튼)해야 한다
  - 테스트 결과: 2026-11-10 `npm run check`(Vitest 43개 파일·415개)·`npm run build`(실제 env, `/blog` 프리렌더 오류 없음, `◐` 부분 프리렌더)·`npm run knip` 통과. `e2e/blog-search.spec.ts` 12개 통과(입력 제출·초기화, 1자 안내, `q`+`tag` AND, 초안 전용 키워드 0건, `%`·`_`·`a,b)`·`' or 1=1 --` 오류 없음, 51자 초과 → 입력창 50자, NFD URL → NFC 입력값, noindex 메타와 canonical에 `q` 없음)와 함께 돌린 `blog-filter`·`blog-pagination`·`a11y`·`visitor-flow`·`seo` 33개 통과. Playwright MCP 개발 서버 확인: 데스크톱(1280px)에서 `?q=캐시`는 0건 안내가 나오고(시드 삭제 뒤), 375px에서 `?q=서버`는 결과 7건·`scrollWidth` 360으로 가로 넘침 없음, NFD `?q=서버`는 NFC와 같은 7건에 입력창 값이 NFC로 보임. 콘솔 오류 0건(경고 1건은 검색과 무관한 LCP 이미지 안내). anon 역할 RPC에 특수문자 17종을 넣어도 오류가 없음을 `execute_sql`로 확인(025-1)
  - 제한 사항·미확인: (1) 검색어가 3자 미만이면 trigram 인덱스를 쓰지 못해 seq scan이다(지금 글 수에서는 문제 없고, 수천 건이 되면 재검토). (2) anon 역할에서 trigram 인덱스가 실제로 쓰이지 않는 한계가 있고 현행 유지로 결정했다. (3) `content`는 인덱스 비용 때문에 검색 대상이 아니라 본문에만 있는 단어는 찾지 못한다. (4) RPC 반환 컬럼 타입의 nullable이 생성 타입과 어긋나는 점은 현행 유지로 결정했다. (5) 캐시하지 않으므로 검색마다 DB를 두 번 호출한다(캐시 결정은 위 항목). (6) 초안 차단은 SQL 데이터로는 확인하지 못했고 e2e(`createPublicClient` 경유)에서 초안 키워드 0건으로만 확인했다. (7) 다크 모드와 JavaScript 비활성 동작, 실제 모바일 기기, 운영 환경(`https://hkoikoi.dev`)의 canonical은 확인하지 않았다. (8) 오타 허용·정확도 순 정렬·하이라이트는 범위 밖이라 없다(최신순)

- **Task 026: RSS 피드 구축** ✅ - 완료 2026-11-10 (W3C 피드 검증기, 운영 반영, 푸터 RSS 링크의 `a11y`·`visitor-flow` e2e, 실제 피드 리더 구독은 미확인 — `테스트 결과`의 제한 사항 참고)
  - 관련 기능: F019(제안: RSS 피드), F014
  - 목표: 피드 리더 구독자에게 새 글을 알린다
  - 의존성: Task 021(권장). 스키마 변경 없음
  - 관련 파일: `app/feed.xml/route.ts`(신규), `lib/feed/build-rss.ts`(+test), `app/layout.tsx`(`metadata.alternates.types`), `proxy.ts`(matcher), `e2e/seo.spec.ts`
  - 수락 기준: `/feed.xml`이 RSS 2.0(`application/rss+xml; charset=utf-8`)으로 최신 발행 글 20건(제목·링크·소개글·발행일·guid)을 `NEXT_PUBLIC_SITE_URL` 기준 절대 URL로 제공하고, 발행·삭제 직후(운영 포함) 반영. 모든 페이지 `<head>`에 피드 `link rel="alternate"`. 피드 검증기 통과
  - [x] Route Handler에서 기존 캐시 조회를 재사용하되 **`await connection()`으로 요청 시점 렌더링을 강제**(Task 020 sitemap 결함: `'use cache'` 조회만 있는 Route Handler는 실제 env 빌드에서 정적으로 굳어 갱신되지 않았다). 실제 env로 `npm run build` 후 빌드 표에서 `ƒ` 확인
  - [x] `buildRss(posts, siteUrl)` 순수 함수: XML 특수문자 이스케이프, 한글 슬러그 퍼센트 인코딩 링크, `pubDate`는 RFC 822, `guid isPermaLink="false"`는 글 id(슬러그를 바꿔도 구독자에게 중복 알림이 가지 않게), 본문은 넣지 않고 소개글만(raw HTML·`<style>` 노출 방지), `atom:link rel="self"`
  - [x] `proxy.ts` matcher에서 `feed.xml` 제외(세션 갱신 불필요, `robots.txt`·`sitemap.xml`과 같은 방식)
  - [x] 루트 `metadata.alternates.types['application/rss+xml']`, 푸터 RSS 링크(선택)
  - 테스트 체크리스트:
    - 정상: `build-rss.test.ts` → 제목에 `&`·`<` 포함 글 → 이스케이프된, 파싱 가능한 XML
    - 정상: Playwright MCP(또는 `curl`) → `/feed.xml` → 200, `content-type` rss+xml, 최신 발행 글 순서
    - 정상: Playwright MCP → 관리자가 글 발행 직후 `/feed.xml` → 포함, 삭제 직후 → 제외(운영에서도 확인)
    - 오류: 셸 env로 잘못된 Supabase URL(수동 확인) → 200 + item 0개 채널, 500 아님
    - 엣지: Playwright MCP → `/feed.xml`의 한글 슬러그 `link` 접근 → 상세 정상
    - 엣지: W3C Feed Validation Service(수동 확인) → 운영 `https://www.hkoikoi.dev/feed.xml` 유효
  - 구현 메모(2026-11-10): `app/feed.xml/route.ts`는 `await connection()` 뒤 `getLatestPosts(20)`을 `buildRss(posts, getSiteUrl())`로 직렬화해 `application/rss+xml; charset=utf-8`로 돌려준다(`getLatestPosts`는 오류 시 빈 배열이라 200 + 빈 채널). `lastBuildDate`는 `new Date()` 대신 첫 글의 `updated_at`에서 만들고 글이 없으면 생략한다. `siteConfig.description`을 추가해 `app/layout.tsx`의 `metadata.description`과 채널 description이 같은 값을 쓴다. 푸터 연락처에 RSS 링크(`aria-label="RSS 피드 구독"`)를 넣었다.
  - 테스트 결과: 2026-11-10 `npm run check`(Vitest 44개 파일·424개, `build-rss.test.ts` 8개 포함)·`npm run knip` 통과(knip은 출력 없이 종료). 실제 env `npm run build`의 빌드 표에서 `/feed.xml`은 `ƒ (Dynamic)`이다(`/sitemap.xml`도 `ƒ`). `npx playwright test e2e/seo.spec.ts` 11개(로그인 setup 포함) 통과: 새로 추가한 3개는 `/feed.xml` 200·`application/rss+xml`·`<rss version="2.0"`·`atom:link` 절대 URL, 홈 `<head>`의 `link[rel=alternate][type="application/rss+xml"]`, 관리자 시나리오(발행 글 포함·초안 제외, item `link`가 ASCII 퍼센트 인코딩이고 그 경로로 상세가 열림, 삭제 직후 피드에서 제외)다. 시나리오가 만든 `e2e-seo-` 글은 `afterAll`의 `cleanup`이 지운다. 오류 상황: 셸 env로 `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9`를 준 dev 서버(`-p 3100`, `.env.local` 미수정)에서 `/feed.xml`이 HTTP 200, `application/rss+xml; charset=utf-8`, item 0개인 채널(`<link>`·`atom:link`는 `http://localhost:3000`)로 응답했다. 같은 폴더에 dev 서버(3000)가 떠 있으면 Next가 두 번째 서버를 거부해, 3000 서버를 종료한 뒤 확인했다.
  - 제한 사항·미확인: (1) W3C Feed Validation Service는 실행하지 않았다(운영 `https://hkoikoi.dev/feed.xml` 유효성은 배포 뒤 수동 확인 필요). (2) 운영(홈 서버) 반영은 확인하지 않았다: 운영에서 발행·삭제 직후 피드가 갱신되는지, Caddy·Cloudflare가 `/feed.xml`을 캐시하지 않는지 보지 않았다. (3) 이번에 전체 `npx playwright test`는 돌리지 않아 푸터 RSS 링크가 링크 수·이름에 의존하는 `a11y.spec.ts`·`visitor-flow.spec.ts`에 영향이 없는지는 확인하지 않았다. (4) "모든 페이지 `<head>`" 중 홈만 e2e로 확인했다(루트 layout metadata라 같은 값이 들어가는 것으로 추정). (5) 실제 피드 리더(Feedly 등)에서의 구독·표시는 확인하지 않았다. (6) 피드는 최신 20건·소개글만 담고 본문은 넣지 않는다(의도). 소개글이 없는 글은 `description` 없이 나간다. (7) 로컬 `NEXT_PUBLIC_SITE_URL` 미설정이라 절대 URL이 `localhost:3000`이다.

- **Task 027: 편집기 임시저장 자동화** ✅ - 완료 2026-11-10 (`beforeunload` 경고와 하단 바 '나가기' 확인창은 e2e·수동 모두 미확인 — `테스트 결과`의 제한 사항 참고)
  - 관련 기능: F020(제안: 편집기 임시저장 자동화), F008, F010
  - 목표: 브라우저 종료·새로고침·네트워크 오류로 작성 중인 글이 사라지지 않게 한다
  - 의존성: Task 021(권장). 스키마 변경 없음(기본안)
  - 관련 파일: `app/admin/posts/_components/{post-editor,autosave-status}.tsx`, `app/admin/posts/_components/use-autosave.ts`(+test), `lib/editor/draft-storage.ts`(+test), `app/admin/posts/actions.ts`, `e2e/admin-autosave.spec.ts`(신규)
  - 수락 기준: 입력이 멈추고 2초 뒤 자동 저장되고 상태("저장 중…"/"자동 저장됨 HH:MM"/"로컬에 보관됨"/"저장 실패")가 표시됨. 새로고침 뒤 저장하지 않은 로컬 사본이 있으면 복원 여부를 묻는다. **발행된 글은 자동 저장으로 초안이 되거나 공개 내용이 바뀌지 않는다.** 저장하지 않은 변경이 있으면 나가기 전에 경고
  - [x] 저장 위치 결정·기록: (1) 모든 글: `localStorage` 백업(키 `post-draft:<id|new>`, 필드·저장 시각), 서버 쓰기 없음. (2) id가 있는 초안(`published = false`): 기존 `savePost` 임시 저장 경로로 서버 자동 저장. (3) 발행된 글: 서버 자동 저장 금지, 로컬 백업만(지금의 "임시 저장"은 발행 글을 초안으로 되돌리므로 자동 실행하면 글이 공개에서 내려간다, Task 013 후속 개선 기록). (4) 새 글: 첫 수동 저장 전에는 로컬만(자동 insert는 URL 이동·중복 생성 위험)
  - [x] `useAutosave`: 디바운스, 저장이 진행 중이면 끝난 뒤 마지막 값만 다시 저장(경합 방지), 이미지 업로드 중(Task 017 자리표시)에는 보류, 서버 저장 성공 시 로컬 사본 정리
  - [x] 충돌 방지: 서버 자동 저장 때 편집 시작 시점의 `updated_at`을 함께 보내 서버 값이 더 새로우면 덮어쓰지 않고 알림(`savePost`에 낙관적 잠금 옵션 추가 여부 결정)
  - [x] 복원 UI: 로컬 사본이 서버 `updated_at`보다 새로우면 "저장하지 않은 변경 복원/버리기" 배너
  - [ ] `beforeunload` 경고와 하단 바 "나가기" 확인
  - [x] 비용 점검: 초안 저장도 `invalidatePostTags`로 `posts` 태그를 만료하는 현재 동작이 자동 저장마다 공개 캐시를 비우지 않도록, 초안→초안 저장은 공개 태그 만료를 생략할지 결정
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 기존 초안 편집 화면에서 본문 입력 후 3초 대기 → "자동 저장됨", 새로고침 시 입력 유지
    - 정상: Playwright MCP → 새 글에서 입력 후 새로고침 → 복원 배너 → "복원" → 입력값 복원, DB 행 생성 없음
    - 오류: Playwright MCP → 발행 글 편집 중 본문 수정 후 대기 → 서버 저장 없음(공개 상세 내용·발행 상태 그대로), "로컬에 보관됨" 표시
    - 오류: Playwright MCP → 저장 요청을 `route.abort`로 실패시킴 → "저장 실패" 표시, 입력 유지, 다음 입력 때 재시도
    - 엣지: Playwright MCP → 이미지 업로드 진행 중 → 자동 저장 보류, 완료 뒤 저장(자리표시 텍스트가 저장되지 않음)
    - 엣지: Playwright MCP → 두 탭에서 같은 초안 편집 → 늦게 저장한 탭에 충돌 알림, 덮어쓰기 없음
    - 엣지: `draft-storage.test.ts` → `localStorage` 용량 초과·사용 불가 → 예외 없이 무시
  - 구현 메모(027-5, 2026-11-10): 수동 `savePost`에는 낙관적 잠금(`base_updated_at`)을 추가하지 않기로 했다(명시적 저장은 마지막 쓰기 우선, 기존 동작 유지). 대신 `PostActionState.updatedAt`(선택)을 추가해 기존 글의 임시 저장 성공 뒤 자동 저장의 `updated_at` 기준을 갱신한다. 복원 사본은 `baseUpdatedAt`을 기준으로 삼아 서버가 더 새로우면 충돌로 드러난다. 수동 저장 중에는 자동 저장을 보류한다.
  - 테스트 결과(2026-11-10): `npx playwright test e2e/admin-autosave.spec.ts` 7개(로그인 setup 포함 8건) 통과: 기존 초안 자동 저장·새로고침 유지, 새 글 복원 배너·복원(서버 호출 0건, 목록에 행 없음), 복원 버리기, 발행 글 로컬 보관(대기 3초 뒤에도 Server Action 0건, 공개 상세 원문 유지, 목록 상태 '초안' 아님), `route.abort` 실패 표시·입력 유지·다음 입력 재시도, 이미지 업로드 중 보류(3초 동안 Server Action 0건)·끝난 뒤 저장·자리표시 텍스트 미저장, 두 탭 충돌 알림과 먼저 저장한 내용 유지. 기존 관리자 e2e(`admin-posts`·`admin-image-upload`·`admin-preview`·`cache-invalidation`) 39개 통과(편집기 통합 직후 실행). `npm run check`(Vitest 48개 파일·467개)·`npm run knip`(종료 코드 0, 기존 설정 힌트 1건)·`npm run build` 통과. 시나리오가 만든 `e2e-auto-` 글은 `afterAll`의 `cleanup`이 지운다. 관리자 계정은 기존 `E2E_ADMIN_*`를 썼고 임시 admin 사용자는 만들지 않았다.
  - 제한 사항·미확인: (1) `beforeunload` 경고와 하단 바 '나가기' 확인창은 e2e·수동으로 확인하지 않았다(그래서 해당 체크박스는 비워 둔다. e2e는 dialog를 수락하도록 처리). (2) 공개 캐시 태그를 만료하지 않는 동작(초안→초안 저장)은 `actions.test.ts` 단위 테스트로만 확인했고 운영·e2e로는 확인하지 않았다. (3) 충돌 상태는 새로고침 전까지 풀리지 않고, 충돌 뒤 수동 저장은 마지막 쓰기 우선이다. (4) 발행 글에서 '임시 저장'을 누르면 초안이 되는 기존 동작은 그대로이며 그 뒤 `initialPost.published`가 낡아 로컬 백업만 한다. (5) 클라이언트 전환으로 새 글에서 수정 화면으로 가면 이전 라우트의 숨겨진 편집기가 DOM에 남아 같은 id가 둘이 되므로(cacheComponents), e2e 헬퍼는 전체 로드로 한 화면만 남긴다. (6) 모바일·Firefox·WebKit과 운영(홈 서버)에서는 확인하지 않았다. (7) 전체 `npx playwright test`는 이번에 돌리지 않았다.

- **Task 028: `<style>` 글 단위 스코프 변환 구현** ✅ - 완료 2026-11-10 (접두 뒤 `#user-content-` 선택자의 브라우저 매칭, 전체 e2e는 미확인 — `테스트 결과` 참고)
  - 관련 기능: F021(제안: `<style>` 글 단위 스코프 변환), F007
  - 목표: 본문 `<style>` 규칙이 그 글의 본문 컨테이너 안에서만 적용되게 해, 사이트가 쓰는 `post-` 접두 클래스(예: `MarkdownContent`의 `.post-content` 래퍼)나 앞으로 한 화면에 함께 렌더링될 다른 글에 영향을 주지 않게 한다
  - 현재 상태: `lib/markdown/rehype-sanitize-style.ts`가 이미 `.post-`·`#user-content-` 접두 선택자만 남기고 `@` 규칙·중첩 규칙·`~`/`+`/`:has` 등과 `url()`을 제거한다. 남은 위험은 (1) 사이트의 `post-` 접두 클래스와의 충돌, (2) 여러 글 본문을 한 화면에 렌더링할 때 규칙이 서로 새는 것, (3) `position: fixed` 같은 속성(스코프로도 막지 못하며 기존대로 수용)이다
  - 의존성: Task 021(권장). 스키마 변경 없음. Task 016(Shadow DOM 미리보기)과 호환 필요
  - 관련 파일: `lib/markdown/rehype-scope-style.ts`(+test), `lib/markdown/plugins.ts`, `components/markdown/markdown-content.tsx`, `app/(site)/blog/[slug]/page.tsx`, `app/admin/posts/_components/markdown-preview.tsx`, `README.md`(작성 규칙)
  - 수락 기준: 상세와 미리보기에서 `<style>`의 모든 선택자가 글 래퍼 클래스(`.post-scope-<글 id 기반 값>`) 하위로 바뀌고, 본문 밖 요소(헤더·푸터·`.post-content` 등 사이트 클래스)에 매칭되지 않음. 기존 글의 본문 안 스타일 결과는 같음
  - [x] 방식 결정·기록: (a) 선택자 접두 변환(sanitize-style 다음 단계에서 `.post-box` → `.post-scope-x .post-box`, 모든 브라우저에서 동작) — 기본안. (b) CSS `@scope` 래핑 — 방문자 브라우저 지원을 확인해야 하고, 지금 sanitize-style이 `@` 규칙을 모두 지우므로 정책 변경이 필요해 보류
  - [x] 플러그인 순서: remark-gfm/remark-math → rehype-raw → rehype-sanitize → rehype-sanitize-style → **rehype-scope-style** → rehype-katex → rehype-highlight. scope 값은 `MarkdownContent`의 prop(`scopeId`)으로 받고 래퍼에 같은 클래스를 붙임(sanitize 뒤에 붙이므로 class 허용 규칙과 무관)
  - [x] `scopeId`: 글 id 기반(슬러그 변경에도 안정). 미리보기는 Shadow DOM 안이라 고정 값 사용
  - [x] 선택적 확장(별도 결정): **미채택, 기존 제한 유지**(2026-11-10 결정). 스코프가 생기면 요소 선택자(`h2`, `table` 등)를 스코프 아래에서 허용할 수 있다. 작성은 쉬워지지만 sanitize-style 허용 규칙을 바꿔야 하므로 기본은 기존 제한 유지
  - [x] README의 `<style>` 작성 규칙 갱신, PRD 트레이드오프 문구 갱신 필요 여부를 사용자에게 보고(PRD는 사용자 결정 후 수정)
  - 테스트 체크리스트:
    - 정상: `rehype-scope-style.test.ts` → `.post-box{color:red}` + scopeId `abc` → `.post-scope-abc .post-box{color:red}`, 선택자 목록(`.post-a, .post-b`)은 각각 접두
    - 정상: Playwright MCP → `<style>.post-box{color:red}</style><div class="post-box">x</div>` 발행 글(시드 `e2e-scope-`) → 본문 div가 빨간색
    - 오류: Playwright MCP → 본문에 `<style>.post-content{display:none}</style>` → 본문 래퍼가 숨겨지지 않음
    - 오류: `rehype-scope-style.test.ts` → 빈 규칙·주석·sanitize-style이 이미 지운 규칙 → 예외 없이 처리
    - 엣지: 단위 테스트 → `#user-content-intro` 선택자 → 접두 뒤에도 본문 요소에 매칭
    - 엣지: 터미널 → `npx playwright test e2e/admin-preview.spec.ts` → Shadow DOM 미리보기 결과와 편집기 UI 격리 유지
  - 결정 기록: (a) 선택자 접두 변환을 채택했다. (b) `@scope`는 sanitize-style이 `@` 규칙을 모두 지워 정책 변경이 필요하고 방문자 브라우저 지원도 확인하지 못해 보류했다. `scopeCss`는 `@` 규칙을 남기지 않고 버린다. 선택적 확장(스코프 아래 요소 선택자 허용)은 하지 않고 기존 제한을 유지했다.
  - 테스트 결과(2026-11-10):
    - 단위: `npx vitest run lib/markdown`·`components/markdown` 통과(`.post-box`→`.post-scope-abc .post-box`, 선택자 목록 각각 접두, `#user-content-intro` 접두, 빈 입력·빈 prelude·주석·`@import;`·`@media`·닫히지 않은 블록, 정규화, uuid, 플러그인 순서·`{ scopeId }` 전달, 래퍼 클래스, `.post-content` 규칙이 래퍼에 매칭되지 않음). 접두 뒤 `#user-content-intro`가 실제 요소에 매칭되는지는 브라우저에서 확인하지 않았고 접두 결과만 단위 테스트로 확인했다.
    - e2e: `npx playwright test e2e/post-style-scope.spec.ts e2e/admin-preview.spec.ts` 7개 통과(10.4초). 새 spec은 Playwright MCP 대신 spec 파일로 `e2e-scope-` 발행 글의 `.post-box`가 `rgb(255, 0, 0)`이고 `.post-content{display:none}`이 있어도 래퍼가 보임을 확인하며, 미리보기 격리 6개는 그대로 통과했다. 전체 e2e는 로그인 횟수 제한 때문에 돌리지 않았다.
    - 게이트: `npm run check`(Vitest 49 파일 / 482개)·`npm run build`·`npm run knip` 통과(knip은 기존 `@testing-library/user-event` 설정 힌트 1건 출력).
    - PRD: 289행 "스코프 변환은 MVP 밖"과 75행 "`<style>`의 글 단위 스코프 변환"(MVP 제외 목록)은 이번 구현과 어긋나 갱신이 필요해 보이며, 수정하지 않고 사용자에게 보고했다.

- **Task 029: 스토리지 고아 이미지 정리 도구 구축** ✅ - 완료 2026-11-11 (실제 삭제·공개 URL 비반환 확인, 후보 선택 e2e, 삭제 직전 경합 재현, 초기 정리는 미확인 — 2026-11-12 이후 사용자가 `/admin/storage`에서 수동 수행, `테스트 결과`의 제한 사항 참고)
  - 관련 기능: F022(제안: 스토리지 고아 이미지 정리), F009
  - 목표: 어떤 글에서도 참조하지 않는 `blog-images` 객체(삭제·교체된 이미지, e2e 테스트 이미지)를 관리자가 확인한 뒤 지울 수 있게 한다
  - 제약(CLAUDE.md "알려진 예외", Task 017 기록): `blog-images`에는 `storage.objects` SELECT 정책이 없어(list API 노출 방지) 관리자 세션의 Storage API 삭제가 403이다(Storage `remove`는 객체 SELECT와 DELETE 권한이 모두 필요하다). SQL `delete from storage.objects`는 `storage.protect_delete()` 트리거가 막고, 트리거를 끄고 지우면 실제 파일은 남고 메타데이터만 사라지므로 하지 않는다. 따라서 삭제는 **Storage API로만** 하고, 이를 위해 권한 경로를 하나 열어야 한다
  - 의존성: Task 021(권장). **정책(스키마) 변경 있음**
  - 관련 파일: `supabase/migrations/<timestamp>_blog_images_admin_select.sql`, `lib/storage/extract-image-paths.ts`(+test), `lib/storage/find-orphans.ts`(+test), `app/admin/storage/page.tsx`(신규), `app/admin/storage/actions.ts`(신규), `app/admin/_components/admin-nav.tsx`, `docs/guides/rls-verification.md`(점검 항목 추가 대상), `e2e/admin-storage.spec.ts`(신규)
  - 수락 기준: 관리자 전용 `/admin/storage`에서 고아 후보(경로·크기·업로드 시각) 목록을 보고 선택 삭제할 수 있고, 참조 중인 이미지와 유예 기간(기본 7일) 이내 객체는 후보에서 빠짐. anon·비관리자는 여전히 객체 목록을 볼 수 없고 공개 URL 접근은 그대로. 기본 동작은 목록만 보여 주는 드라이런
  - [x] 권한 경로 결정·기록: (a) **관리자만** SELECT할 수 있는 정책 추가(`bucket_id = 'blog-images' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`) — 기본안. anon list 차단은 유지되고 service role 키가 필요 없다. (b) 서버 전용 service role 키로 Route Handler·cron에서 삭제 — 운영 환경에 강한 비밀을 새로 두게 되어 제외(이 프로젝트는 service role 키를 쓰지 않는다)
  - [x] 마이그레이션 적용 뒤 RLS 읽기 전용 점검(`docs/guides/rls-verification.md`: anon objs 0, `user_metadata.role='admin'` 위조 0, 정책의 `user_metadata` 참조 0)과 `get_advisors`
  - [x] 참조 수집: 모든 글(초안 포함, `lib/queries/admin-posts.ts` 계열)의 `content`에서 `…/storage/v1/object/public/blog-images/<path>`를 추출(마크다운 이미지·raw HTML `img src`, URL 인코딩 처리)하고 `thumbnail_url`과 합친 집합. 순수 함수 + 단위 테스트
  - [x] 객체 목록: Storage API `list`(연/월 폴더 순회, 페이지 단위) → 참조 집합과의 차집합 → 유예 기간 필터(편집 중 업로드했지만 아직 저장하지 않은 이미지 보호)
  - [x] 삭제 Server Action: `requireAdmin()` → **삭제 직전에 참조를 다시 검사** → Storage API `remove`(배치 상한) → 결과 요약. 되돌릴 수 없음을 확인 대화상자로 안내
  - [ ] 초기 정리(범위 제외, 2026-11-10 사용자 결정: 사용자가 유예(2026-11-12 이후)가 지난 뒤 `/admin/storage`에서 수동 정리): 누적된 e2e 테스트 이미지(70바이트, Task 017 시점 71건 + 이후 실행분)와 운영 검증 이미지. 이 Task에서는 정리하지 않았고 문서만 갱신했다
  - [ ] (선택, 이번 범위 제외) e2e가 자기 업로드를 `afterAll`에서 삭제하도록 변경, 글 삭제 때 그 글만 참조하던 이미지 삭제 제안
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 관리자로 `/admin/storage` → 고아 후보 목록, 참조 중인 썸네일·본문 이미지는 없음
    - 정상: Playwright MCP → 후보 1건 선택 삭제 → 목록에서 사라지고 공개 URL이 더는 이미지를 반환하지 않음
    - 오류: Supabase MCP `execute_sql`(읽기 전용) → anon·`user_metadata.role='admin'` 위조 authenticated로 `storage.objects` select → 0행
    - 오류: Playwright MCP → 비로그인 `/admin/storage` → `/auth/login`
    - 오류: 삭제 직전에 그 이미지를 다른 글에 넣고 저장(경합 재현, 수동 확인) → 서버 재검사로 삭제 건너뜀
    - 엣지: `extract-image-paths.test.ts` → URL 인코딩 경로, 쿼리스트링이 붙은 URL, 다른 버킷·외부 도메인 URL → 올바르게 포함·제외
    - 엣지: Playwright MCP → 방금 업로드하고 저장하지 않은 이미지 → 유예 기간 때문에 후보 아님
  - 구현 메모(2026-11-10): `lib/storage/`에 `extract-image-paths.ts`·`find-orphans.ts`(순수), `storage-adapter.ts`(목록·삭제), `load-orphan-candidates.ts`, `lib/queries/admin-posts.ts`의 `getAdminPostReferences()`(실패 시 null로 빈 목록과 구분), `app/admin/storage/`(`page.tsx`, `actions.ts`의 `deleteOrphans`, `_components/orphan-list.tsx`)와 admin 메뉴 '스토리지'. 삭제 결과에는 명세의 필드 외에 `skippedMissing`을 더했다.
  - 제외한 선택 항목: e2e `afterAll` 삭제와 글 삭제 시 단독 참조 이미지 삭제 제안은 구현하지 않았다. 유예 기간이 방금 올린 파일을 보호해 UI로 지울 수 없고, 유예를 우회하면 서버 재검사 보호가 약해지기 때문이다.
  - 테스트 결과: 2026-11-10 `npm run check`(526개 테스트), `npm run build`, `npm run knip`(미사용 항목 없음, 기존 설정 hint 1건) 통과. `npx playwright test e2e/admin-storage.spec.ts e2e/access-control.spec.ts` 통과(admin-storage 4건 통과·1건 skip). 확인한 시나리오: 비로그인 `/admin/storage` → `/auth/login`, 관리자 목록·빈 상태 표시, 초안이 참조하는 방금 올린 이미지는 후보 아님, 단위 테스트로 삭제 직전 재검사(참조 조회를 두 번째 호출에서 바꿔 모킹)·참조 조회 실패 시 무삭제·remove 일부 실패 요약.
  - 제한 사항·미확인: 운영 `blog-images` 121개가 모두 업로드 7일 이내(가장 오래된 것 2026-11-05)라 후보가 0건이었다. 그래서 후보 선택 e2e(1건 skip), 실제 삭제와 공개 URL 비반환 확인, 삭제 직전 경합 재현(수동)은 수행하지 못했다. e2e는 운영 스토리지를 실제로 지우지 않는다. 초기 정리는 사용자가 2026-11-12 이후 `/admin/storage`에서 직접 수행하기로 했고, 그때 실제 삭제·공개 URL 비반환 확인과 위 미확인 항목을 확인한다(이 Task에서는 확인하지 않았다).

- **Task 030: 블로그 글 조회수 집계 구현** ✅ - 완료 2026-11-11 (쿠키 동의 배너 필요 여부 미확인, 초안 글 조회수 가시성·운영 배포 후 동작은 미확인 — `테스트 결과`의 제한 사항 참고)
  - 관련 기능: F023(제안: 글 조회수), F006
  - 목표: 글별 누적 조회수를 기록하고 상세(선택: 관리자 글 목록)에 표시한다
  - 의존성: Task 022(상세 하단 레이아웃 정리 뒤 권장). **스키마 변경 있음**
  - 관련 파일: `supabase/migrations/<timestamp>_create_post_views.sql`, `lib/supabase/database.types.ts`, `app/api/posts/[id]/view/route.ts`(신규), `app/(site)/blog/[slug]/_components/{view-tracker,view-count}.tsx`(신규), `lib/queries/post-views.ts`, `lib/views/is-bot.ts`(+test), `app/admin/posts/_components/post-table.tsx`
  - 수락 기준: 발행 글 상세를 연 방문자 1명당 24시간에 1회만 늘고, 봇·관리자 세션·초안은 집계하지 않음. 조회수 표시는 캐시된 본문과 분리되어 본문 캐시(`posts` 태그)를 무효화하지 않음. IP·User-Agent 원문 같은 개인정보를 저장하지 않음
  - [x] 스키마: `post_views(post_id uuid primary key references posts(id) on delete cascade, view_count bigint not null default 0, updated_at timestamptz not null default now())`. RLS 활성화, anon·authenticated는 발행 글의 행만 SELECT, 직접 INSERT·UPDATE·DELETE 불가. 과잉 GRANT `revoke`
  - [x] 증가 RPC `increment_post_view(p_post_id uuid)`: `security definer`, `set search_path = ''`, 발행 글일 때만 `insert … on conflict do update set view_count = view_count + 1`. EXECUTE는 `revoke from public` 뒤 anon·authenticated에만 부여. advisor의 security definer 관련 경고는 사유를 기록
  - [x] 증가 경로: 상세의 작은 Client Component가 마운트 뒤 1회 `POST /api/posts/<id>/view` 호출. Route Handler는 `post_viewed_<id>` httpOnly 쿠키(24시간)로 중복을 막고, User-Agent 봇 패턴과 관리자 claims는 제외. 링크 프리페치·프리렌더로는 늘지 않음
  - [x] 표시: `ViewCount`를 별도 `<Suspense>` 안에서 요청 시점 조회(`connection()`), 본문 `'use cache'`와 분리. 실패하면 숫자를 숨김
  - [x] 개인정보(저장 범위): 원문 IP·UA는 저장하지 않는다. UA는 요청 중 `isBot` 판정에만 쓰고 로깅하지 않으며, DB에는 글별 누적 숫자만 남는다. 방문자 식별 값도 서버에 저장하지 않는다
  - [ ] 개인정보(동의 배너): `post_viewed_<id>`는 중복 집계 방지 전용 httpOnly·24시간 쿠키(광고·추적 용도 아님)이고 이 사이트에는 동의 배너가 없다. 다만 이 쿠키가 배너 없이 허용되는지는 법적 판단이라 확인하지 못했다. 사용자가 판단해 이 항목을 갱신한다
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 비로그인 새 컨텍스트로 발행 글 상세 → 조회수 +1, 같은 컨텍스트에서 새로고침 → 그대로
    - 정상: Playwright MCP → 또 다른 새 컨텍스트 → +1
    - 오류: 터미널 → `curl -X POST /api/posts/<초안 id>/view` → 증가 없음, 행 생성 없음
    - 오류: Supabase MCP(읽기 전용, rollback) → anon으로 `post_views` insert/update → RLS·권한 거부
    - 엣지: `is-bot.test.ts` → Googlebot·bingbot·HeadlessChrome UA → 봇, 일반 Chrome UA → 봇 아님
    - 엣지: Playwright MCP → 관리자 로그인 상태로 상세 → 증가 없음
    - 엣지: 글 삭제 → `post_views` 행 cascade 삭제(Supabase MCP 읽기 전용 조회로 확인)
  - 구현 메모(2026-11-11): 마이그레이션 `supabase/migrations/20261111022854_create_post_views.sql`(운영 DB 적용, version은 원격과 일치). `increment_post_view`는 증가했을 때만 `true`를 돌려주고 Route Handler는 `true`일 때만 쿠키를 설정한다. Route Handler(`app/api/posts/[id]/view/route.ts`)는 `POST`만 export해 링크 프리페치·GET으로는 늘지 않고(GET은 405), 잘못된 id는 400, 그 외 제외 사유(쿠키·봇·관리자·초안·RPC 오류)는 모두 204다. `connection()`은 쓰지 않았다(문서상 Cache Components의 프리렌더 대상이 `GET` 핸들러뿐이라는 근거, 빌드는 통과). 표시는 `ViewCount`가 별도 `<Suspense fallback={null}>`에서 `connection()` 뒤 `getPostViewCount`(캐시 없음)를 호출해 본문 `'use cache'`·`posts` 태그와 분리되며 조회수 증가는 `updateTag`를 호출하지 않는다. 글 상세는 `조회수 N`, 관리자 글 목록에는 '조회수' 열(기록 없으면 0, 조회 실패 시 '-')이 있다.
  - advisor 사유: `get_advisors(security)`에 `anon_security_definer_function_executable`·`authenticated_security_definer_function_executable` 경고가 `increment_post_view`에 각 1건 뜬다. 의도한 동작이다. 비로그인 방문자도 호출해야 하고, `anon`·`authenticated`에 `post_views` 쓰기 권한을 주지 않으려고 쓰기 경로를 이 함수 하나로 제한하는 것이 `security definer`를 쓴 이유다. 함수는 `search_path = ''`이며 발행 글이 아니면 아무것도 쓰지 않는다. 이 밖의 새 경고는 없고 기존 `auth_leaked_password_protection`은 "알려진 예외"대로다.
  - 알려진 한계: (1) 쿠키 기반 중복 방지라 방문자가 쿠키를 지우거나 쿠키 없이 요청하면 다시 집계된다. DB의 RPC도 `anon`이 직접 반복 호출할 수 있어 조회수 부풀리기를 완전히 막지는 못한다(레이트 리밋 없음). (2) UA 봇 판정은 위조할 수 있는 1차 필터다. Playwright 기본 UA는 `HeadlessChrome`이라 e2e 방문자 컨텍스트는 일반 브라우저 UA를 지정해야 집계된다. (3) `proxy.ts`가 `/api` 요청에도 `updateSession`을 돌려 `getClaims()`가 요청당 2회 호출된다. proxy의 claims를 핸들러에 안전하게 넘길 방법이 없어 감수했다. (4) 첫 방문 화면은 증가 전 값이고 새로고침해야 반영된다(표시가 요청 시점이고 집계 POST가 마운트 뒤에 나가기 때문).
  - 테스트 결과(2026-11-11):
    - 단위: `lib/views/is-bot.test.ts` 6개, `app/api/posts/[id]/view/route.test.ts` 9개(잘못된 id·쿠키·봇·UA 없음·관리자·RPC false/true·RPC 오류·`createClient` 예외), `lib/queries/post-views.test.ts` 4개, `view-tracker.test.tsx` 3개, `admin-posts.test.ts`의 조회수 4개. `npm run check`(Vitest 58 파일 / 555개)·`npm run build`·`npm run knip`(기존 설정 hint 1건뿐) 통과. 빌드에서 `/blog/[slug]`는 `◐ Partial Prerender` 1d/1w 그대로이고 `/api/posts/[id]/view`는 `ƒ`.
    - DB(Supabase MCP, 운영, `begin … rollback`): `anon` insert·update는 `permission denied for table post_views`(42501), `anon`·`authenticated`의 테이블 권한은 `SELECT`뿐, 함수는 `security definer`·`search_path=""`·`public` 실행 권한 없음, 존재하지 않는 id RPC는 `false`.
    - curl(`next start`, 운영 DB 연결): 초안 id POST → 204·`Set-Cookie` 없음·`post_views` 0행, 잘못된 id → 400, GET → 405, `Googlebot` UA → 204.
    - e2e: `npx playwright test e2e/post-views.spec.ts` 7개 통과(setup 포함, 6.2초): 새 방문자 컨텍스트는 새로고침하면 `조회수 1`이고 24시간 쿠키(`post_viewed_`)가 실리며, 같은 컨텍스트에서 다시 열고 새로고침해도 1, 다른 새 컨텍스트는 `조회수 2`, 봇 UA·관리자 세션은 `Set-Cookie` 없이 2 그대로, 관리자 글 목록 조회수 열이 2. 테스트 글은 `e2e-views-` 접두이고 `afterAll`에서 지웠으며, 지운 뒤 `post_views`가 0행이라 글 삭제 시 cascade 삭제도 확인했다.
    - 회귀: `visitor-flow`·`cache-invalidation`·`a11y`·`seo`·`post-navigation`·`post-style-scope`·`access-control`을 함께 돌렸을 때 `post-navigation`의 시드 글 연속 배치 확인이 한 번 실패했다(`시드 글이 연달아 놓이지 않았다`). 같은 spec만 다시 돌리면 6개 모두 통과했다. 다른 spec의 발행 시각과 겹친 타이밍 문제로 보이지만 원인을 확정하지는 않았다.
  - 제한 사항·미확인: (1) 초안이었다가 조회가 쌓인 글의 조회수가 방문자에게 숨고 관리자에게만 보이는 RLS 동작은 조회수가 있는 초안이 없어 확인하지 못했다. (2) 관리자 `user_metadata.role` 위조 사용자가 초안 글 조회수를 못 보는지는 확인하지 않았다. (3) 운영 배포 후 `/blog/[slug]` 정적 셸에서 조회수가 요청 시점에 갱신되는지는 로컬 `next start`에서만 확인했다. (4) 쿠키 동의 배너 필요 여부는 법적 판단이라 확인하지 않았다. (5) 모바일 화면 등 시각 배치는 사용자가 보낸 데스크톱 스크린샷으로만 확인했다.

- **Task 031: 블로그 댓글 기능 도입** ✅ - 완료 2026-11-11 (슬러그 변경 뒤 같은 Discussion 연결·운영 배포 후 동작·모바일 배치는 미확인 — `제한 사항·미확인` 참고)
  - 관련 기능: F024(제안: 블로그 댓글), F006
  - 목표: 방문자가 글에 의견을 남길 수 있게 한다
  - 의존성: Task 021(권장). 방식에 따라 스키마 변경 여부가 달라짐(기본안은 변경 없음). **방식은 시작 전에 사용자 결정 필요**
  - 관련 파일: `components/blog/comments.tsx`(신규, Client), `app/(site)/blog/[slug]/page.tsx`, `lib/site-config.ts`(설정값), `next.config.ts`(CSP 확인)
  - 수락 기준: 발행 글 상세 하단에서 댓글을 읽고 쓸 수 있고, 라이트/다크 테마가 사이트와 맞춰지며, 댓글 영역은 화면에 들어올 때만 로드되어 상세 Lighthouse(모바일) 성능 90 이상 유지. 슬러그를 바꿔도 기존 댓글이 같은 글에 남음
  - [x] 방식 결정·기록: (a) **Giscus(GitHub Discussions)** — 기본안. DB·스팸 방지·모더레이션을 GitHub에 맡기고 회원가입 차단 정책과 충돌하지 않는다. 댓글을 쓰려면 GitHub 계정이 필요하다. (b) Supabase 자체 댓글 테이블 — 익명 작성이면 스팸 대책(CAPTCHA)·모더레이션 UI·개인정보(이메일·닉네임) 처리 부담이 크고, 회원가입을 열어야 하면 현재 인증 정책과 충돌한다. (c) Disqus 등 — 광고·추적 때문에 제외
  - [x] (a 채택 시, 사용자 수동 작업) 저장소 Discussions 활성화, giscus 앱 설치, 댓글용 카테고리 생성 (2026-11-11 사용자가 완료. 카테고리 `Comments`는 Announcement 형식이며 형식은 사용자 스크린샷으로, giscus 앱 설치는 giscus.app 저장소 검사 통과 화면으로 확인했다. `repoId`·`categoryId`는 `gh api graphql`로 조회)
  - [x] 매핑은 `data-mapping="specific"` + `data-term=<글 id>`(pathname 매핑은 슬러그를 바꾸면 끊긴다)
  - [x] `Comments`(Client): `IntersectionObserver`로 지연 로드, `next-themes` 테마가 바뀌면 iframe에 `postMessage`로 전달, 로드 실패 시 안내 문구. 초안·없는 글에는 렌더링하지 않음 (초안·없는 글은 `getPostBySlug`가 `null`이라 `notFound()`로 처리되어 `Comments`까지 오지 않는다)
  - [x] CSP: 지금은 `frame-src`·`script-src`를 두지 않아 giscus가 허용되지만, CSP를 강화하면 `giscus.app`을 추가해야 함을 "알려진 트레이드오프"에 기록
  - 구현 메모(2026-11-11): `components/blog/comments.tsx`(Client)는 설정(`lib/site-config.ts`의 `siteConfig.giscus`: `repo`·`repoId`·`category`·`categoryId`) 중 하나라도 비면 `null`을 돌려주고, 아니면 `key={postId}`를 붙인 내부 `GiscusEmbed`를 렌더링한다. 화면 200px 앞에서 `https://giscus.app/client.js`를 주입하고(`data-strict=0`, `data-lang=ko`, `data-loading=lazy`), `resolvedTheme`이 정해지기 전에는 불러오지 않으며, 스크립트 `onerror` 또는 15초 안에 `iframe.giscus-frame`이 없으면 안내 문구를 보인다. 테마 변경은 이미 뜬 iframe에 `giscus.app` origin으로만 `setConfig`를 보낸다. 상세 페이지에서는 `PostPager` 뒤(맨 아래)에 `<Comments postId={post.id} />`를 둔다(댓글 iframe이 길어져도 이전·다음 글 링크가 밀리지 않게). `@giscus/react`는 쓰지 않아 의존성 변경은 없다.
  - 알려진 한계: (1) iframe이 로드되는 중에 테마를 바꾸면 `setConfig` 메시지가 유실될 수 있다(초기 `data-theme`만 적용). (2) 스크립트는 받았지만 giscus iframe 안에서 위젯이 실패하는 경우는 감지하지 못한다. (3) 댓글 작성에는 GitHub 계정이 필요하다. (4) e2e는 `giscus.app`을 가로채 가짜 `client.js`로 검증하며 about:blank iframe은 메시지를 받지 못해 `postMessage` 호출 인자만 확인한다.
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 발행 글 상세 하단으로 스크롤 → giscus iframe 로드, 스크롤 전에는 iframe 없음
    - 정상: Playwright MCP → 테마 전환 → iframe 테마 반영
    - 오류: Playwright MCP → `giscus.app` 요청을 `route.abort` → 안내 문구, 본문·페이지 오류 없음
    - 엣지: 슬러그 변경 후 같은 글 상세(수동 확인) → 같은 Discussion 연결
    - 엣지: Lighthouse 모바일 → 상세 성능 90 이상
  - 테스트 결과(2026-11-11):
    - 단위: `components/blog/comments.test.tsx` 16개(설정 4종 중 하나라도 비면 렌더링 없음, 교차 전 스크립트 없음, 교차 후 글 id 매핑 스크립트 1회·관찰 중지, 다크 `data-theme`, 테마 미확정 시 미로드, IntersectionObserver 없으면 즉시 로드, 테마 변경 시 `giscus.app`으로 `postMessage`, iframe 없을 때 테마 변경 무오류, `onerror`·15초 타임아웃 안내, iframe이 생기면 안내 없음, 언마운트 정리, 글 변경 시 재주입). `npm run check`(Vitest 59 파일 / 571개)·`npm run build`·`npm run knip`(기존 설정 hint 1건뿐) 통과. 빌드에서 `/blog/[slug]`는 `◐ Partial Prerender` 1d/1w 그대로.
    - e2e: `npx playwright test e2e/post-comments.spec.ts` 4개 통과(setup 제외 시, 글 생성 포함 6.5초). `giscus.app`을 `page.route`로 가로채 실제 Discussion을 만들지 않았다. 스크롤 전에는 `giscus.app` 요청 0건·iframe 없음, 댓글 영역에 가까워지면 `client.js`만 요청되어 iframe 1개와 `data-mapping=specific`·`data-term`(글 id)·`data-theme=light`, 다크 전환 시 `{ giscus: { setConfig: { theme: 'dark' } } }`가 `https://giscus.app`으로만 기록되고 스크립트는 재주입되지 않음, `route.abort` 시 안내 문구·본문 유지·`pageerror` 없음. 설정이 비면 `test.skip`(이번엔 설정이 있어 건너뛴 항목 없음).
    - 회귀: `a11y`·`visitor-flow`·`post-views`와 함께 23개를 7회 돌려 5회는 모두 통과했다. 첫 실행에서는 dev 서버가 중간에 연결 거부 상태가 되어 4개가 실패했고(원인 미확인, 같은 서버 로그에 통과한 실행에도 `ECONNRESET` uncaughtException이 있다), 한 번은 `toBeFocused` 단언 1개가 실패했다(어느 테스트인지 확인하지 못했다). 둘 다 다시 돌리면 사라졌다.
    - Lighthouse 모바일(실제 env 빌드를 `next start`로 띄운 로컬, 기존 발행 글 1개, 3회): 성능 100·100·100, LCP 1.2s, TBT 0~10ms, CLS 0~0.016. 네트워크 요청 42건 중 giscus 0건(스크롤하지 않으므로 지연 로드가 의도대로 동작). 운영 도메인의 네트워크 지연은 반영되지 않았고, giscus가 로드된 뒤의 성능은 측정하지 않았다.
    - 수동(Playwright MCP, 실제 giscus, 댓글 작성 없음): 스크롤 전 스크립트·iframe 없음, 스크롤 후 `giscus.app/ko/widget` iframe 로드(높이 372px, `theme=light`), 요청에 `term=<글 id>`·`category=Comments` 포함, 라이트·다크 전환 시 iframe까지 테마 반영(스크린샷으로 확인). 콘솔의 404 2건과 giscus 경고 2건은 이 글에 Discussion이 아직 없어서 나는 정상 동작이다.
  - 제한 사항·미확인: (1) 슬러그를 바꾼 뒤 같은 Discussion에 연결되는지는 확인하지 못했다. 확인하려면 첫 댓글을 써서 GitHub에 Discussion을 만들어야 한다. 요청에 글 id(`term`)가 실리는 것까지만 확인했다. (2) 실제 giscus의 `setConfig` 수신은 iframe 외관이 바뀐 것으로만 확인했고 메시지 내용은 e2e에서 호출 인자로만 검증했다. (3) 운영 배포 뒤 `/blog/[slug]`에서의 동작과 Lighthouse는 확인하지 않았다. (4) 모바일 화면 배치는 확인하지 않았다.

- **Task 032: 정적 섹션 DB 스키마 및 공개 조회 전환** ✅ - 완료 2026-11-11 (운영 반영과 정적 셸 무효화는 미확인 — `테스트 결과`의 제한 사항 참고)
  - 관련 기능: F025(제안: 정적 섹션 DB 저장·관리자 편집), F002, F003, F004
  - 목표: 이력 6종·프로젝트·논문을 `data/*.ts`에서 Supabase 테이블로 옮겨, 코드 배포 없이 내용을 바꿀 기반을 만든다(편집 UI는 Task 033)
  - 의존성: Task 021(권장). **스키마 변경 있음.** Task 033의 선행
  - 관련 파일: `supabase/migrations/<timestamp>_create_resume_tables.sql`, `supabase/migrations/<timestamp>_seed_resume_data.sql`(또는 시드 생성 스크립트), `lib/supabase/database.types.ts`, `lib/types/resume.ts`, `lib/queries/resume.ts`(+test), `app/(site)/{education,career,certifications,volunteer,languages,activities,projects,publications}/page.tsx`, `app/(site)/page.tsx`(대표 프로젝트), `data/*.ts`, `data/data.test.ts`, `docs/guides/project-structure.md`
  - 수락 기준: 8개 공개 페이지와 메인 대표 프로젝트가 DB 데이터로 전환 전과 같은 내용·순서를 표시하고, 조회 실패 시 빈 안내로 안전하게 처리되며, 쓰기는 관리자만 가능. placeholder env 빌드(CI)가 실패하지 않음
  - [x] 결정 기록(사용자 결정, 2026-11-11): (1) `resume_entries`에 `grade`·`grade_label`·`tag_groups jsonb`를 추가해 기존 `ResumeEntry`의 `grade`·`gradeLabel`·`tagGroups`를 보존한다. (2) `projects` 링크는 `github_url`·`demo_url` 두 컬럼이다. (3) SELECT 정책은 `is_visible = true` 또는 관리자다. 전환 전 스냅샷은 작업 중 scratchpad의 `resume-snapshot.json`에 저장했다(이력 6종 3·1·2·1·1·1건, 프로젝트 4건, 논문 3건, 메인 대표 `hkoikoi.dev`·`Distributed Lock Burst Benchmark`·`SCO 순찰 일지`)
  - [x] 범위 결정: 이력 6종·프로젝트·논문을 대상으로 하고 `Profile`(이름·소개·연락처·아바타)은 `data/profile.ts`에 유지(변경 빈도가 낮고 아바타 파일이 `public/`에 있음). 바꾸려면 이 항목 갱신
  - [x] 스키마(적용: `20261111044710_create_resume_tables.sql`, 2026-11-11): `resume_entries`(`section` check 6종, `title`, `subtitle`, `period`, `description`, `grade text`, `grade_label text`, `tag_groups jsonb`, `tags text[]`, `link`, `sort_order int`, `is_visible bool`), `projects`(`name`, `summary`, `period`, `role`, `stack text[]`, `github_url`, `demo_url`, `featured`, `sort_order`, `is_visible`), `publications`(`title`, `authors`, `venue`, `year`, `link`, `sort_order`, `is_visible`). 기존 `lib/types` 필드와 1:1, 길이 check는 zod와 같은 값, `updated_at` 트리거는 posts와 같은 함수 재사용
  - [x] RLS(적용·검증 완료, `get_advisors`에 새 경고 없음, `rls-verification.md`에 점검 C·D'·E 추가): SELECT는 `is_visible = true` 또는 관리자(`app_metadata.role = 'admin'`, `posts`와 같은 방식, Task 033 편집 화면에서 숨김 항목 조회에 필요), 쓰기는 `app_metadata.role = 'admin'`만. 과잉 GRANT `revoke`. 적용 뒤 `generate_typescript_types`, `get_advisors`, `rls-verification.md` 점검 범위 확장
  - [x] 시드(적용: `20261111045139_seed_resume_data.sql`, 행 수·`sort_order`·`tag_groups`·링크를 원본과 대조): 현재 `data/*.ts` 내용을 그대로 옮김(배열 순서 → `sort_order`, 스크립트로 SQL 생성). 이미 저장소에 공개된 내용이라 노출 범위는 같음
  - [x] `lib/queries/resume.ts`(`resume.test.ts` 26건): `createPublicClient()` + `'use cache'` + `cacheTag('resume', 'resume:<section>')`·`'projects'`·`'publications'` + `cacheLife('max')`, 실패 `failUncached`, 논문은 기존 `sortPublications` 규칙 유지
  - [x] 렌더링 확인(Task 033에서 완료): 실제 env 빌드에서 8개 페이지와 홈이 정적(○)에서 Partial Prerender(◐)로 바뀌었다. 조회가 실패하면 수명 0 결과가 프리렌더에서 동적 접근으로 취급돼 `<Suspense>` 밖에서는 placeholder env 빌드가 실패한다(`Route "/activities": Next.js encountered uncached or runtime data during prerendering`). 그래서 제목은 정적으로 두고 조회는 `app/(site)/_components/`의 async 컴포넌트(`resume-entries.tsx`·`project-list.tsx`·`publication-list.tsx`)로 분리해 `<Suspense>`로 감쌌다. **Task 033에서 확인**: 개발 서버와 `next start` 프로덕션 빌드 모두에서 관리자 저장·이동·숨김이 `/career`·홈·`/projects`·`/publications` 방문자 화면에 즉시 반영됐다(`e2e/admin-resume.spec.ts` 9건). 정적 셸에 포함된 캐시 결과도 `updateTag`로 무효화되므로 `connection()` 분리는 필요 없었다. 운영(`https://hkoikoi.dev`) 반영은 `main` 배포 후에만 확인할 수 있어 **미확인**이다
  - [x] 전환 뒤 `data/`의 이력·프로젝트·논문 파일과 `data/data.test.ts`의 해당 검사를 제거(시드 검증 테스트로 대체), `knip`·`project-structure.md`·CLAUDE.md 갱신
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 전환 전후 8개 페이지·메인 대표 프로젝트 → 항목 수·제목·순서 동일(전환 전 스냅샷과 비교)
    - 정상: 터미널 → `npx playwright test e2e/static-pages.spec.ts e2e/visitor-flow.spec.ts` → DB 기준으로 갱신한 뒤 통과
    - 오류: 셸 env로 잘못된 Supabase URL(수동 확인) → 각 페이지 빈 안내, 오류 화면 없음
    - 오류: Supabase MCP(읽기 전용, rollback) → anon으로 `is_visible = false` 행 select → 0행, insert → RLS 거부
    - 엣지: Supabase MCP(읽기 전용, rollback) → `user_metadata.role='admin'` 위조 authenticated insert → 거부
    - 엣지: 터미널 → placeholder env로 `npm run build`(CI 조건) → 성공
  - 테스트 결과(2026-11-11, 로컬, 운영 미반영):
    - `npm run check`(Vitest 574개)·`npm run knip` 통과(knip은 `@testing-library/user-event`의 `ignoreDependencies` 정리 안내 1건만, 이번 변경과 무관)
    - 실제 env `npm run build` 성공, 8개 페이지와 홈 ◐(`Revalidate 1d`, `Expire 1w`). placeholder env(`https://example.supabase.co`, CI 값) `npm run build` 성공(조회 실패는 로그만 남기고 빈 목록). Suspense로 분리하기 전에는 이 빌드가 실패했다
    - 정상: 프로덕션 서버(`next start`)에 HTTP 요청으로 스냅샷(`resume-snapshot.json`)과 비교 → 8개 페이지·홈 대표 프로젝트의 항목 수·제목·순서 동일, 학점·봉사 시간·TOEIC 점수·`tagGroups`·데모 링크 표시 확인. Playwright MCP 대신 HTTP 응답 비교로 확인했다
    - 정상: `npx playwright test e2e/static-pages.spec.ts e2e/visitor-flow.spec.ts` 9개 통과(`static-pages`는 data import 대신 시드 값 상수 사용)
    - 오류: placeholder 빌드를 그대로 `next start`(Supabase 호출이 모두 `fetch failed`) → 9개 화면 모두 200, 빈 안내 표시, 오류 화면 없음. 셸에 잘못된 URL을 따로 넣은 것이 아니라 빌드된 placeholder URL로 확인했다
    - 오류·엣지: Supabase MCP 롤백 DO 블록 → anon 숨김 행 0행·insert `42501`, `user_metadata` 위조 insert `42501`·update/delete 0행, `app_metadata` admin 허용(3개 테이블 모두, 종료 뒤 행 수 0)
    - 엣지(Task 033에서 확인): 항목 0건일 때 빈 안내는 어학 섹션의 유일한 항목을 숨겨 확인했고(곧바로 복구), 숨김 처리(`is_visible = false`) 항목이 공개 화면에서 빠지고 관리자 목록에는 남는 것도 `e2e/admin-resume.spec.ts`로 확인했다
    - 제한 사항: 운영 반영(`main` 머지·배포 후 실제 화면)과 정적 셸 무효화는 확인하지 않았다. `static-pages` e2e는 시드 어학 항목 값에 의존한다

- **Task 033: 정적 섹션 관리자 편집 UI 구축** ✅ - 완료 2026-11-11 (운영 반영, 모바일·다크 모드, 태그·태그 그룹 입력의 화면 확인은 미확인 — `테스트 결과`의 제한 사항 참고)
  - 관련 기능: F025(제안), F012
  - 목표: 관리자가 이력·프로젝트·논문 항목을 추가·수정·삭제·정렬·숨김 처리하고 공개 화면에 즉시 반영한다
  - 의존성: Task 032
  - 관련 파일: `app/admin/{resume,projects,publications}/**`(신규), `app/admin/_components/admin-nav.tsx`, `lib/schemas/{resume,project,publication}.ts`(+test), `lib/queries/admin-resume.ts`, `e2e/admin-resume.spec.ts`(신규)
  - 수락 기준: 관리자 메뉴에서 각 섹션 목록·편집 화면으로 들어가 항목을 CRUD하고 순서를 바꿀 수 있으며, 저장 즉시(운영 포함) 공개 페이지에 반영. 모든 페이지와 Server Action이 `requireAdmin()`을 직접 호출. 검증 실패는 필드 옆 오류로 표시하고 입력값 유지
  - [x] 라우트: `/admin/resume/[section]`, `/admin/projects`, `/admin/publications`와 각 `new`·`[id]/edit`. 라우트 맵 표와 `AdminNav` 갱신(구현 메모: 이력 섹션 전환은 라우트가 바뀌므로 `Tabs` 컴포넌트 대신 `aria-current` 링크 `nav`로 구현했고, `AdminNav`는 이력을 한 링크로 두고 메뉴가 넘치면 가로 스크롤한다. 서버→클라이언트 컴포넌트로는 함수 prop을 넘길 수 없어 목록의 수정 링크는 `editBasePath` 문자열로 받는다)
  - [x] zod 스키마(길이·링크는 `https://`만·태그/스택 최대 개수, DB check와 같은 한도) + 단위 테스트, Server Action(`requireAdmin()` → 검증 → 쓰기 → 영향 행 확인 → `updateTag`로 해당 태그 만료, `/admin/*`만 `revalidatePath`)
  - [x] 정렬: 위/아래 이동 버튼(버튼 `aria-label`, 첫·끝 항목은 `disabled`, 드래그앤드롭은 만들지 않음), `sort_order` 재계산은 RPC 한 번에(중간 상태 노출 방지). 마이그레이션 `20261111052304_reorder_resume_items` 적용, `rls-verification.md` 점검 F
    - **결정(2026-11-11, 사용자)**: (1) 이력·프로젝트 이동은 **RPC 방식**: `reorder_resume_entries(p_section, p_ids)`·`reorder_projects(p_ids)`(`security invoker`)가 `sort_order`를 10 단위로 한 번에 재배치한다(마이그레이션은 별도 Task). (2) 논문은 공개 화면이 연도 내림차순이므로 **이동 버튼과 `movePublication` 액션을 만들지 않고** 관리자 목록에 안내 문구만 둔다. 관리자 논문 목록은 공개 화면과 같은 `year desc → sort_order → id` 순이다
  - [x] 폼은 글 편집기와 같은 Server Action + `useActionState` 패턴(`react-hook-form` 없이), 삭제 확인 `Dialog`, 숨김(`is_visible`) 토글
  - 테스트 체크리스트:
    - 정상: Playwright MCP → 관리자로 경력 항목(`e2e-` 접두) 추가 → 비로그인 `/career` 새로고침 → 즉시 표시(운영에서도 확인)
    - 정상: Playwright MCP → 항목 위로 이동 → 공개 페이지 순서 반영
    - 정상: Playwright MCP → 프로젝트 `featured` 지정 → 메인 대표 프로젝트 반영
    - 오류: Playwright MCP → 제목 비움·`javascript:` 링크 → 필드 오류, 저장 안 됨
    - 오류: 터미널 → 비로그인 상태로 Server Action 재전송(curl) → `/auth/login` 리다이렉트, DB 변경 없음
    - 엣지: Playwright MCP → 숨김 토글 → 공개 페이지에서 사라지고 관리자 목록에는 남음
    - 엣지: Playwright MCP → 섹션 항목 0건 → 공개 페이지 빈 안내
  - 테스트 결과: (2026-11-11, 개발 서버와 `main PRODUCTION` Supabase 프로젝트 기준. 체크리스트의 Playwright MCP 대신 `e2e/admin-resume.spec.ts`와 SQL로 확인했다)
    - 품질 게이트: `npm run check` 통과(70개 파일 703건), `npm run knip` 새 경고 없음(기존 `@testing-library/user-event` 힌트만 남음), 실제 env `npm run build` 성공(새 관리자 라우트 모두 ◐, `/career`·홈도 ◐), placeholder env(`https://example.supabase.co`, CI 값) `npm run build` 성공(조회 실패는 로그만 남기고 빈 목록)
    - 단위 테스트: 스키마 3종(경계값 200/201 등, `javascript:`·`http:`·대소문자 `HTTPS://` 거부), 관리자 조회 6종, Server Action 3종(`requireAdmin` 거부 시 DB 미호출, 검증 실패 시 쓰기 없음, 영향 행 0, 태그 만료 호출, DB 오류 원문 비노출), `moveInList`, 메뉴 현재 경로 판별
    - 정상: `npx playwright test e2e/admin-resume.spec.ts` 9건 통과를 개발 서버와 `npm run build` + `npm run start`(프로덕션 모드) 각각에서 확인. 경력 항목(`e2e-` 접두) 추가 → 비로그인 `/career` 새로고침에 즉시 표시, 위로 이동 → 공개 순서 반영, 프로젝트 `featured` 지정 후 맨 위로 이동 → 홈 대표 프로젝트와 `/projects`에 표시(대표가 이미 3개라 이동 없이는 홈에 나오지 않음), 논문 추가 → `/publications` 표시와 이동 버튼 없음
    - 오류: 빈 제목(`제목: 필수 항목입니다.`)·`javascript:` 링크(`https://` 안내)·연도 `20a4` → 필드 옆 오류, 저장 안 됨, 입력값 유지, 링크 입력에 `aria-invalid="true"`
    - 오류: 관리자 화면에서 숨김 토글 액션 ID를 가로채 쿠키 없는 컨텍스트로 `/admin/resume/career`와 `/`에 재전송 → 항목이 계속 공개이고 DB 변경 없음(curl 대신 Playwright `request`로 보냈다)
    - 엣지: 숨김 토글 → 공개에서 사라지고 관리자 목록에는 `숨김` 배지로 남음, 다시 공개하면 복귀. 어학 섹션의 유일한 항목을 숨기면 공개 화면에 `아직 등록된 항목이 없습니다`, 복구 뒤 다시 표시
    - DB: 순서 변경 RPC는 롤백 DO 블록으로 anon `42501`, `user_metadata` 위조 `22023`(순서 불변), 관리자 성공과 순서 반영, 목록 누락·중복·빈 배열·다른 테이블 id 거부를 확인하고 `get_advisors`에 새 경고가 없었다(`rls-verification.md` 점검 F). 스펙 실행 전후 SQL로 이력 9건·프로젝트 4건·논문 3건, 전부 공개, `e2e-` 항목 0건임을 확인했다
    - 제한 사항·미확인: (1) 운영(`https://hkoikoi.dev`) 반영은 `main` 배포 후에만 확인할 수 있어 확인하지 않았다. (2) 모바일 폭과 다크 모드는 눈으로 확인하지 않았다(이력 목록 한 화면만 데스크톱 폭에서 직접 봤다). (3) 태그·기술 스택 그룹(`tag_groups`) 입력과 수정 폼의 저장은 단위 테스트로만 확인했고 e2e는 이 필드를 채우지 않는다. (4) 비로그인 재전송은 DB 불변만 단언하고 두 경로의 응답 상태 코드는 확인하지 않았다. (5) 새 항목의 `sort_order`는 읽기-삽입이라 동시 저장 시 같은 값이 될 수 있다(관리자 1인이라 수용, 다음 이동 RPC가 10 단위로 다시 매긴다). (6) 이동하면 섹션 전체 행의 `updated_at`이 함께 갱신되고, e2e의 프로젝트 이동으로 기존 프로젝트의 `sort_order` 값이 한 번 바뀌었다(상대 순서는 그대로). (7) `/admin/resume`(섹션 없는 경로)는 라우트가 없어 404이고 메뉴는 `/admin/resume/education`으로 연결한다. (8) 섹션 0건 e2e와 모든 e2e는 운영과 같은 DB를 쓰므로 어학 항목이 몇 초 숨겨진다(`finally`로 복구). (9) `e2e/admin-resume.spec.ts`는 관리자 계정이 필요해 CI에서는 실행하지 않는다

- **Task 045: 글 본문 `##`·`###`·`####` 제목 색상 체계 구축** ✅ - 완료 2026-11-11 (운영 반영은 미확인 — `테스트 결과`의 제한 사항 참고) (번호는 Phase 7(035~044) 뒤에 이어 붙였고, 순서상 Task 034 앞에서 진행한다)
  - 관련 기능: F026(제안: 글 본문 제목 색상), F006
  - 목표: 글 본문의 `##`(h2)·`###`(h3)·`####`(h4) 제목 색을 사이트 브랜드 색(`--primary`) 하나에서 농도만 달리해 CSS 한 곳에서 정한다. 글마다 `<span style="color: …">`를 넣는 방식과 카테고리마다 다른 색은 쓰지 않는다
  - 현재 상태(2026-11-09 DB 조회): 글 11편(`Mac mini 홈 서버 구축기` 7편, `코딩 테스트` 4편) 중 9편의 `##` 제목 52곳에 인라인 `<span style="color: …">`가 있었고 색은 카테고리마다 달랐다(구축기 6편 35곳 `#55DBDD`, 코딩 테스트 3편 17곳 `#ED7053`). 같은 날 사용자 요청으로 SQL로 모두 제거해 지금은 어떤 글에도 `<span`이 없고 제목 색도 없다(CSS 적용 전). `###`는 구축기 6편, `####`는 구축기 1편에 있고 색이 없다. `app/globals.css`의 `.post-content`에는 제목 색 규칙이 없고 `h1~h6 > code`의 색만 `inherit`로 지정돼 있다. 위 두 색은 브랜드 색이 아니다
  - 결정 기록(사용자 결정, 2026-11-09): 기존 색을 이어 가지 않고 새로 정한다. 색은 브랜드 토큰 `--primary`에서 가져오고 `##`·`###`·`####`의 농도를 다르게 한다. 카테고리별 색 맵은 두지 않는다(코드 변경은 CSS와 미리보기 한 곳뿐). **단계별 농도 값은 사용자 결정 필요**(아래 기본안)
  - 브랜드 색: `:root`는 `--primary: oklch(0.56 0.1404 32.0718)`, `.dark`는 `oklch(0.6995 0.1404 32.0718)`로 같은 색상·채도에 밝기만 다르다. 토큰이 테마에 따라 바뀌므로 제목 색도 라이트·다크 값을 따로 쓰지 않는다
  - 농도 기본안: `--primary`를 `--foreground`와 섞어 만든다. `##` = `--primary` 100%, `###` = 80%, `####` = 60%(`color-mix(in oklab, var(--primary) 80%, var(--foreground))` 형태). 같은 색 계열에서 단계가 내려갈수록 중립 색에 가까워진다. 아래 대비는 oklab 보간과 선형 sRGB 휘도로 계산한 값이라 실제 브라우저 계산 색과 조금 다를 수 있다
    - 라이트(배경 `--background` 기준): `##` 4.66:1, `###` 6.15:1, `####` 8.14:1
    - 다크: `##` 6.17:1, `###` 7.62:1, `####` 9.32:1
    - 본문 글자색(`--foreground`)은 라이트 16.32:1, 다크 16.03:1이라 `##`도 본문보다 뚜렷이 옅다
  - 방식: `app/globals.css`에 `.post-content :is(h2, h3, h4)` 규칙과 단계별 색을 CSS 변수(`--post-h2`·`--post-h3`·`--post-h4`)로 정의한다. Tailwind `prose`의 제목 색(`--tw-prose-headings`, 다크는 `--tw-prose-invert-headings`)보다 우선해야 한다
  - 의존성: 없음. 스키마 변경 없음
  - 관련 파일: `app/globals.css`, `app/admin/posts/_components/markdown-preview.tsx`(Shadow DOM 미리보기), `docs/guides/styling-guide.md`
  - 수락 기준: 상세와 편집기 미리보기에서 본문 `##`·`###`·`####`가 모두 `--primary` 계열 색으로 표시되고 `##`가 가장 진하며 단계가 내려갈수록 옅어짐. 라이트·다크 모두 배경 대비 4.5:1 이상. 기존 글의 `##` 인라인 색이 제거돼 모든 글이 같은 색 체계를 따름. `h1`·`h5` 이하와 제목 안 인라인 코드(`> code`의 `color: inherit`)는 기존대로
  - [x] 농도 값 결정(사용자가 기본안 100/80/60% 확정, 2026-11-11): 기본안(100/80/60%)을 실제 화면에서 보고 단계 구분이 충분한지 확인한 뒤 확정. 구분이 약하면 `####`를 40~50%로 낮추거나 크기·굵기로 보완(대비는 모두 4.5:1 이상 유지)
  - [x] `globals.css`: 단계별 변수와 `.post-content :is(h2, h3, h4)` 규칙 추가. `prose`·`dark:prose-invert` 조합에서도 유지되는지 확인
  - [x] 적용 범위: 규칙은 반드시 `.post-content` 아래로 한정한다(`MarkdownContent`가 붙이는 래퍼이고 블로그 글 상세와 편집기 미리보기에서만 쓰임). 그냥 `h2`·`h3`·`h4`에 걸면 홈·이력·블로그 목록 카드·관리자 UI 제목까지 바뀐다
  - [x] 편집기 미리보기: 미리보기는 문서 스타일시트를 shadow root에 복제하므로(`:root`→`:host` 치환) `globals.css`의 `.post-content` 규칙이 그대로 적용된다. 미리보기 코드는 수정하지 않았다(2026-11-11 실측으로 확인, 앞서 "규칙이 통과하지 않는다"고 적은 서술은 사실과 달라 정정). 관리자 UI 자체의 색이 바뀌지 않는지(격리 유지) 확인
  - [x] 기존 글 정리(완료 2026-11-09, 사용자 요청): 인라인 `<span>`이 CSS보다 우선해 예전 색(`#55DBDD`·`#ED7053`)이 남으므로 SQL로 제목 줄의 `## <span style="color: …">제목</span>`을 `## 제목`으로 바꿨다. 대상은 9편·52곳(구축기 35, 코딩 테스트 17)이었고 모두 한 줄 형태였으며 `##` 밖의 span은 없었다. 적용 뒤 9편 모두 `<span`이 0개인 것을 확인했다. CSS보다 먼저 진행해서 CSS를 구현하기 전까지 제목 색이 없다. 원래 색은 카테고리마다 하나였다(위 색)
  - [ ] 정리 뒤 반영: SQL 수정은 캐시를 만료시키지 않으므로 글마다 관리자 화면에서 저장하거나 재배포한다(`invalidatePostTags`는 Server Action에서만 호출됨). 운영 화면 반영은 확인하지 않았다
  - [x] 앞으로 제목에는 `<span>` 색을 넣지 않는다는 작성 규칙을 `styling-guide.md`에 기록(`docs/blog/` 원고 폴더는 2026-11-09 확인 시 비어 있어 정리할 원고는 없었다)
  - [x] `styling-guide.md`에 제목 색 체계(`--primary` 기반 3단계, 값, 대비)를 기록
  - 테스트 체크리스트:
    - 정상: Playwright MCP → `###`·`####`가 있는 구축기 글 상세 → `h2`·`h3`·`h4`의 계산된 `color`가 서로 다르고 `h2`가 가장 진함(`browser_evaluate`로 `getComputedStyle`), 코딩 테스트 글의 `h2`도 같은 색
    - 정상: Playwright MCP → 다크 테마 전환 → 세 단계 모두 다크 `--primary` 계열, 배경 대비 4.5:1 이상
    - 정상: 터미널 → SQL 정리 뒤 `select count(*) from posts where content ~ '(^|\n)#{2,4} <span'` → 0
    - 오류: Playwright MCP → 본문에 `### <span style="color: red">제목</span>`를 직접 넣은 글(시드 `e2e-h3-`) → 글자는 빨간색(인라인 우선, 정리 대상은 기존 글뿐이라 새로 쓰면 수동 지정 가능)
    - 엣지: Playwright MCP → 관리자 편집기 미리보기에 `##`·`###`·`####` 입력 → 상세와 같은 색, 편집기 UI 색은 변하지 않음
    - 엣지: Playwright MCP → `### \`code\`` 형태 → 인라인 코드 글자색은 기존대로 주변을 따름
    - 엣지: 터미널 → `npm run check && npm run knip` → 종료 코드 0
  - 테스트 결과(2026-11-11, 개발 서버 `localhost:3000`, 운영 DB 읽기만 사용):
    - 정상(수행): 구축기 1편 상세 `h2`·`h3`·`h4` 계산 색이 서로 다름. 코딩 테스트 글 `h2`도 같은 색(라이트 `lab(47.7022 42.4679 33.0503)`, 다크 `lab(63.9147 42.0659 31.7183)`)
    - 정상(수행): 대비를 canvas로 sRGB 변환해 계산 — 라이트 `##` 4.66 / `###` 6.15 / `####` 8.12, 다크 6.16 / 7.63 / 9.34(모두 4.5 이상). 예측값(라이트 8.14, 다크 6.17·7.62·9.32)과 소수 둘째 자리 이내
    - 정상(수행): `select count(*) from posts where content ~ '(^|\n)#{2,4} <span'` → 0
    - 오류(수행, 방법 변경): 운영 DB에 `e2e-h3-` 시드를 만들지 않고 편집기 미리보기에 `### <span style="color: #ff0000">`를 입력 → 라이트·다크 모두 `rgb(255, 0, 0)`로 인라인 색이 우선. span `style`은 `#hex`만 통과하며 `rgb(...)`는 sanitize가 제거한다(처음 `rgb()`로 시도해 확인)
    - 엣지(수행): 미리보기 `##`·`###`·`####` 색이 상세와 같고(라이트·다크), 편집기 UI 제목(shadow 밖 H1·H2)은 `--foreground` 색 그대로
    - 엣지(수행): `### \`code\`` 인라인 코드 색이 제목 색을 따름(`color: inherit`)
    - 엣지(수행): `npm run check`(단위 테스트 70파일 703건 포함)·`npm run knip` 종료 코드 0. knip이 `@testing-library/user-event`를 `ignoreDependencies`에서 지우라는 설정 힌트를 낸다(기존 항목, 이번 변경과 무관, 미처리)
    - 미수행·미확인: (1) 운영(`https://hkoikoi.dev`) 반영. 글 재저장 또는 재배포가 필요하고 확인하지 않았다. (2) 단계 구분을 사람 눈으로 본 판단은 사용자 확정에 의존했다. (3) 모바일 폭. (4) 비교한 글은 구축기 1편과 코딩 테스트 1편뿐이다. (5) 라이트에서는 `####`가 `##`보다 어둡고 다크에서는 밝다(채도는 `##`가 가장 높다)

- **Task 046: 편집기 모바일 탭 tabpanel·aria-controls 연결** ✅ - 완료 2026-11-11 (운영 반영은 미확인 — `테스트 결과`의 제한 사항 참고) (번호는 Task 045 뒤에 이어 붙였고, 순서상 Task 034 앞에서 진행한다)
  - 관련 기능: F006
  - 목표: 편집기 모바일 탭(작성/미리보기)이 WAI-ARIA 탭 패턴을 따르도록 `role="tabpanel"`과 탭의 `aria-controls`를 연결한다
  - 기존 상태(Task 021 검증, 2026-11-09): 모바일 탭에 `role="tabpanel"`이 0개이고 `TabsTrigger`에 `aria-controls`가 없었다. 편집기가 두 패널을 항상 마운트해 입력값을 유지하는 설계라 `TabsContent`로 바로 바꿀 수 없다
  - 구현 방식: 수동 ARIA. `TabsTrigger`에 `id`(`editor-tab-write`·`editor-tab-preview`)와 `aria-controls`(`editor-panel-write`·`editor-panel-preview`)를 넘기고, 본문 입력 div와 미리보기 section에 `role="tabpanel"`·`id`·`aria-labelledby`를 달았다. Base UI `TabsTab`은 기본 props 뒤에 사용자 props를 합쳐 넘긴 `id`·`aria-controls`가 자동 부여값보다 우선한다(소스로 확인). 두 패널은 계속 CSS hidden으로만 숨겨 상시 마운트하고 `components/ui/tabs.tsx`는 수정하지 않았다
  - 부수 변경: 미리보기 section의 `aria-label`을 `aria-labelledby`로 바꾸면서 role이 `region`에서 `tabpanel`로 바뀌어, `admin-preview`·`admin-image-upload` e2e의 locator를 `getByRole("tabpanel", { name: "미리보기" })`로 고쳤다(접근 가능한 이름은 그대로)
  - 알려진 한계: (1) lg 이상에서는 탭이 숨지지만 `role="tabpanel"`은 남는다. (2) `PostMetaFields`는 2열 grid 레이아웃을 지키려고 tabpanel 밖에 둬서 모바일 "작성" 탭의 패널이 메타 필드를 포함하지 않는다
  - 의존성: 없음. 스키마 변경 없음
  - 관련 파일: `app/admin/posts/_components/post-editor.tsx`, `components/ui/tabs.tsx`, `e2e/a11y.spec.ts`
  - 수락 기준: 모바일 폭에서 탭마다 `aria-controls`가 실제 `tabpanel` id를 가리키고 `tabpanel`이 2개이며, 탭 전환 뒤에도 입력값이 유지됨
  - 테스트 결과(2026-11-11, 개발 서버 `localhost:3000`, 관리자 세션, DB 쓰기 없음):
    - 정상(수행): `e2e/a11y.spec.ts` 신규 시나리오(390x844, `/admin/posts/new`) → 탭마다 `aria-controls` 대상이 존재하고 `role=tabpanel`, `[role="tabpanel"]` 총 2개, 본문 입력 후 미리보기·작성 탭을 오가도 값 유지. `a11y.spec.ts` 11건 통과
    - 오류(수행): `post-editor.tsx`를 변경 전으로 되돌리면 신규 시나리오가 `aria-controls` 누락으로 실패함을 확인한 뒤 복원
    - 엣지(수행): `e2e/admin-preview.spec.ts` 6건 통과(375px 탭 전환 입력 유지 포함)
    - 엣지(수행): `npm run check`(typecheck·lint·format:check·단위 테스트 70파일 703건) 종료 코드 0
    - 미수행·미확인: (1) `e2e/admin-image-upload.spec.ts`는 locator만 바꿨고 실행하지 않았다(테스트 이미지가 스토리지에 남는다). (2) lg 폭 레이아웃(2열·70vh)을 눈으로 확인하지 않았다. (3) 스크린 리더로 읽은 결과는 확인하지 않았다. (4) `build`·`knip`은 라우트·의존성 변경이 없어 돌리지 않았다. (5) 운영(`https://hkoikoi.dev`) 반영은 확인하지 않았다

- **Task 034: Post-MVP 통합 회귀 테스트 및 배포 검증**
  - 관련 기능: F015~F026(제안), F001~F014 회귀
  - 목표: Post-MVP 묶음을 운영에 내기 전에 회귀와 운영 반영을 확인한다(권장: 탐색 묶음 022~026 완료 때 1회, 전체 완료 때 1회)
  - 의존성: 검증 대상 Task 완료
  - 관련 파일: `e2e/**`, `.github/workflows/ci.yml`, `README.md`, `docs/guides/project-structure.md`, `CLAUDE.md`
  - 수락 기준: `npm run check`·실제 env `npm run build`·`npm run knip`·전체 e2e 통과, 운영에서 새 기능의 정상·오류 시나리오 확인, 문서가 실제 구조와 일치, PRD 반영 대상 기능 ID 목록이 정리됨
  - [ ] 전체 e2e(세션 재사용 또는 분할 실행), 시크릿 없는 비로그인 시나리오(필터·검색·페이지·RSS)의 CI `e2e-smoke` 편입 검토
  - [ ] 운영 확인: 필터·검색·페이지·이전/다음 글·RSS·조회수·댓글 각각 정상 1건 이상, 글 발행·삭제 직후 반영
  - [ ] 운영 Lighthouse 모바일(`/`, `/blog`, 상세) 성능·접근성 90 이상
  - [ ] `project-structure.md`·CLAUDE.md·README 갱신, PRD에 F015~F025를 반영할지 사용자에게 확인하고 `prd-validator` 점검 안내
  - [ ] Supabase advisor 최종 확인, 새 테이블·정책 RLS 읽기 전용 점검
  - 테스트 체크리스트:
    - 정상: 터미널 → `npm run check && npm run knip` → 종료 코드 0
    - 정상: Playwright MCP → 운영 방문자 여정(메인 → 블로그 필터 → 검색 → 2페이지 → 상세 → 다음 글 → RSS 링크) → 콘솔 오류 0건(`browser_console_messages`)
    - 오류: Playwright MCP → 운영 비로그인 `/admin/storage`·`/admin/resume/career` → `/auth/login`
    - 엣지: Playwright MCP → 운영에서 글 발행·삭제 직후 `/blog` 필터 목록·검색 결과·RSS·sitemap·홈 반영
  - 테스트 결과: (미수행)

### Phase 7: 홈 서버 이전·자동 배포 ✅

> 운영을 Vercel에서 Mac mini 홈 서버로 옮기고, `main` push 때 CI 통과 후 self-hosted runner로 자동 배포한다(2026-11-07). 구조와 절차는 `docs/guides/self-hosting.md`, 템플릿은 `deploy/`다. 이 Phase는 인프라 작업이라 기능 ID(F-)가 없고 앱 코드는 바꾸지 않았다. Task 번호 035~044는 작업 순서이며 각 Task의 의존성은 앞 번호다.

#### Phase 7 공통 전제

- **서버 접속**: 작업 PC에서 `ssh homeserver`(별칭)로 접속한다. 서버의 `.env.local` 값은 읽지 않고 키 이름과 권한만 점검한다.
- **정식 호스트는 apex(`hkoikoi.dev`)**: 기본안은 `www`였으나 사용자가 apex로 정했다(2026-11-07). `www`는 apex로 308 리다이렉트하고 `NEXT_PUBLIC_SITE_URL=https://hkoikoi.dev`다. Task 020~021의 "운영 도메인은 `www.hkoikoi.dev`가 기본" 기록은 이전 전(Vercel) 상태다.
- **운영 영향**: 계획은 도메인 전환(Task 043)이 마지막이라 서버 작업이 운영에 영향이 없다고 가정했으나, 실제로는 작업 중에 apex가 이미 홈 서버를 가리키고 있었다(Cloudflare 터널 경유, 응답 헤더 `via: 1.1 Caddy`). 그래서 Task 038~042의 서버 재시작은 운영에 닿았다. 이후에도 `main` 머지는 곧 운영 배포다.
- **확인하지 않은 것은 체크하지 않는다**: 아래 `테스트 결과`와 `확인하지 못한 것`을 그대로 따른다.

- **Task 035: 서버 선행 점검과 도메인 방침 확정**
  - 관련 기능: 없음(인프라)
  - 목표: 배포 전제 조건(자동 로그인, Node, 디렉터리, 환경 변수 파일)을 갖추고 정식 호스트를 정한다
  - 의존성: 없음
  - 관련 파일: (서버 작업. 저장소 변경 없음)
  - 수락 기준: 재부팅 후 비밀번호 없이 사용자 세션으로 로그인, `node -v`가 `.nvmrc` 메이저와 일치, `~/apps/releases`·`~/apps/shared`·`~/logs` 존재, `.env.local` 권한 600, 정식 호스트 결정 기록
  - [x] 자동 로그인 설정과 재부팅 검증
  - [x] `git`, `node@24` 설치·링크(`.nvmrc` 24 일치)
  - [x] 디렉터리 생성, `.env.local` 사용자가 직접 작성(권한 600)
  - [x] 정식 호스트 확정: apex
  - 테스트 결과: 2026-11-07 재부팅 41초 뒤 비밀번호 없이 `/dev/console` 소유자가 서버 사용자가 됨(`/etc/kcpassword` 존재). `sysadminctl -autologin set`은 `SACSetAutoLoginPassword error:22`로 실패해 `/etc/kcpassword`가 생기지 않았고 `autoLoginUser` 값만 남아 있었다(설정 값만 보면 켜진 것처럼 보이는 함정). 자동 로그인을 설정한 뒤 재부팅으로 확인했다. brew `node`가 26.13이라 `node@24`(v24.22.2)를 링크했다. `.env.local`은 권한 600, 키 3개와 `NEXT_PUBLIC_SITE_URL=https://hkoikoi.dev`를 값 노출 없이 확인했다.

- **Task 036: 배포 템플릿 작성(deploy.sh, launchd plist, Caddyfile)**
  - 관련 기능: 없음(인프라)
  - 목표: 서버 설정을 재현 가능하게 하는 템플릿 3종을 `deploy/` 아래에 둔다
  - 의존성: Task 035
  - 관련 파일: `deploy/deploy.sh`, `deploy/launchd/dev.hkoikoi.web.plist`, `deploy/caddy/Caddyfile`
  - 수락 기준: `npm run check` 통과, 시크릿·실제 사용자명 없음, `bash -n`·`plutil -lint`·`caddy validate` 통과, 롤백·정리 분기 존재
  - [x] `deploy.sh`: `git archive` 릴리스, `.env.local` 링크, `npm ci`·`build`, `mv -fh` 링크 교체, `launchctl kickstart -k`, 헬스체크, 실패 시 롤백, 최근 5개 유지
  - [x] launchd plist(`__HOME__` 플레이스홀더, KeepAlive, 로그), Caddyfile(정식 호스트 프록시, 그 외 308)
  - 테스트 결과: 2026-11-07 PR #41 병합. `bash -n`(작업 PC와 서버 bash 3.2), `shellcheck`(0.11.0) 경고 0, `plutil -lint`, 서버 `caddy validate`·`caddy fmt`, `npm run check`(Vitest 32 파일 / 254개) 통과, `deploy/`에 실제 사용자명·시크릿 없음. `encode`는 스트리밍 검증 전이라 켜지 않았다.

- **Task 037: Mac mini 수동 배포**
  - 관련 기능: 없음(인프라)
  - 목표: 자동화 전에 서버에서 한 번 끝까지 빌드·실행한다
  - 의존성: Task 035
  - 관련 파일: (서버 작업)
  - 수락 기준: 실제 env로 `npm run build` 성공과 빌드 표 기록, `/`·`/blog` 200, `127.0.0.1`에만 바인딩
  - [x] `main`(`8cb1f2d`) 클론, `.env.local` 링크, `npm ci`·`npm run build`
  - [x] `next start -H 127.0.0.1 -p 3000`, `curl` 확인, `lsof` 바인딩 확인
  - [ ] 홈 최신 글이 정적 셸에 굳지 않았는지(삭제 즉시 반영): 이 Task에서는 확인하지 않고 Task 039·043에서 확인
  - 테스트 결과: 2026-11-07 Node 24.22.2, 실제 env 빌드 성공. 빌드 표: 공개 페이지 대부분 `◐`(1d/1w), `/sitemap.xml` `ƒ`, `/robots.txt`·`/auth/login`·`/icon.svg` 등 `○`. 빌드 로그에 Supabase URL·키 패턴 0건. `/`·`/blog`·`/sitemap.xml`·`/robots.txt` 200, `/admin/posts` 307(`/auth/login`), `lsof`로 `127.0.0.1:3000`만 listen, 작업 PC에서 3000 접근 불가. sitemap·robots 절대 URL은 `https://hkoikoi.dev`.

- **Task 038: Caddy 리버스 프록시와 launchd 서비스 등록**
  - 관련 기능: 없음(인프라)
  - 목표: 템플릿을 서버에 설치해 서비스로 상시 실행한다
  - 의존성: Task 036, 037
  - 관련 파일: `deploy/caddy/Caddyfile`, `deploy/launchd/dev.hkoikoi.web.plist`
  - 수락 기준: `caddy validate` 통과, 서비스 running, 프로세스를 죽이면 자동 재시작, 8080에서 정식 호스트 200·그 외 308, 3000·8080 외부 접근 불가
  - [x] Caddyfile 설치·재시작(기존 임시 설정은 백업), plist 치환·`launchctl bootstrap`, `~/apps/current` 링크
  - [x] KeepAlive 재시작, 호스트별 응답, 외부 접근 차단
  - [x] 재부팅 후 앱·Caddy 자동 기동(Task 041의 재부팅에서 확인)
  - 테스트 결과: 2026-11-07 서비스 running, 프로세스를 kill하면 pid가 1818에서 1856으로 바뀌며 재시작, 8080 경유 `hkoikoi.dev` 200, `www.hkoikoi.dev`·`example.com` 308(경로·쿼리 유지), 작업 PC에서 3000·8080 접근 불가. 재부팅 후 자동 기동은 이 Task 시점에는 미확인이었고 Task 041에서 확인했다.

- **Task 039: 임시 호스트 검증과 Supabase Auth URL 확인**
  - 관련 기능: 없음(인프라)
  - 목표: 운영 도메인을 바꾸기 전에 터널 경유 경로를 임시 호스트로 end-to-end 검증한다
  - 의존성: Task 038
  - 관련 파일: (서버·대시보드 작업)
  - 수락 기준: 공개 페이지 200·콘솔 오류 0건, `/admin` 비로그인 리다이렉트, 발행·삭제 직후 공개 목록 반영, 스트리밍 비버퍼링 근거, Supabase Auth URL 값 기록
  - [x] 터널 라우트·Caddy 임시 허용(`home-test.hkoikoi.dev`), Playwright MCP 방문자 여정, 콘솔·이미지·리다이렉트
  - [x] 스트리밍 비버퍼링 확인(느린 스트림 임시 엔드포인트)
  - [x] 사용자가 로그인한 브라우저로 `e2e-` 글 발행·삭제 후 즉시 반영 확인, DB 정리 확인
  - [x] Supabase Auth URL 기록(Site URL·Redirect URLs)
  - [x] 임시 호스트 제거(서버 Caddyfile을 저장소 템플릿으로 복구, 터널 라우트·DNS 삭제)
  - 테스트 결과: 2026-11-07 공개 페이지 10개·sitemap·robots 200, 콘솔 오류 0건(preload 안내 경고 1건), `/admin/posts` → `/auth/login`, `next/image` Supabase 썸네일 4개 렌더링. 스트리밍은 서버 임시 Node 서버(1초 간격 5조각)를 Caddy 경로에 임시 연결해 Caddy·터널 양쪽에서 조각이 약 1초 간격으로 도착함을 확인했다(홈 같은 실제 페이지는 원본에서도 25ms 안에 끝나 타이밍으로 구분할 수 없었다). 임시 서버·라우트는 제거했다. `e2e-cache-check` 글 발행 시 홈·`/blog`·상세에 즉시 나타나고 삭제 시 즉시 사라졌으며(Task 020 sitemap, PR #39 홈 최신 글 선례 재현 안 됨) DB의 `e2e-` 행 0건. Supabase Auth URL(작업 당시): Site URL `https://www.hkoikoi.dev`, Redirect URLs `http://localhost:3000/**`·`https://www.hkoikoi.dev/**`. 앱은 `signInWithPassword`만 써서 영향이 없다. 이 Task에서 Caddy를 재시작하는 동안 apex가 이미 서비스 중이라 짧은 끊김이 있었다.

- **Task 040: `deploy.sh` 실행과 롤백 리허설**
  - 관련 기능: 없음(인프라)
  - 목표: 릴리스 폴더 방식 배포의 정상·실패 경로를 서버에서 실제로 실행해 검증한다
  - 의존성: Task 036, 039
  - 관련 파일: `deploy/deploy.sh`
  - 수락 기준: 정상 배포 시 `current` 교체·헬스체크 통과, 헬스체크 실패 시 이전 릴리스 복구·종료 코드 비정상, 빌드 실패 시 `current` 불변, 릴리스 정리가 현재·직전 보존
  - [x] 정상 배포, 롤백(헬스체크 대상 포트를 바꿔 유도, 2회), 빌드 실패(`npm ci` 실패 유도), 정리(`KEEP_RELEASES=2`와 가짜 릴리스 4개)
  - [ ] 롤백 중 운영 응답이 끊기지 않는지: 무중단이 아님(아래 결과), 간격이 길어 정확한 끊김 시간은 측정하지 못함
  - 테스트 결과: 2026-11-07 정상 배포 종료 코드 0·`current` 교체·헬스체크 1회 재시도 후 통과. 롤백은 종료 코드 1, `current`가 이전 릴리스로 복구, 서비스 200 유지. 빌드 실패는 종료 코드 1, `current` 불변, 미완성 폴더 삭제. 정리는 현재·직전 보존, 최신 2개 유지, 나머지만 삭제. 서비스 프로세스 cwd가 새 릴리스임을 `lsof`로 확인. 스크립트 결함은 없었다. 운영이 이미 서비스 중이라 리허설이 실제 영향을 줬고, 약 3초 간격 33회 기록에서 롤백 재시작 순간 502가 1회였다. 첫 롤백 실행의 응답 기록은 기록기 셸이 먼저 끝나 실패해 2차 실행에서 다시 측정했다. 리허설 잔여물은 정리했다.

- **Task 041: self-hosted runner 설치와 public 저장소 보안 설정**
  - 관련 기능: 없음(인프라)
  - 목표: 서버에 GitHub Actions runner를 설치하고 public 저장소에서 안전하게 쓰도록 설정한다
  - 의존성: Task 040
  - 관련 파일: (서버·GitHub 작업)
  - 수락 기준: runner가 `homeserver` 라벨로 Idle, 재부팅 후 로그인 없이 Idle 복귀, fork PR 승인 필수와 기본 권한 read 확인, runner 디렉터리에 시크릿 없음
  - [x] runner v2.338.2 설치(체크섬 대조), `~/actions-runners/hkoikoi-dev`에 라벨 `homeserver`·이름 `hkoikoi-dev`로 등록(토큰은 사용자가 서버에 직접 입력)
  - [x] `svc.sh install`·`start`, 재부팅 후 자동 기동
  - [x] fork PR 승인을 `all_external_contributors`로 변경(사용자 확인), 기본 권한 `read` 확인
  - [x] runner 작업 디렉터리 시크릿 점검
  - 테스트 결과: 2026-11-07 GitHub에서 runner `online`·`busy=false`. 재부팅 후 가동 2분 시점에 자동 로그인(`/dev/console` 소유자가 서버 사용자), runner가 Idle로 복귀하고 앱·Caddy·cloudflared도 자동 기동, 3000·8080·외부 apex 200(Task 038의 재부팅 후 기동 미확인 항목 해소). fork PR 승인은 `first_time_contributors`에서 `all_external_contributors`로 바꿨고 기본 권한은 이미 `read`, PR 자동 승인은 꺼져 있다. runner 디렉터리의 `.env`는 `LANG`뿐이고 앱 시크릿 없음, `_work` 비어 있음. 여러 프로젝트 runner가 같은 계정을 쓰면 서로의 파일을 읽을 수 있다는 점을 가이드에 적었다.

- **Task 042: `ci.yml`에 deploy job 추가**
  - 관련 기능: 없음(인프라)
  - 목표: `main` push 때 CI 통과 후 홈 서버로 자동 배포한다
  - 의존성: Task 041
  - 관련 파일: `.github/workflows/ci.yml`, `.github/actionlint.yaml`
  - 수락 기준: PR에서 deploy skipped, `main` 머지 후 `check`·`e2e-smoke` 통과 뒤 `deploy`가 runner에서 실행되고 `current`가 새 SHA로 교체·헬스체크 통과, 배포가 겹치지 않음, `npm run check` 통과
  - [x] deploy job(`needs`, `push to main` 조건, `deploy-prod` 그룹, `contents: read`), `main`에서 이전 실행을 취소하지 않도록 workflow `concurrency` 조정, actionlint 라벨 등록
  - [x] PR #42·#43에서 deploy skipped 확인, `main` 머지 후 실제 배포 확인
  - [ ] 연달아 두 번 push했을 때 deploy가 겹치지 않는지: 시험하지 않음(`deploy-prod` 그룹 설정으로만 보장)
  - 테스트 결과: 2026-11-07 `actionlint`·`format:check`·`npm run check`(254개) 통과. PR #42(`develop`)·#43(`develop`→`main`)에서 `check`·`e2e-smoke` 통과, `deploy` skipped. #43 병합 뒤 `main` 실행(run 42375484811)에서 `check`·`e2e-smoke`·`deploy` 모두 success, `deploy`가 runner `hkoikoi-dev`에서 약 23초에 끝나 `current`가 `54ce6cf`(`main` HEAD)로 바뀌고 서비스 cwd와 3000이 200, 직전 릴리스 보존. 배포 구간 10분 211회 응답 기록에서 비200 0건(샘플 간격 약 3초라 1~3초 재시작 끊김이 샘플 사이에 있었을 수 있음). 이 PR 병합으로 `deploy/`·CI·문서가 운영에 반영됐고 앱 코드는 바뀌지 않았다.

- **Task 043: 운영 도메인 확인과 운영 검증**
  - 관련 기능: 없음(인프라)
  - 목표: 정식 호스트(apex)가 홈 서버에서 서빙되는지, `www`가 apex로 리다이렉트되는지, 운영 시나리오가 정상인지 확인한다
  - 의존성: Task 042
  - 관련 파일: (Cloudflare·Supabase·Vercel 대시보드 작업)
  - 수락 기준: apex가 홈 서버에서 서빙(응답 헤더·로그), `www`→apex 308, sitemap·robots·og:image가 정식 호스트 절대 URL, 관리자 발행·삭제 직후 공개 화면 반영, 콘솔 오류 0건
  - [x] apex가 홈 서버에서 서빙되는지 확인(`via: 1.1 Caddy`), `www` 터널 라우트 추가(사용자) 후 308 확인
  - [x] 방문자 여정, `/admin` 비로그인 리다이렉트, 콘솔 오류 0건
  - [x] 사용자가 apex에서 로그인한 브라우저로 `e2e-prod-check` 글 발행·삭제 후 즉시 반영, DB 정리 확인
  - [x] Supabase Site URL을 `https://hkoikoi.dev`로 전환, Redirect URLs에 apex 추가(사용자가 대시보드에서 수행)
  - [ ] 전환 전 Vercel DNS 값 기록: 하지 못함. 작업 중에 apex가 이미 전환된 상태였다
  - [ ] Vercel 프로젝트 유지(롤백 경로): 하지 않음. 사용자가 이전 후 삭제했다(사용자 보고)
  - 테스트 결과: 2026-11-07 apex는 Cloudflare 프록시(터널) 뒤에서 홈 서버가 서빙(`via: 1.1 Caddy`, `x-powered-by: Next.js`)하고 `www`는 처음에 DNS 레코드가 없었다. 사용자가 `www` 터널 라우트를 추가한 뒤 `https://www…/blog?tag=a` → 308 `https://hkoikoi.dev/blog?tag=a`, `-L`로 200(작업 PC의 로컬 DNS 캐시 때문에 `--resolve`로 우회해 확인). sitemap URL 17개·robots `Sitemap:`·og:image 모두 `https://hkoikoi.dev`. 공개 15개 경로(+sitemap·robots·og 이미지) 200, 없는 경로 404, 비로그인 `/admin/posts` → `/auth/login`, 썸네일 4개 렌더링, 실제 페이지 이동 구간 콘솔 오류·경고 0건. `e2e-prod-check` 발행 직후 홈·`/blog`·상세·sitemap에 즉시 나타나고 삭제 직후 모두 즉시 사라졌으며 DB의 `e2e-` 행 0건(글 7개). Cloudflare가 프록시 응답의 `robots.txt` 앞에 AI 크롤러 차단 "Managed content"를 붙이는 것을 발견했고, 사용자 확인 결과 따로 켠 설정이 아니라 Cloudflare 기본값이었다. Supabase 대시보드 값은 MCP로 읽을 수 없어 사용자 보고를 따랐다.

- **Task 044: 배포 문서화와 ROADMAP 갱신**
  - 관련 기능: 없음(문서)
  - 목표: 홈 서버 배포를 문서로 남기고 프로젝트 문서를 사실에 맞게 고친다
  - 의존성: Task 043
  - 관련 파일: `docs/guides/self-hosting.md`, `docs/guides/project-structure.md`, `README.md`, `CLAUDE.md`, `docs/ROADMAP.md`
  - 수락 기준: `npm run check` 통과, 가이드를 따라 서버 설정이 재현됨(Task 035~042에서 수행한 절차와 일치), ROADMAP 체크박스는 실제 확인한 항목만 체크, `project-structure.md`가 `deploy/` 구조와 일치
  - [x] `self-hosting.md` 신규(아키텍처, 서버 초기 설정, 수동·자동 배포, 롤백, 장애 대응, 보안, 알려진 한계, 검증 기록)
  - [x] `project-structure.md`에 `deploy/`·CI deploy job 반영, README 배포 절차를 홈 서버 기준으로 갱신, `CLAUDE.md`에 배포 절 추가·CI 설명 수정
  - [x] 이 Phase 7 추가
  - [ ] 가이드를 처음부터 따라 새 서버를 재현해 보기: 하지 않음(수행한 절차를 문서화했을 뿐 재현 시험은 없음)
  - 테스트 결과: 2026-11-07 `npm run check`(typecheck·lint·prettier 통과, Vitest 32 파일 / 254개) 통과. 문서만 변경해 `npm run build`·`knip`·e2e는 실행하지 않았다. `project-structure.md`의 `deploy/` 구조는 저장소의 실제 파일(`deploy.sh`, `launchd/dev.hkoikoi.web.plist`, `caddy/Caddyfile`)과 대조했다. 가이드의 명령은 Task 035~043에서 서버에 실제로 실행한 것이고, 확인하지 못한 항목(수동 롤백 절차, 동시 push, 실제 정전 후 자동 복구, macOS 자동 업데이트의 자동 재시작)은 가이드에 그렇게 적었다. 정전 후 자동 시동 설정은 이후 서버의 `pmset -g`에서 `autorestart 1`로 확인했고(1편 설정), 실제로 전원을 끊어 복구되는지는 시험하지 않았다.
  - 후속 확인 필요: 블로그 구축기 1~3편은 글을 수정하지 않았다. 자동 로그인(재부팅 후 서비스 기동에 필요)과 정식 호스트가 apex로 정해진 점은 글에 반영되지 않았을 수 있어 사용자 확인이 필요하다.

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

MVP 전체 회귀·운영 배포 검증(F001~F014)은 Task 020, 이월된 잔여 검증은 Task 021이 맡는다.

### Post-MVP 기능 ID (제안, PRD 미반영)

아래 ID는 ROADMAP의 제안이다. PRD의 "MVP 이후 기능(제외)" 목록과 대응하며, PRD에 반영할 때 번호를 바꾸면 이 표와 Phase 6의 `관련 기능` 줄을 함께 고친다.

| 기능 ID | 기능명                              | PRD 대응 항목                       | 담당 Task |
| ------- | ----------------------------------- | ----------------------------------- | --------- |
| F015    | 블로그 상세 이전/다음 글 내비게이션 | (추가 요청)                         | 022       |
| F016    | 태그·카테고리 필터 탐색·태그 정렬   | (추가 요청, F005 확장)              | 023       |
| F017    | 블로그 목록 페이지네이션            | 페이지네이션                        | 024       |
| F018    | 블로그 키워드 검색                  | 검색                                | 025       |
| F019    | RSS 피드                            | RSS                                 | 026       |
| F020    | 편집기 임시저장 자동화              | 임시저장 자동화                     | 027       |
| F021    | `<style>` 글 단위 스코프 변환       | `<style>`의 글 단위 스코프 변환     | 028       |
| F022    | 스토리지 고아 이미지 정리           | 스토리지 고아 이미지 파일 정리      | 029       |
| F023    | 글 조회수                           | 조회수                              | 030       |
| F024    | 블로그 댓글                         | 댓글                                | 031       |
| F025    | 정적 섹션 DB 저장·관리자 편집       | 학력·경력 등 정적 섹션의 DB 저장... | 032, 033  |
| F026    | 글 본문 제목(`##`~`####`) 색상      | (추가 요청)                         | 045       |

## 의존성과 병렬 진행

- 순서 의존: 002 → 003 → 004 / 005 → 006 → 007·008·009 → 010 → 011 → 012·013 → 014 → 017 → 018 → 019 → 020
- 병렬 가능: Task 007·008·009(UI)는 서로 독립. Task 010(DB)·Task 015(마크다운)는 Phase 2와 병렬 진행 가능. Task 016은 015 이후, Task 017은 010·013 이후.
- UI와 백엔드 분리: Phase 2의 더미 데이터(`lib/dummy/posts.ts`)와 `lib/types/post.ts`가 계약 역할을 하며, Task 012에서 `lib/queries/posts.ts`로 교체한다.
- Post-MVP 순서 의존: 021 → (023 → 024 → 025) / 022 → 030 / 032 → 033 → 034. 블로그 목록은 **URL 상태·목록 쿼리(023) → 페이지네이션(024) → 검색 스키마·RPC(025)** 순서로 쌓는다.
- Post-MVP 병렬 가능: 022·023·026·027·028·029·031은 021 이후 서로 독립. 스키마를 바꾸는 Task(025·029·030·032)는 원격이 운영 프로젝트 하나뿐이라 마이그레이션 적용을 한 번에 하나씩 한다.

## 열린 질문과 기본 결정

PRD의 열린 질문은 아래 기본값으로 진행하고, 사용자 결정이 바뀌면 해당 Task를 갱신한다.

| 질문                                        | 기본 결정                                                       | 관련 Task |
| ------------------------------------------- | --------------------------------------------------------------- | --------- |
| 대표 프로젝트 3개 선정 기준                 | `Project.featured` 우선, 부족하면 배열 앞에서 채움              | 005, 007  |
| 블로그 기본 카테고리명 "일반" 유지 여부     | "일반" 유지(DB default·스키마 기본값 한 곳에서 상수로 관리)     | 010, 013  |
| 관리자 보조 진입 경로(푸터 등) 필요 여부    | MVP는 푸터 "관리" 링크와 `/auth/login` 직접 진입만 제공         | 004, 011  |
| 비밀번호 재설정 흐름 유지 여부(로드맵 추가) | 제거, 재설정은 Supabase 대시보드에서 수행                       | 002       |
| 편집기 미리보기 격리 방식(로드맵 추가)      | Shadow DOM 우선 검토, 제약 시 `iframe srcdoc`                   | 016       |
| (Post-MVP) 태그 정렬 기준                   | 숫자·기호 → 영문(대소문자 무시) → 한글(가나다) → 기타           | 023       |
| (Post-MVP) 다중 태그 필터                   | 미지원, 단일 태그 + 단일 카테고리 AND 유지                      | 023       |
| (Post-MVP) 검색 방식                        | `pg_trgm` + 검색 RPC, 검색 결과는 캐시하지 않음                 | 025       |
| (Post-MVP) 임시저장 자동화 범위             | 로컬 백업은 전부, 서버 자동 저장은 id가 있는 초안만             | 027       |
| (Post-MVP) 고아 이미지 삭제 권한 경로       | 관리자 전용 SELECT 정책 + Storage API 삭제(service role 미사용) | 029       |
| (Post-MVP) 댓글 방식                        | Giscus(GitHub Discussions), 시작 전 사용자 확인 필요            | 031       |
| (Post-MVP) 정적 섹션 DB 전환 범위           | 이력 6종·프로젝트·논문만, Profile은 `data/profile.ts` 유지      | 032       |

## 알려진 트레이드오프 (PRD 반영)

- `<style>` 허용으로 글 CSS가 해당 페이지 전체에 영향 가능(작성자 1인이라 수용, 선택자 접두 스코프 변환은 Task 028에서 구현). 편집기 미리보기만 격리(Task 016).
  - 2026-10-28 보완: `lib/markdown/rehype-sanitize-style.ts`가 sanitize 뒤 `<style>` 내용을 검사해 `.post-`·`#user-content-` 접두가 아닌 규칙, `@` 규칙(@import 포함), 중첩 규칙, 범위 이탈 선택자(`~`, `+`, `:has` 등), `url()`·`image-set()` 선언을 제거한다(단위 테스트 13개). `.post-` 요소 자체의 `position:fixed` 같은 속성은 막지 않으며 작성자 1인이라 수용한다.
- 보안 헤더(2026-10-28 결정): `next.config.ts`에 `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP(`object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`)를 둔다. nonce 기반 CSP는 전 페이지 동적 렌더링이 필요해 `cacheComponents`와 맞지 않고 `script-src 'unsafe-inline'`은 이득이 작으며, 본문이 임의 외부 이미지를 쓰므로 `script-src`·`style-src`·`img-src`는 두지 않는다. dev 서버 응답 헤더와 visitor-flow·admin-preview e2e 통과로 확인했다(KaTeX·next-themes 동작은 admin-preview 수식 렌더링 e2e로만 확인).
- 스타일 변조(`position:fixed` 오버레이, `url()` 외부 요청) 가능성은 관리자 계정 보호(강한 비밀번호·MFA)로 완화(Task 011).
- 없는 글은 soft 404(HTTP 200 + noindex)로 응답(Task 018).
- 관리자 role 회수 후에도 기존 JWT는 만료 전까지 유효(RLS 동일). 역할 변경 후 재로그인 필요(Task 011).
- 스토리지 고아 파일은 자동으로 지우지 않고 관리자가 `/admin/storage`에서 확인한 뒤 지운다(Task 029). 유예 7일 이내와 참조 중인 파일은 지울 수 없다. 초기 누적분은 유예가 지난 뒤(2026-11-12 이후) 사용자가 수동으로 정리한다.
- 로그인 시도 횟수 제한은 Supabase Auth 기본 레이트 리밋(`/auth/v1/token`, IP당 5분 150회·burst 30, 공식 문서 기준)에 의존하고 앱 코드의 제한·CAPTCHA는 없다(관리자 1인, 최소 비밀번호 12자·가입 차단으로 완화, 2026-10-28 사용자 결정으로 수용). 이 프로젝트의 실제 설정값은 2026-10-28 사용자가 대시보드 Authentication > Rate Limits에서 확인했다(가입·로그인 30, 토큰 150, 기본값에서 변경 없음). 서버에서 호출할 때 Supabase가 보는 IP도 미확인이다. Turnstile CAPTCHA는 `login` 액션에 `captchaToken` 전달이 필요하고 Password Verification Attempt hook은 Teams 이상 플랜 전용이라 도입하지 않았다.
- 관리자 레이아웃 헤더는 `AdminGuard` 바깥(정적 셸)에 둔다. 로그인한 비관리자에게 `notFound()` 전환 전 잠깐 보일 수 있으나 노출되는 것은 공개 상수와 링크뿐이고, 가드 안으로 옮기면 모든 `/admin` 진입에서 빈 화면이 생겨 현상 유지로 결정(2026-10-28 사용자 결정).
- Supabase advisor 보안 경고 `auth_leaked_password_protection`(유출 비밀번호 보호)은 Pro 플랜 전용이라 예외로 수용. 완화책: 회원가입 차단, 최소 비밀번호 12자, 대소문자·숫자·기호 필수(Task 010, 011).
- `hasEnvVars`(2026-10-28 결정): `lib/utils.ts`에서 `lib/supabase/proxy.ts`로 옮겨 그 파일의 지역 상수로 둔다(사용처가 proxy 하나뿐). `lib/env.ts` 통합은 하지 않는다. 브라우저 번들에서 쓰는 `process.env.NEXT_PUBLIC_*`는 리터럴로 읽어야 인라인되는데(`node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`), 검증 함수가 `process.env`를 인자·객체로 받으면 클라이언트에서 `undefined`가 되고 사용처 3곳 대비 이득이 작다. 가드가 막는 것은 env 미설정 시 proxy 단계의 전 요청 500이며, 공개 글 쿼리는 자체 try/catch로 빈 목록을 반환한다.
- `savePost` 단일 쿼리화(2026-10-28 결정): 하지 않는다. 관리자 1인이라 동시 저장 경합의 최악 결과는 최초 발행일 수 ms~수 초 오차이고 check 제약은 깨지지 않으며 삭제 경합은 0행 검사가 `NOT_FOUND`로 처리한다. 트리거·RPC로 옮기면 발행일 규칙이 TS(`resolvePublishedAt`과 단위 테스트)와 SQL 두 곳으로 갈라지고, CI는 DB 쓰기 e2e를 돌리지 않으며, 절약되는 것은 select 1회뿐이다. 실제 문제가 관측되면 재검토한다.
- 2차 후속 브랜치 1(`refactor/env-and-query-cleanup`) 검증(2026-10-28): `lib/queries/columns.ts`로 `SUMMARY_COLUMNS`·`POST_COLUMNS` 분리(`admin-posts.ts`가 `posts.ts`를 더는 import하지 않음). `npm run check`(Vitest 24 파일 / 198개)·`npm run knip`·`npm run build`(placeholder env) 통과, `npm run test:e2e` 66개 모두 통과(실패 0). 마이그레이션·DB 변경 없음.
- 2차 후속 브랜치 2(`test/coverage-gaps`) 검증(2026-10-28): `data/data.test.ts`(정적 데이터 필수 필드·중복·URL 형식), `lib/site-config.test.ts`(내비게이션 href 중복·`app/(site)` 라우트 대응·`isActivePath` 정합성), `app/admin/actions.test.ts`(로그아웃 `signOut` 후 `/` 리다이렉트) 추가. 정적 데이터에는 `id` 필드가 없어 중복 검사는 `title`·`name` 기준이다. `publications`는 데이터를 정렬해 두지 않고 `sortPublications`가 연도 내림차순으로 정렬하므로(`lib/publications/sort.test.ts`) 데이터 순서는 검사하지 않는다. `lib/types`(`post`·`profile`·`resume`)는 타입 선언뿐이라 런타임 로직이 없어 테스트를 추가하지 않고 `npm run typecheck`로 충분하다고 판단했다. `npm run check`(Vitest 27 파일 / 230개)·`npm run knip` 통과, 프로덕션 코드 변경 없음, `npm run build`는 이 브랜치에서 실행하지 않았다.
- 2차 후속 브랜치 3(`test/rls-verification`) 결정(2026-10-28): RLS 회귀 검증은 (a) Supabase MCP `execute_sql` 읽기 전용 절차 문서화(`docs/guides/rls-verification.md`)로 정했다. (b) e2e 추가는 일반 로그인 계정(회원가입 차단)·service role 키(`user_metadata` 케이스)가 필요하고 CI `e2e-smoke`가 placeholder 값이라 RLS를 검증하지 못해 도입하지 않았고, (c)는 원격 GRANT가 마이그레이션 의도와 어긋나 있던 사례가 있어 택하지 않았다. 원격 프로젝트(`gfrewivdclcitgysgsbi`)가 `.mcp.json`과 일치함을 확인하고 `begin read only` + `rollback`으로만 점검했다(운영 DB 쓰기 없음, service role 키 미사용). 결과: anon 조회 pub 1 / drafts 0, `user_metadata.role='admin'` 위조 authenticated 조회 drafts 0 / blog-images objs 0, `pg_policies` 정책 7개에 `user_metadata` 참조 0 / storage SELECT 정책 0. 초안·객체가 DB에 없어 A, B는 보조 증거이고 쓰기 거부는 읽기 전용으로 증명하지 못한다. 원격 `posts`의 anon·authenticated에 `TRUNCATE`·`REFERENCES`·`TRIGGER`가 남아 있는 GRANT 불일치는 정리하지 않고 가이드에 기록했다. 문서만 변경해 e2e는 실행하지 않았다.
- RLS 검증 후속(2026-10-28, 계획: `shrimp_data/branch-review-followup-3.md`): 아래 두 건은 아직 하지 않았다.
  - [x] `test/admin-post-actions`: 이미 `app/admin/posts/actions.test.ts`(커밋 `bd3d647`)가 `savePost`·`deletePost` 모두 `requireAdmin` 거부 시 예외가 전파되고 `createClient`가 호출되지 않음을 단언한다(`vi.mock`으로 `requireAdmin`·`createClient`를 분리). 후속 항목을 만들 때 이 테스트 파일을 확인하지 못하고 "없음"으로 적은 오류였고, 추가 코드 변경 없이 닫는다(2026-10-28 확인, `npx vitest run app/admin/posts/actions.test.ts` 통과).
  - [x] `fix/posts-grants`(2026-10-28): 원격 `posts`의 과잉 GRANT를 `20261028133002_revoke_excess_posts_grants.sql`로 회수했다. 적용 전 사용자 확인을 받았고 원격 프로젝트(`gfrewivdclcitgysgsbi`)를 확인했다. 회수 전에는 anon이 `INSERT·UPDATE·DELETE·TRUNCATE·REFERENCES·TRIGGER`, authenticated가 `TRUNCATE·REFERENCES·TRIGGER`를 추가로 갖고 있었는데(`public` 스키마 default privileges가 원인), 회수 후 anon은 `SELECT`, authenticated는 `SELECT·INSERT·UPDATE·DELETE`만 남았다(`service_role`·`postgres`는 기본값 유지). `get_advisors`(security)는 기존 예외 `auth_leaked_password_protection` 1건뿐이고, 점검 A(anon 조회 pub 1 / drafts 0)와 C(정책 7개, `user_metadata` 참조 0, storage SELECT 0)를 다시 돌려 같은 결과를 확인했다. default privileges는 바꾸지 않아 새 테이블은 같은 과잉 권한을 받으므로 가이드에 기록했다. `npm run check`·`npm run knip`·`npm run build`(placeholder env) 통과. `npm run test:e2e`는 66개 중 61개 통과, `e2e/admin-image-upload.spec.ts`의 '여러 파일 선택' 1개 실패(전체 실행 2회 모두 실패, 같은 파일 단독 실행은 7회 중 6회 통과), 그 뒤 같은 파일의 4개는 미실행이다. 실패 시점에 본문이 빈 문자열이고 오류 알림도 없어 업로드 입력 핸들러가 붙기 전에 `setInputFiles`가 실행된(하이드레이션 경합) 것으로 보이며, 이 페이지는 `posts`를 조회하지 않아 GRANT와 무관해 보이지만 원인은 확정하지 못했다(GRANT를 되돌려 비교하지 않음). 이후 `test/stabilize-image-upload-e2e`에서 `beforeEach`에 하이드레이션 대기(`image-upload-input`에 `__reactProps$` 부착 확인)를 추가했고, 실행 사이를 6분 이상 둔 전체 e2e 4회가 모두 66개 통과했다(수정 전 전체 실행은 2회 모두 실패). 연속 실행에서는 `login()`이 `/auth/login`에 머물러 실패했고 간격을 두자 사라져 Supabase Auth 로그인 횟수 제한으로 추정하나 오류 문구는 확인하지 못했다. e2e는 한 번에 로그인이 약 45번이라 5분 이상 간격을 두고 돌린다. 관리자 글 CRUD e2e(`admin-posts`·`admin-flow` 등)는 통과했다.
- giscus 댓글과 CSP(Task 031, 2026-11-11): 지금 CSP에는 `script-src`·`frame-src`가 없어 `https://giscus.app/client.js`와 giscus iframe이 그대로 허용된다. 나중에 CSP를 강화하면 `script-src`(스크립트)와 `frame-src`(iframe)에 `https://giscus.app`을 추가해야 하고, 빠뜨리면 댓글이 로드되지 않아 안내 문구만 보인다. 댓글 작성에는 GitHub 계정이 필요하며 스팸 방지·모더레이션은 GitHub Discussions에 맡긴다.

## MVP 이후 범위

MVP 범위 밖이던 항목(댓글, RSS, 검색, 페이지네이션, 조회수, 스토리지 고아 이미지 정리, 임시저장 자동화, `<style>` 글 단위 스코프 변환, 정적 섹션의 DB 저장·관리자 편집)과 추가 요청(이전/다음 글, 태그 정렬, 태그·카테고리 필터)은 2026-11-05 **Phase 6(Task 021~034)** 으로 옮겼다. 기능 ID는 "Post-MVP 기능 ID" 표(F015~F025, 제안)를 따른다.
