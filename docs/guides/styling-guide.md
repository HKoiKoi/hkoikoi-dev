# 스타일링 가이드

이 문서는 Tailwind CSS v4 + shadcn/ui(`base-nova`, Base UI 기반) 스타일링 규칙입니다.

## 기술 스택

| 도구                          | 버전      | 비고                                                                           |
| ----------------------------- | --------- | ------------------------------------------------------------------------------ |
| Tailwind CSS                  | 4.3       | CSS-first 설정. `tailwind.config.ts` 없음                                      |
| `@tailwindcss/postcss`        | 4.3       | `postcss.config.mjs`의 유일한 플러그인. Tailwind를 빌드에 연결                 |
| shadcn/ui                     | base-nova | `components.json`, **Base UI**(`@base-ui/react`) 기반, `baseColor: neutral`    |
| `shadcn/tailwind.css`         |           | shadcn 공용 유틸리티/변형, `globals.css`에서 import                            |
| `tw-animate-css`              | 1.x       | `@import "tw-animate-css"`로 로드                                              |
| `next-themes`                 | 0.4       | 루트 레이아웃의 `ThemeProvider` (`attribute="class"`, `defaultTheme="system"`) |
| `clsx` + `tailwind-merge`     | 2.x / 3.x | `lib/utils.ts`의 `cn()`이 둘을 조합                                            |
| class-variance-authority      | 0.7       | 변형 정의                                                                      |
| lucide-react                  | 0.511     | 아이콘 (`iconLibrary: lucide`)                                                 |
| `prettier-plugin-tailwindcss` | 0.8       | 클래스 자동 정렬. `cn`, `cva` 안의 문자열도 정렬 (`.prettierrc.json`)          |

클래스 정렬은 저장 시 포맷 훅과 커밋 시 lint-staged의 Prettier가 처리하므로 손으로 맞추지 않습니다.

## Tailwind v4 설정 구조

모든 설정은 `app/globals.css`에 있습니다.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

/* 다크모드: <html class="dark"> 기준 */
@custom-variant dark (&:is(.dark *));

/* 유틸리티가 참조할 토큰 등록 (값은 아래 :root / .dark 변수를 참조) */
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* ... card, popover, secondary, muted, accent, destructive, border, input, ring, chart-1~5, sidebar-* */
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-lg: var(--radius);
}

/* 실제 색상 값은 :root / .dark 에서 oklch로 정의 */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --radius: 0.625rem;
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

규칙:

- `@tailwind base/components/utilities`와 `tailwind.config.ts`는 쓰지 않습니다.
- 새 색상/토큰은 `:root`와 `.dark`에 값을 정의하고, `@theme inline`에 `--color-*`로 등록해야 `bg-*`/`text-*` 유틸리티로 쓸 수 있습니다.
- 색상 값은 **oklch** 입니다. `hsl(var(--x))` 형식이나 HSL 채널(`0 0% 100%`)을 쓰지 않습니다.
- 기본 테두리 색은 `@layer base`의 `* { @apply border-border }`가 지정합니다.
- 임의 값은 v4 문법을 씁니다: `origin-(--my-var)`, `max-h-(--my-var)`.
- 반경은 `--radius` 하나로 파생됩니다 (`rounded-md`, `rounded-lg`, `rounded-xl` …). 값을 바꾸려면 `--radius`만 수정합니다.
- `globals.css`는 `shadcn` CLI가 갱신하기도 합니다. 수정 후에는 diff를 확인합니다.

## v3 → v4 클래스 변경점

직접 작성하는 코드와 외부에서 가져온 v3용 코드를 정리할 때 참고합니다.

