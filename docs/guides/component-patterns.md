# 컴포넌트 패턴 가이드

이 문서는 Next.js 16 + React 19.3 + shadcn/ui(Base UI) + Supabase 환경에서 컴포넌트를 작성하는 패턴을 정리합니다.
서버/클라이언트 경계와 캐싱 규칙은 `nextjs-16.md`, 스타일은 `styling-guide.md`, 폼은 `forms-react-hook-form.md`, 파일 위치는 `project-structure.md`를 함께 참고하세요.

## 기본 설계 원칙

### 단일 책임

한 컴포넌트는 하나의 명확한 역할만 맡습니다. 세션 조회 + 로그아웃 처리 + 레이아웃이 한 곳에 섞이면 분리합니다. `SiteHeader`(서버: 메뉴 구성) → `NavLink`·`NavGroupDropdown`·`MobileNav`(클라이언트: 현재 경로 강조와 드롭다운)가 이 프로젝트의 기준 사례입니다 (`components/layout/`).

### 컴포지션 우선

상속 대신 `children`과 슬롯 컴포넌트로 조합합니다. 이 프로젝트의 `Card` 계열이 기준입니다 (`components/ui/card.tsx`).

```tsx
<Card>
  <CardHeader>
    <CardTitle>로그인</CardTitle>
    <CardDescription>이메일로 로그인합니다</CardDescription>
  </CardHeader>
  <CardContent>{/* 폼 */}</CardContent>
</Card>
```

### 현재 설치된 UI 컴포넌트

`avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `separator`, `tabs`, `textarea`. 그 외(`select`, `field` 등)는 필요할 때 `npx shadcn@latest add <name>`으로 추가합니다. 접근성이 중요한 복합 위젯(Tabs, Dialog, Accordion, Select, Menu 등)은 직접 만들지 않습니다.

도메인 표시 컴포넌트는 `components/blog/`(`post-card`, `category-badge`, `tag-badge`), `components/content/`(`page-header`, `empty-state`, `resume-section`, `project-card` 등), `components/layout/`(헤더·푸터·내비게이션)에 있습니다. `components/ui`는 수정하지 않고 래핑해서 씁니다.

## Server vs Client Components

### 기본은 Server Component

데이터 패칭, 서버 전용 모듈, SEO가 필요한 UI는 Server Component로 둡니다.
`cacheComponents`가 켜져 있으므로 **요청 시점 데이터(Supabase 세션·쿼리)를 읽는 컴포넌트는 `<Suspense>`로 감싸고, 데이터를 읽는 쪽을 Suspense 안쪽 컴포넌트로 분리**합니다.

```tsx
// app/admin/notes/page.tsx (예시 테이블 notes. 실제 posts 조회는 Task 012·013)
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function NoteList() {
  const supabase = await createClient();
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title");
  if (error) throw error;

  return (
    <ul className="grid gap-2">
      {notes.map((note) => (
        <li key={note.id}>{note.title}</li>
      ))}
    </ul>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <NoteList />
    </Suspense>
  );
}
```

페이지 컴포넌트 안에서 직접 `await createClient()`를 한 뒤 결과를 `<Suspense>` 안의 자식에게 넘기면 Suspense가 의미가 없고, 경계 밖의 동적 접근은 에러가 됩니다.

### 필요한 곳만 Client Component

상태, 이벤트 핸들러, 브라우저 API, Context 소비가 필요한 말단 컴포넌트에만 `'use client'`를 붙입니다. 파일 최상단에 선언하고, 서버에서 받은 데이터는 props로 전달합니다.

단순히 서버 동작을 호출하는 버튼은 클라이언트 컴포넌트가 필요 없습니다. `app/admin/_components/logout-button.tsx`는 `'use client'` 없이 `<form action={logout}>`에 `Button`을 넣은 서버 컴포넌트이고, `logout`은 `app/admin/actions.ts`의 Server Action입니다. `variant`/`size`만 선택적 props로 받습니다.

```tsx
// app/admin/_components/logout-button.tsx (서버 컴포넌트)
import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/actions";

type LogoutButtonProps = Pick<
  React.ComponentProps<typeof Button>,
  "variant" | "size"
>;