| v3                             | v4                                                 |
| ------------------------------ | -------------------------------------------------- |
| `shadow-sm`                    | `shadow-xs`                                        |
| `shadow`                       | `shadow-sm`                                        |
| `rounded-sm`                   | `rounded-xs` (`rounded`는 `rounded-sm`)            |
| `ring` (3px)                   | `ring-3` (`ring`은 1px)                            |
| `bg-gradient-to-r`             | `bg-linear-to-r`                                   |
| `data-[disabled]:`             | `data-disabled:`                                   |
| `min-w-[8rem]`                 | `min-w-32`                                         |
| `bg-opacity-50` 등             | `bg-black/50`                                      |
| `flex-shrink-*`, `flex-grow-*` | `shrink-*`, `grow-*`                               |
| `!p-4` (접두 important)        | `p-4!` (접미)                                      |
| `space-x-*`, `space-y-*`       | 동작하지만 레이아웃은 `flex`/`grid` + `gap-*` 권장 |

- v4의 `outline-none`은 `outline-style: none`이고, 포커스 링을 투명 아웃라인으로 남기려면 `outline-hidden`입니다. `shadcn add`로 생성된 컴포넌트(`button.tsx` 등)는 `outline-none`을 그대로 사용하므로 건드리지 않습니다.
- CSS 변수를 클래스에서 참조할 때는 `bg-(--color)` 형태입니다.

## 기본 원칙

```tsx
// 권장: 유틸리티 + 시맨틱 색상
<div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
  <h2 className="text-lg font-semibold text-foreground">제목</h2>
  <Button variant="outline" size="sm">버튼</Button>
</div>

// 금지: 인라인 스타일, 하드코딩 색상
<div style={{ display: "flex", padding: 16 }}>
<div className="bg-white text-black dark:bg-black dark:text-white">
```

- 다크모드는 시맨틱 토큰(`bg-background`, `text-muted-foreground` 등)으로 처리하고, `dark:` 접두사는 토큰으로 해결되지 않을 때만 씁니다.
- 레이아웃 간격은 `space-x-*`/`space-y-*` 대신 `flex`/`grid` + `gap-*`, 정사각형은 `w-* h-*` 대신 `size-*`를 씁니다.
- 커스텀 CSS 클래스와 CSS Modules는 만들지 않습니다. 반복되면 컴포넌트로 추출합니다.
- `!important`(`p-4!`)는 서드파티 스타일을 덮어쓸 때만 씁니다.
- 오류 문구는 `text-destructive`를 씁니다 (`app/auth/login/_components/login-form.tsx`, 편집기의 글자 수 초과 표시). `text-red-500` 같은 하드코딩 색은 쓰지 않습니다.

### 반응형

모바일 우선으로 작성하고 `sm:`, `md:`, `lg:`, `xl:`로 확장합니다. 이 프로젝트의 페이지 컨테이너 패턴은 다음과 같습니다.

| 영역                    | 패턴                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| 공개·관리자 페이지 본문 | `mx-auto w-full max-w-5xl px-4 py-12` (`app/(site)/blog/page.tsx` 등)                                    |
| 블로그 상세(읽기 폭)    | `mx-auto w-full max-w-3xl px-4 py-12`                                                                    |
| 헤더·관리자 헤더 안쪽   | `mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4`                                   |
| 인증 화면               | `flex min-h-svh w-full items-center justify-center p-6 md:p-10` + `max-w-sm` (`app/auth/login/page.tsx`) |

데스크톱 메뉴와 모바일 메뉴는 `hidden md:block` / `md:hidden`으로 나눕니다 (`site-header.tsx`, 768px 기준). 편집기의 좌우 분할은 `lg`(1024px) 이상입니다.

```tsx
<div className="flex flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6 lg:mx-auto lg:max-w-6xl lg:p-8">
```

```tsx
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

v4의 `container`는 기본으로 가운데 정렬/패딩이 없으므로 `mx-auto px-4`를 직접 붙이거나 `max-w-*`와 함께 씁니다. 부모 크기 기준 반응형이 필요하면 컨테이너 쿼리(`@container`, `@md:`)를 사용합니다.

## cn()과 cva

`cn()`은 `lib/utils.ts`에서 `twMerge(clsx(inputs))`로 구현되어 있습니다. 조건부 클래스와 `className` prop 병합은 항상 `cn()`을 쓰고, **import는 `@/lib/utils`에서만** 합니다 (`components/ui/*`도 동일).

```tsx
import { cn } from "@/lib/utils";

<div className={cn("rounded-md border p-4", isActive && "bg-primary text-primary-foreground", className)}>
```

변형이 있는 컴포넌트는 `cva`로 정의합니다 (`components/ui/button.tsx`, `components/ui/badge.tsx` 참고).

```tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
```

## shadcn/ui (base-nova)

현재 `components/ui/`에는 `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `separator`, `tabs`, `textarea`가 있습니다. 스타일은 `base-nova`이며 프리미티브는 `@base-ui/react`입니다 (Radix가 아님).

```bash
npx shadcn@latest add dialog
npx shadcn@latest info          # base, style, aliases 등 프로젝트 정보 확인
```

- 컴포넌트를 추가하거나 수정하기 전에 `.agents/skills/shadcn/SKILL.md`와 `rules/`를 먼저 확인합니다. 특히 `rules/base-vs-radix.md`, `rules/styling.md`가 이 프로젝트 기준입니다.
- 추가한 컴포넌트는 코드가 프로젝트 소유입니다. 직접 수정해도 되지만, `shadcn add`를 다시 실행하면 덮어쓰이므로 변경 사항을 확인하세요. `components/ui/**`는 knip과 커버리지 대상에서 제외되어 있습니다.
- **Radix 문법을 쓰지 않습니다.** `asChild` 대신 `render` prop을 사용합니다 (`component-patterns.md` 참고). Radix 예제를 가져올 때는 `migrate-radix-to-base` 스킬의 매핑을 따릅니다.
- 상태 스타일은 Base UI의 data 속성을 씁니다. 이 프로젝트의 생성 코드가 쓰는 것: `data-open`, `data-closed`, `data-checked`, `data-disabled`, `data-popup-open`, `aria-expanded`, `aria-invalid`. Radix의 `data-[state=open]` 문법을 그대로 복사하지 않습니다.
- 확장은 래핑으로 합니다.

```tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LiftButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "transition-all hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
      {...props}
    />
  );
}
```

## 다크모드

`@custom-variant dark (&:is(.dark *))`로 `.dark` 클래스 기준 다크모드가 정의되어 있고, `:root`/`.dark`에 두 테마의 토큰이 모두 있습니다. 전환 로직도 이미 구성되어 있습니다.

- `app/layout.tsx`: `<html suppressHydrationWarning>` 안에서 `ThemeProvider`(`next-themes`, `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`)가 `.dark` 클래스를 토글합니다.
- `components/theme-switcher.tsx`: `light` / `dark` / `system`을 고르는 드롭다운입니다. 공개 헤더(`components/layout/site-header.tsx`)에서 쓰고 있습니다.

테마 값(`useTheme`)은 서버에서 알 수 없으므로 마운트 후에만 UI에 반영합니다. `ThemeSwitcher`처럼 `useEffect` + `setState` 대신 `useSyncExternalStore`로 hydration 여부를 판별합니다 (React 19 lint 규칙 `react-hooks/set-state-in-effect` 회피).

```tsx
const subscribe = () => () => {};

const mounted = useSyncExternalStore(
  subscribe,
  () => true,
  () => false,
);
```

새 화면을 만들면 **라이트/다크 모두** 확인합니다. 깜빡임 이슈는 `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`를 먼저 확인합니다.

## 폰트

- `app/layout.tsx`는 `next/font/google`의 **Noto Sans KR**을 `variable: "--font-noto-sans-kr"`(가변 폰트라 `weight`는 지정하지 않음, `display: "swap"`)로 로드하고, `<body className={`${notoSansKr.variable} font-sans antialiased`}>`로 적용합니다.
- `app/globals.css`의 `@theme inline`에서 `--font-sans: var(--font-noto-sans-kr), sans-serif;`로 연결하고 `--font-heading`도 `--font-sans`를 따릅니다. `html { @apply font-sans }`가 기본 폰트를 지정하므로 `font-sans` 유틸리티가 Noto Sans KR로 해석됩니다.
- 타입 정의상 Noto Sans KR의 `subsets`에는 `korean`이 없어 `latin`만 preload하고, 한글 글리프는 Google Fonts의 unicode-range 조각으로 로드됩니다. 폰트를 바꿀 때는 한글 렌더링을 화면에서 확인합니다.

## 색상 시스템

| 토큰                                     | 용도                           |
| ---------------------------------------- | ------------------------------ |
| `background` / `foreground`              | 페이지 배경 / 기본 텍스트      |
| `card`, `popover` (+ `-foreground`)      | 카드, 팝오버 표면              |
| `primary`, `secondary` (+ `-foreground`) | 주요/보조 액션                 |
| `muted` / `muted-foreground`             | 약한 배경 / 보조 텍스트        |
| `accent` (+ `-foreground`)               | hover, 선택 상태               |
| `destructive`                            | 삭제, 오류                     |
| `border`, `input`, `ring`                | 테두리, 입력 테두리, 포커스 링 |
| `chart-1` ~ `chart-5`                    | 차트 계열 색상                 |
| `sidebar-*`                              | 사이드바 전용 표면/액션        |

```tsx
<div className="border-border bg-background">
  <h1 className="text-foreground">메인 텍스트</h1>
  <p className="text-muted-foreground">보조 텍스트</p>
</div>
```

오류 메시지처럼 의미가 있는 색은 `text-destructive`를 사용하고 `text-red-600`을 하드코딩하지 않습니다. 성공/경고 색상이 필요하면 토큰을 먼저 추가합니다 (현재 없음).

## 애니메이션

`tw-animate-css` 유틸리티(`animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-top-2` 등)는 `dropdown-menu`처럼 오버레이 컴포넌트의 열림/닫힘 전환에 쓰입니다. 기본 제공 `animate-spin`, `animate-pulse`, `animate-bounce`도 사용할 수 있습니다.

```tsx
<Loader2 className="size-4 animate-spin" />
<button className="transition-all duration-200 hover:scale-105">hover</button>
```

- `animate-fadeIn`, `animate-slideUp` 같은 클래스는 존재하지 않습니다.
- `tailwindcss-animate` 플러그인(`@plugin`)은 쓰지 않습니다. 외부 예제가 이를 가정하면 `tw-animate-css` 기준으로 맞춥니다.
- 움직임이 큰 애니메이션은 `motion-reduce:` 변형으로 비활성화를 고려합니다.

## 금지 사항

```tsx
<div style={{ backgroundColor: "red" }}>                 // 인라인 스타일
<div className={`${styles.custom} flex`}>                // CSS Module 혼용
<div className="bg-gray-100 text-gray-900">              // 하드코딩 색상 (토큰 사용)
<p className="text-red-500">                             // 오류 색상 하드코딩 (text-destructive)
<div className="bg-gradient-to-r">                       // v3 문법 (v4: bg-linear-to-r)
<div className="shadow-sm rounded-sm">                   // v3 의미로 쓴 클래스 (v4에서 한 단계씩 이동)
<div className="bg-[hsl(var(--primary))]">               // 토큰은 oklch. bg-primary 사용
```

## 체크리스트

- [ ] 유틸리티 클래스와 시맨틱 토큰 사용, 하드코딩 색상 없음
- [ ] 조건부/외부 클래스는 `cn()`으로 병합 (`@/lib/utils`에서 import)
- [ ] 라이트/다크 모두 확인
- [ ] 모바일 우선 반응형
- [ ] v3 클래스(`shadow-sm` 의미 혼동, `bg-gradient-*`) 미사용
- [ ] 포커스 스타일(`focus-visible:ring-*`)과 충분한 색상 대비
- [ ] 새 토큰은 `:root`, `.dark`, `@theme inline` 세 곳에 모두 추가
- [ ] shadcn 컴포넌트는 Base UI 문법(`render`, data 속성)으로 작성