export function LogoutButton({ variant, size }: LogoutButtonProps) {
  return (
    <form action={logout}>
      <Button type="submit" variant={variant} size={size}>
        로그아웃
      </Button>
    </form>
  );
}
```

- Client Component는 `@/lib/supabase/client`만, Server Component/Action은 `@/lib/supabase/server`만 import합니다. 서버 전용 코드가 클라이언트로 새는 것이 걱정되면 해당 모듈 상단에 `import "server-only"`를 둡니다.
- `'use client'` 컴포넌트가 import하는 모듈은 모두 클라이언트 번들에 포함됩니다. 서버 컴포넌트는 `children`/props로 끼워 넣을 수 있습니다.
- 생성된 shadcn 컴포넌트의 `"use client"` 지시어는 직접 추가하거나 제거하지 않습니다.

### 동적 라우트 컴포넌트의 params

`params`와 `searchParams`는 Promise입니다. `PageProps` 헬퍼를 사용합니다 (`npx next typegen`). `app/auth/error/page.tsx`는 `searchParams: Promise<...>`를 직접 타이핑하는 starter 방식이고, 블로그 페이지처럼 새 코드는 헬퍼를 씁니다.

```tsx
// app/(site)/blog/page.tsx 와 같은 방식: page는 Promise를 넘기기만 하고,
// await은 Suspense 안쪽 컴포넌트에서 한다.
export default function BlogPage(props: PageProps<"/blog">) {
  return (
    <Suspense fallback={<p>불러오는 중…</p>}>
      <FilteredPosts searchParams={props.searchParams} />
    </Suspense>
  );
}
```

## React 19 패턴

### 폼 상태: `useActionState`

폼은 Server Action + `useActionState`가 기본입니다. 전체 패턴은 `forms-react-hook-form.md`를 참고하세요. `app/auth/login/_components/login-form.tsx`가 이 방식의 실제 예시입니다. `'use client'` 컴포넌트에서 `useActionState(login, initialState)`로 `app/auth/login/actions.ts`의 Server Action을 연결하고, 실패 시 이메일을 `defaultValue={state.email}`로 유지하며 오류는 `role="alert"` 요소로 표시합니다. 관리자 편집기(`post-editor.tsx`)도 아직 저장 동작 없이 `useState`로 입력만 관리합니다(Task 013에서 연결).

### 마운트 여부: `useSyncExternalStore`

`useEffect` + `setState`로 `mounted`를 만들면 `react-hooks/set-state-in-effect` 린트에 걸립니다. `components/theme-switcher.tsx`처럼 `useSyncExternalStore`를 씁니다.

```tsx
const subscribe = () => () => {};

const mounted = useSyncExternalStore(
  subscribe,
  () => true, // 클라이언트
  () => false, // 서버/하이드레이션
);
```

### 낙관적 업데이트: `useOptimistic`

```tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";

type Todo = { id: string; title: string; pending?: boolean };

export function TodoList({
  todos,
  addTodo,
}: {
  todos: Todo[];
  addTodo: (title: string) => Promise<void>;
}) {
  const [optimistic, addOptimistic] = useOptimistic(
    todos,
    (current, title: string) => [
      ...current,
      { id: crypto.randomUUID(), title, pending: true },
    ],
  );
  const [, startTransition] = useTransition();

  return (
    <>
      <ul>
        {optimistic.map((t) => (
          <li key={t.id} className={cn(t.pending && "opacity-50")}>
            {t.title}
          </li>
        ))}
      </ul>
      <button
        onClick={() =>
          startTransition(async () => {
            addOptimistic("새 항목");
            await addTodo("새 항목");
          })
        }
      >
        추가
      </button>
    </>
  );
}
```

### `ref`는 일반 prop

React 19에서는 함수 컴포넌트가 `ref`를 prop으로 직접 받습니다. `forwardRef`는 쓰지 않습니다. 생성된 `components/ui/*`도 `forwardRef` 없이 Base UI 프리미티브에 props를 그대로 넘깁니다.

### 그 외

- `use(promise)` / `use(context)`: Client Component에서 서버가 넘긴 Promise를 읽을 때 사용 (Suspense 필요).
- `<Context value={...}>`: React 19에서는 `<Context.Provider>` 대신 Context를 직접 Provider로 쓸 수 있습니다.
- `useEffectEvent`: Effect 안에서 최신 props/state를 읽되 의존성에는 넣고 싶지 않은 로직에 사용.
- `<Activity>`: Cache Components 네비게이션에서 라우트가 숨겨져도 상태가 유지됩니다. Effect cleanup을 반드시 작성합니다 (`onAuthStateChange` 구독 포함).
- 메타데이터 태그는 `metadata` / `generateMetadata`를 사용합니다 (`app/layout.tsx` 참고).
- 폼 이벤트 타입은 React 19 타입의 `React.SubmitEvent<HTMLFormElement>`를 씁니다 (`login-form.tsx`).

## Props 설계

### Props 타입은 프리미티브/DOM 타입을 확장

DOM 요소를 감싸면 `React.ComponentProps<"tag">`, Base UI 프리미티브를 감싸면 `<Primitive>.Props` 타입을 씁니다 (`components/ui/button.tsx`는 `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>`). starter 코드의 `React.ComponentPropsWithoutRef<"div">`는 새 코드에서 `ComponentProps`로 통일합니다 (React 19에서 `ref`가 일반 prop이므로).

```tsx
type AlertProps = React.ComponentProps<"div"> & {
  tone?: "info" | "danger";
};

export function Alert({ tone = "info", className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border p-4 text-sm",
        tone === "danger" && "border-destructive text-destructive",
        className,
      )}
      {...props}
    />
  );
}
```

- 네이티브 속성(`onClick`, `disabled`, `aria-*`)을 직접 선언하지 말고 위 타입으로 받습니다.
- prop이 7~8개를 넘거나 boolean prop이 여럿이면 컴포지션으로 나눕니다.
- 기본값은 구조 분해에서 지정합니다.
- 타입 import는 ESLint 규칙에 따라 `import { type X }` 형태입니다.

### `render` prop (Base UI)

이 프로젝트의 shadcn은 Radix가 아니라 **Base UI**입니다. `asChild`는 없고, 다른 요소(예: `Link`)에 스타일/동작을 입히려면 `render` prop을 사용합니다.

```tsx
// app/not-found.tsx (현재 코드)
<Button render={<Link href="/" />} nativeButton={false}>
  메인으로 돌아가기
</Button>
```

- `render`로 `<button>`이 아닌 요소(`<a>`, `Link`, `<span>`)를 렌더링하면 **`nativeButton={false}`** 를 함께 지정합니다 (`project-card.tsx`의 외부 링크 버튼, 메인의 `mailto:` 버튼도 같은 방식).
- 트리거 컴포넌트도 같은 방식입니다: `components/theme-switcher.tsx`의 `<DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>`, `app/admin/posts/_components/delete-post-dialog.tsx`의 `<DialogTrigger render={<Button variant="destructive" size="sm" />}>`. 트리거를 별도의 `<div>`나 `<Button>`으로 감싸지 않습니다.
- `render`에는 요소 또는 `(props, state) => ReactElement` 함수를 줄 수 있습니다.
- Radix 코드(`asChild`, `data-[state=open]`)를 가져올 때는 `.agents/skills/shadcn/rules/base-vs-radix.md`와 `migrate-radix-to-base` 스킬을 따릅니다.

### 다형성 컴포넌트: `useRender`

직접 만드는 컴포넌트가 `render`를 지원해야 하면 Base UI의 `useRender`를 씁니다 (Radix의 `Slot` 대응).

```tsx
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";

interface TagProps extends useRender.ComponentProps<"span"> {}

export function Tag({ render, className, ...props }: TagProps) {
  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(
      { className: cn("rounded-md bg-muted px-2 py-0.5 text-xs", className) },
      props,
    ),
  });
}
```

`as` prop 방식은 타입이 복잡해지므로 만들지 않습니다.

## 재사용 패턴

### 변형: cva

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const panelVariants = cva("rounded-lg border bg-card text-card-foreground", {
  variants: {
    size: { sm: "p-4", md: "p-6", lg: "p-8" },
    tone: { default: "border-border", ghost: "border-transparent shadow-none" },
  },
  defaultVariants: { size: "md", tone: "default" },
});

type PanelProps = React.ComponentProps<"div"> &
  VariantProps<typeof panelVariants>;

export function Panel({ size, tone, className, ...props }: PanelProps) {
  return (
    <div className={cn(panelVariants({ size, tone }), className)} {...props} />
  );
}
```

### className 병합

외부에서 받은 `className`은 항상 `cn()`의 마지막 인자로 넘겨 호출자가 덮어쓸 수 있게 합니다 (`login-form.tsx`의 `cn("flex flex-col gap-6", className)`). Prettier가 `cn`, `cva` 안의 Tailwind 클래스를 자동 정렬합니다.

### 컴파운드 컴포넌트

상태를 공유하는 컴포넌트 묶음은 Context로 연결합니다. 소비 훅에서 Provider 유무를 검사합니다.

```tsx
"use client";

import { createContext, use, useState } from "react";

type DisclosureContextValue = { open: boolean; toggle: () => void };
const DisclosureContext = createContext<DisclosureContextValue | null>(null);

function useDisclosure() {
  const ctx = use(DisclosureContext);
  if (!ctx) throw new Error("Disclosure 컴포넌트 안에서만 사용할 수 있습니다");
  return ctx;
}

export function Disclosure({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DisclosureContext value={{ open, toggle: () => setOpen((v) => !v) }}>
      {children}
    </DisclosureContext>
  );
}

export function DisclosureTrigger({ children }: { children: React.ReactNode }) {
  const { open, toggle } = useDisclosure();
  return (
    <button aria-expanded={open} onClick={toggle}>
      {children}
    </button>
  );
}

export function DisclosureContent({ children }: { children: React.ReactNode }) {
  return useDisclosure().open ? <div>{children}</div> : null;
}
```

위 예시는 패턴 설명용입니다. 실제 위젯은 Base UI 기반 shadcn 컴포넌트를 추가해 씁니다.

### 커스텀 훅

```tsx
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  return {
    value,
    toggle: () => setValue((v) => !v),
    setTrue: () => setValue(true),
    setFalse: () => setValue(false),
  };
}
```

훅 파일은 루트 `hooks/`에 둡니다 (`@/hooks`, 폴더는 필요할 때 생성). `useCallback`으로 모든 함수를 감쌀 필요는 없습니다.

## 데이터 패칭 위치

| 상황                               | 방법                                                              |
| ---------------------------------- | ----------------------------------------------------------------- |
| 초기 렌더에 필요한 데이터          | Server Component에서 Supabase 서버 클라이언트로 조회 + `Suspense` |
| 모든 방문자에게 같은 공개 데이터   | `use cache` + 쿠키 없는 Supabase 클라이언트 (`nextjs-16.md` 참고) |
| 사용자 변경 (폼 제출)              | Server Action + `useActionState`                                  |
| 브라우저 전용 상호작용·실시간 구독 | Client Component + `@/lib/supabase/client` (Effect cleanup 필수)  |

- 사용자별 데이터는 RLS가 최종 방어선입니다. 컴포넌트에서 사용자 ID를 걸러 쓰는 것만 믿지 않습니다.
- `useEffect` 안에서 `fetch` + `useState`로 로딩/에러를 직접 관리하는 `DataFetcher` 류의 render-props 컴포넌트는 만들지 않습니다. 서버 패칭 또는 Suspense + `use()`를 사용하세요.
- Supabase 쿼리의 `error`는 무시하지 않습니다. 렌더 중 `throw` 하면 가장 가까운 `error.tsx`가 처리합니다.

## 성능

- **React Compiler**: 현재 `reactCompiler` 옵션은 꺼져 있습니다. 켜면 수동 `memo`/`useMemo`/`useCallback`은 대부분 불필요합니다. 켜기 전에는 측정으로 병목이 확인된 곳에만 사용합니다.
- **지연 로딩**: 클라이언트 전용 무거운 컴포넌트는 `next/dynamic`을 사용합니다.

```tsx
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("@/components/chart"), {
  loading: () => <div className="h-64 animate-pulse rounded-md bg-muted" />,
});
```

- **긴 리스트**: 수백 개 이상이면 가상화 라이브러리를 검토합니다. 도입 시 최신 문서를 확인합니다.
- **아이콘**: `lucide-react`는 필요한 아이콘만 named import 합니다.
- **번들 확인**: 의심되면 `npm run analyze`로 번들을 확인합니다.

## 타입 안전성

### 판별 유니온 props

서로 배타적인 props는 조건부 제네릭보다 판별 유니온이 단순합니다.

```tsx
type ActionProps =
  { loading: true; onClick?: never } | { loading?: false; onClick: () => void };
```

### 제네릭 컴포넌트

목록/선택 컴포넌트는 항목 타입을 제네릭으로 받고 `getKey`, `getLabel` 같은 접근자를 props로 받습니다.

```tsx
type ListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  render: (item: T) => React.ReactNode;
};

export function List<T>({ items, getKey, render }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={getKey(item)}>{render(item)}</li>
      ))}
    </ul>
  );
}
```

### Supabase 타입

DB 타입은 `lib/supabase/database.types.ts`(생성 파일)에 있고 세 Supabase 클라이언트에 `Database` 제네릭이 적용되어 있어, `.from("posts").select()` 결과가 타입 안전합니다. 도메인 타입은 직접 쓰지 않고 `lib/types/post.ts`처럼 `Tables<"posts">`에서 파생합니다(`PostSummary`, `Post`, `PostInput`). 쿼리 결과를 `as`로 단언하지 말고, 필요한 필드만 `select`한 뒤 컴포넌트 props 타입을 명시합니다. 스키마를 바꾸면 마이그레이션 적용 후 타입을 다시 생성합니다.

## 테스트

컴포넌트 테스트는 Vitest + Testing Library로 대상 파일 옆에 작성합니다 (`*.test.tsx`).

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "@/components/alert";

describe("Alert", () => {
  it("메시지를 role=alert로 렌더링한다", () => {
    render(<Alert>저장하지 못했습니다</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("저장하지 못했습니다");
  });
});
```

- async Server Component는 직접 렌더링하기 어렵습니다. 순수 로직은 분리해 테스트하고, 흐름은 `e2e/`에서 확인합니다.
- Supabase 클라이언트를 쓰는 Client Component는 `vi.mock("@/lib/supabase/client")`로 대체합니다.
- `components/ui/**`는 커버리지 대상이 아닙니다.

## 안티패턴

```tsx
// props drilling이 3단계 이상 → Context 또는 컴포지션으로 해소
// 500줄이 넘는 컴포넌트 → 분리
// 의미 없는 래퍼 <div>만 반환하는 컴포넌트
// 이벤트 핸들러/상태가 없는데 'use client'
// any 타입 props
// 배열 index를 key로 사용 (순서가 바뀌는 리스트)
// useEffect로 파생 상태 계산 (렌더 중 계산하거나 useMemo 사용)
// Effect 안에서 동기 setState로 mounted 플래그 설정 (useSyncExternalStore 사용)
// asChild 사용 (Base UI에서는 render)
// 트리거를 <div>나 <Button>으로 한 번 더 감싸기
// Client Component에서 서버 Supabase 클라이언트 import
// 오류를 text-red-500처럼 하드코딩 (text-destructive 사용)
```

## 체크리스트

**설계**

- [ ] 단일 책임, 컴포지션 활용
- [ ] 네이티브 props는 `React.ComponentProps<"tag">` 또는 프리미티브 `Props`로 확장

**Server/Client**

- [ ] Server Component 우선, `'use client'`는 말단에만
- [ ] 요청 시점 데이터(Supabase 세션·쿼리)는 `Suspense` 경계 안에서 읽기
- [ ] 서버/브라우저 Supabase 클라이언트를 올바른 쪽에서만 import
- [ ] `params`/`searchParams`는 `await`

**shadcn / Base UI**

- [ ] `asChild`가 아니라 `render`, 비-button 요소는 `nativeButton={false}`
- [ ] 복합 위젯은 `npx shadcn@latest add`로 추가

**타입 / 성능**

- [ ] Props 타입 정의, `any` 없음
- [ ] 수동 메모이제이션은 측정 후에만
- [ ] 무거운 클라이언트 컴포넌트는 `next/dynamic`

**접근성 / 품질**

- [ ] 의미 있는 HTML 태그, 필요한 ARIA 속성, 키보드 조작
- [ ] Effect cleanup 작성 (`<Activity>`로 숨겨질 때 정리됨)
- [ ] `npm run check` 통과
