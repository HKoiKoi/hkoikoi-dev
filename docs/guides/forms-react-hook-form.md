# 폼 가이드: Server Actions + Supabase (+ Zod / React Hook Form)

이 문서는 Next.js 16 / React 19.3 / Supabase 환경에서 폼을 만드는 패턴을 정리합니다.
기본은 **Server Action + `useActionState` + shadcn `Field`** 이고, 클라이언트 검증이 복잡해질 때만 React Hook Form(RHF)과 Zod 4를 얹습니다.

## 현재 상태

- 설치된 폼 관련 UI: `input`, `label`, `checkbox`, `textarea`, `button`, `card`, `dialog`, `tabs`. **`field`는 아직 없습니다.**
- `zod`(v4)는 **설치됨**(`lib/schemas/post.ts`), `react-hook-form`, `@hookform/resolvers`는 **미설치**입니다.
- 현재 폼은 두 개입니다.
  - `components/login-form.tsx`: Server Action `login`(`app/auth/login/actions.ts`)을 `useActionState`로 연결한 로그인 폼입니다. 오류 시 이메일 입력값을 state로 돌려받아 `defaultValue`에 쓰고, 오류는 `role="alert"` + `text-destructive`로 표시하며, 서버 원문 메시지 대신 고정 문구만 보여 줍니다. 성공하면 Action이 `redirect("/admin/posts")` 합니다. 배치는 아직 `Label` + `div.grid`이고 `field` 컴포넌트가 없어 `FieldGroup`/`Field`로 옮기지 못했습니다. 새 폼은 아래 `Field` 규칙을 따릅니다.
  - `app/admin/posts/_components/post-editor.tsx`: 관리자 편집기입니다. `useActionState(savePost)`로 `app/admin/posts/actions.ts`의 Server Action에 연결되어 있고, 입력은 `useState`로 관리하며 각 입력에 `name`을 둡니다. 서버 검증은 `lib/schemas/post.ts`의 `postSchema`, 필드별 오류는 `state.fieldErrors`로 받아 `role="alert"`로 표시합니다. 슬러그 자동 제안은 `lib/posts/slugify.ts`, 소개글·태그 제한값은 `POST_LIMITS`를 씁니다. 글 삭제는 `app/admin/posts/_components/delete-post-dialog.tsx`가 `deletePost`를 호출합니다.
- 가입·비밀번호 재설정 폼과 이메일 확인 Route Handler(`app/auth/confirm/route.ts`)는 삭제되었습니다.

```bash
# 기본 폼에 필요한 shadcn 컴포넌트 (textarea는 이미 설치됨)
npx shadcn@latest add field

# 서버 검증 스키마가 필요할 때
npm install zod

# RHF 클라이언트 검증이 필요할 때만
npm install react-hook-form @hookform/resolvers
```

- 폼 UI 컴포넌트를 추가하기 전에 `.agents/skills/shadcn/rules/forms.md`를 확인합니다. 이 프로젝트는 Base UI 스타일(`base-nova`)이므로 Radix 기준 예제(`asChild`, `data-[state=...]`)를 그대로 쓰지 않습니다.
- Zod는 **v4** 기준입니다 (`@hookform/resolvers` v5 이상이 Zod 4를 지원). 설치 시 최신 문서를 확인하세요.
- 아래 예시의 `notes` 테이블은 설명용입니다. 실제 테이블은 Supabase에 만든 스키마에 맞춥니다.

## 핵심 원칙

1. **스키마 하나를 클라이언트와 서버가 공유**한다 (`lib/schemas/*.ts`, `"use client"`/`"use server"` 없는 순수 모듈).
2. **서버에서 반드시 다시 검증**한다. 클라이언트 검증은 UX용이다.
3. **Server Action은 공개 HTTP 엔드포인트**다. 변경 Action은 안에서 로그인 여부를 직접 확인한다 (`getClaims()`).
4. 사용자 입력 오류는 예외가 아니라 **반환값**으로 돌려준다.
5. **최종 권한은 RLS**가 지킨다. Action의 확인은 UX와 1차 방어이고, 테이블 정책이 없으면 publishable 키로 누구나 접근할 수 있다.

## 필드 구성: `FieldGroup` + `Field`

새 폼의 레이아웃은 `div` + `space-y-*`/`grid gap-2`가 아니라 `FieldGroup` / `Field`로 구성합니다. 검증 오류는 `Field`에 `data-invalid`, 컨트롤에 `aria-invalid`를 **둘 다** 지정합니다.

```tsx
<FieldGroup>
  <Field data-invalid={!!errors.title}>
    <FieldLabel htmlFor="title">제목</FieldLabel>
    <Input id="title" name="title" aria-invalid={!!errors.title} />
    {errors.title && <FieldError>{errors.title[0]}</FieldError>}
  </Field>
</FieldGroup>
```

컨트롤 선택: 짧은 텍스트 `Input`, 여러 줄 `Textarea`, 설정용 토글 `Switch`, 폼 동의 `Checkbox`, 소수 선택지 `RadioGroup` / `ToggleGroup`, 목록 `Select` / `Combobox`. 필요한 컴포넌트는 `npx shadcn@latest add`로 추가합니다.

## 스키마 정의 (Zod 4)

```ts
// lib/schemas/note.ts
import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(100),
  body: z.string().max(2000).optional(),
});

export type NoteValues = z.infer<typeof noteSchema>;
```

Zod 4 변경점:

| Zod 3                                                        | Zod 4                                            |
| ------------------------------------------------------------ | ------------------------------------------------ |
| `z.string().email()`                                         | `z.email()` (기존 방식은 deprecated)             |
| `z.string().uuid()`, `.url()`                                | `z.uuid()`, `z.url()`                            |
| `{ message: "..." }`, `required_error`, `invalid_type_error` | `{ error: "..." }` (문자열 또는 함수)            |
| `error.flatten()`, `error.format()`                          | `z.flattenError(error)`, `z.treeifyError(error)` |
| `z.boolean().refine(v => v === true)`                        | `z.literal(true, { error })`                     |

`FormData`는 모든 값이 문자열(또는 `File`)이므로 숫자/날짜는 `z.coerce.number()` 등으로 변환하고, 체크박스는 `formData.get("terms") === "on"`처럼 먼저 boolean으로 바꾼 뒤 스키마에 넘깁니다. 선택 입력은 빈 문자열이 오므로 `formData.get("body") || undefined`로 정리합니다.

## Server Action

```ts
// app/admin/notes/actions.ts (예시. 실제 글 저장은 app/admin/posts/actions.ts, Task 013)
"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { noteSchema } from "@/lib/schemas/note";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // 1. 서버 검증
  const parsed = noteSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "입력값을 확인해주세요",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // 2. 로그인 확인 (Action은 누구나 호출할 수 있다)
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { ok: false, message: "로그인이 필요합니다" };
  }

  // 3. 변경 (user_id는 DB 기본값 auth.uid() + RLS로 강제)
  const { error } = await supabase.from("notes").insert(parsed.data);
  if (error) {
    return { ok: false, message: "저장하지 못했습니다" };
  }

  // 4. 같은 요청에서 최신 값을 보여주려면 updateTag
  updateTag("notes");
  return { ok: true, message: "저장되었습니다" };
}
```

규칙:

- `redirect()`는 내부적으로 예외를 던지므로 `try/catch` 밖에서 호출합니다.
- Supabase/DB 에러 메시지(`error.message`)를 사용자에게 그대로 반환하지 않습니다. 서버 로그에는 `console.error`로 남깁니다 (`console.log`는 린트 경고).
- 캐시 무효화는 Server Action에서 `updateTag`(즉시), 지연이 허용되면 `revalidateTag(tag, "max")`를 씁니다. 두 번째 인자 없는 `revalidateTag`는 deprecated입니다. 캐시한 데이터가 없는 페이지는 무효화가 필요 없고, 서버 컴포넌트가 다음 요청에서 새로 읽습니다.
- 응답 후 처리(로그, 알림)는 `after()`(`next/server`)로 넘깁니다.
- Server Action은 POST로만 호출되고 Next.js가 `Origin`/`Host` 헤더를 검증하므로, 별도의 자체 CSRF 토큰을 만들지 않습니다. 프록시 뒤에서 호스트가 달라지면 `serverActions.allowedOrigins`를 설정합니다.
- 접근 제어는 Action 한 곳만 믿지 않고 데이터 계층(RLS)에서도 확인합니다 (`node_modules/next/dist/docs/01-app/02-guides/data-security.md`).
- `proxy.ts`는 로그인하지 않은 `/admin` 요청을 `/auth/login`으로 보내지만 이는 낙관적 검사일 뿐이고 관리자 역할도 보지 않습니다. 관리자 Action은 시작부에서 `requireAdmin()`(`lib/auth/require-admin.ts`, 구현 완료: `getClaims()` → 비로그인 `redirect("/auth/login")`, 비관리자 `notFound()`)을 호출하고, 페이지 레이아웃 검사에만 의존하지 않습니다.

### 인증 Action 예시 (로그인)

로그인을 서버 Action으로 처리하면 JS 없이도 동작하고 오류 문구를 일관되게 통제할 수 있습니다. 서버 클라이언트의 `setAll`이 Action에서는 쿠키를 정상적으로 씁니다. 실제 구현은 `app/auth/login/actions.ts`이며 요지는 다음과 같습니다.

```ts
// app/auth/login/actions.ts (요약)
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; email: string };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // 서버 원문 메시지와 계정 존재 여부 등 세부 사유를 노출하지 않는다
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다.", email };
  }

  redirect("/admin/posts"); // try/catch 밖
}
```

- 이 프로젝트에는 회원가입과 이메일 확인 흐름이 없습니다(가입은 Supabase 설정에서 차단). 관리자 계정은 대시보드에서 만들고 `app_metadata.role = 'admin'`을 부여합니다.
- 로그인 폼을 바꿀 때는 `e2e/`에 로그인 흐름 시나리오를 함께 추가합니다(Task 011의 `e2e/admin-auth.spec.ts`).

### 글 저장 Action 설계 (Task 013 기준)

아직 구현 전이며 ROADMAP의 설계를 요약한 것입니다. 구현 시 ROADMAP Task 013과 함께 확인합니다.

- 스키마는 `lib/schemas/post.ts`에서 서버와 편집기가 공유합니다. 제약은 DB check와 같은 값을 씁니다: title 1~200자, excerpt 150자 이하, tags 최대 10개(trim·중복 제거), content 최대 100,000자, slug는 NFC 정규화 후 `slugify` 규칙과 일치.
- `thumbnail_url`은 `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/` 접두의 주소만 허용합니다. 외부 도메인과 `javascript:` URL은 거부합니다.
- `savePost`(생성·수정 공용)는 `requireAdmin()` → `safeParse` → upsert 순서로 처리하고, unique 위반(코드 `23505`)은 slug 필드 오류로 바꿔 돌려줍니다.
- `published_at`은 처음 발행할 때만 `now()`로 채우고, 이미 발행된 글을 수정해도 유지합니다(DB check: 발행된 글은 `published_at`이 반드시 있어야 함).
- 이미지는 Server Action이 아니라 브라우저 Supabase 클라이언트로 `blog-images` 버킷에 직접 올립니다(Task 017). 버킷이 5MB·jpeg/png/webp/gif만 허용하고, 쓰기는 RLS 정책으로 관리자에게만 열려 있습니다.

## 기본 패턴: `<form action>` + `useActionState`

클라이언트 검증이 필요 없다면 RHF 없이 이 패턴으로 충분합니다. JS 없이도 제출되고, 서버 검증 오류를 필드별로 보여줄 수 있습니다.

```tsx
// app/admin/notes/_components/note-form.tsx (예시)
"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createNoteAction, type ActionState } from "../actions";

const initialState: ActionState = { ok: false, message: "" };

export function NoteForm() {
  const [state, formAction, isPending] = useActionState(
    createNoteAction,
    initialState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.title}>
          <FieldLabel htmlFor="title">제목</FieldLabel>
          <Input id="title" name="title" aria-invalid={!!errors.title} />
          {errors.title && <FieldError>{errors.title[0]}</FieldError>}
        </Field>

        {state.message && (
          <p
            role="status"
            className={
              state.ok
                ? "text-sm text-muted-foreground"
                : "text-sm text-destructive"
            }
          >
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {isPending ? "저장 중..." : "저장"}
        </Button>
      </FieldGroup>
    </form>
  );
}
```

포인트:

- `isPending` 대신 자식 컴포넌트에서 `useFormStatus()`로 제출 버튼 상태만 구독할 수도 있습니다.
- React 19의 `<form action>`은 제출 후 비제어 입력을 초기화합니다. 오류 후에도 입력을 유지하려면 Action이 입력값을 `state`로 되돌려주어 `defaultValue`에 사용하거나, 아래처럼 RHF로 값을 직접 관리합니다.
- 성공 시 이동이 필요하면 Action에서 `redirect()` 합니다 (`try/catch` 밖).
- 아이콘이 버튼 안에 있을 때는 `data-icon="inline-start"` 같은 `Button` 규칙을 따릅니다 (`.agents/skills/shadcn/rules/icons.md`).
- 이 컴포넌트 자체는 `Suspense`가 필요 없지만, 수정 모드처럼 초기값을 서버에서 읽어 `defaultValue`로 넘기는 부모 컴포넌트(예: `/admin/posts/[id]/edit`의 `page.tsx`)는 `Suspense` 안에서 렌더링합니다.

## RHF를 얹는 경우 (선택)

즉각적인 필드 검증, 복잡한 의존 필드, 다단계 폼이 필요할 때 사용합니다. 검증 스키마는 서버와 공유합니다.

```tsx
"use client";

import { startTransition, useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { noteSchema, type NoteValues } from "@/lib/schemas/note";
import { createNoteAction, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { ok: false, message: "" };

export function NoteForm({ defaultValues }: { defaultValues: NoteValues }) {
  const [state, formAction, isPending] = useActionState(
    createNoteAction,
    initialState,
  );

  const form = useForm<NoteValues>({
    resolver: zodResolver(noteSchema),
    defaultValues,
    mode: "onBlur",
  });

  // 서버 검증 오류를 필드에 반영
  useEffect(() => {
    if (!state.fieldErrors) return;
    for (const [name, messages] of Object.entries(state.fieldErrors)) {
      form.setError(name as keyof NoteValues, {
        type: "server",
        message: messages?.[0],
      });
    }
  }, [state.fieldErrors, form]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values))
      formData.set(key, String(value ?? ""));
    // 액션은 반드시 transition 안에서 호출한다 (isPending 연동, React 경고 방지)
    startTransition(() => formAction(formData));
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="title">제목</FieldLabel>
              <Input {...field} id="title" aria-invalid={fieldState.invalid} />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중..." : "저장"}
        </Button>
      </FieldGroup>
    </form>
  );
}
```

- RHF 연결은 `Controller`로 하고, 오류 표시는 위 `Field` 규칙(`data-invalid` + `aria-invalid`)을 그대로 따릅니다.
- Base UI 기반 컨트롤(`Select`, `Checkbox`, `Switch` 등)은 `field.onChange` / `field.value` 연결 방식이 컴포넌트마다 다르므로, 연결 전에 해당 컴포넌트의 생성된 코드를 읽습니다 (`components/ui/checkbox.tsx` 등).

## 고급 패턴

### 다단계 폼

단계별 스키마를 두고, `trigger()`로 현재 단계 필드만 검증한 뒤 다음 단계로 이동합니다. 최종 제출 시에는 모든 단계를 합친 스키마로 서버에서 다시 검증합니다.

```tsx
const steps = [
  { fields: ["name", "email"] as const },
  { fields: ["address", "city"] as const },
];

const next = async () => {
  const ok = await form.trigger(steps[step].fields);
  if (ok) setStep((s) => s + 1);
};
```

- 하나의 `useForm`(전체 스키마)을 유지하고 단계만 UI로 나눕니다. 단계마다 `useForm`을 새로 만들면 값이 사라집니다.
- 단계 상태를 URL(`?step=2`)에 두면 새로고침/뒤로가기에 강해집니다. Cache Components에서는 `useSearchParams`를 쓰는 컴포넌트를 `Suspense`로 감쌉니다.

### 파일 업로드 (Supabase Storage)

파일은 Server Action에 `FormData`로 직접 보내지 말고, **클라이언트에서 Supabase Storage로 직접 업로드**(서명된 업로드 URL 또는 RLS가 걸린 버킷 정책)하는 방식을 우선 검토합니다. Server Action 본문 크기 기본 제한은 1MB이며 `serverActions.bodySizeLimit`로 조정합니다.

```ts
const fileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, {
    error: "5MB 이하만 업로드할 수 있습니다",
  })
  .refine((f) => ["image/png", "image/jpeg", "image/webp"].includes(f.type), {
    error: "이미지 파일만 가능합니다",
  });
```

- `File` 검증은 브라우저와 서버 모두에서 합니다. MIME 타입은 위조 가능하므로 버킷의 허용 형식·크기 제한도 함께 설정합니다.
- Storage 이미지를 `next/image`로 보여주려면 `next.config.ts`의 `images.remotePatterns`에 프로젝트 도메인을 추가합니다.

### 자동 저장(Autosave)

`form.watch` 대신 `useWatch`로 필요한 값만 구독하고, 디바운스는 직접 작성하거나 `use-debounce`를 사용합니다.

```tsx
const values = useWatch({ control: form.control });
const debounced = useDebounce(values, 1000);

useEffect(() => {
  if (!form.formState.isDirty) return;
  startTransition(() => void saveDraftAction(debounced));
}, [debounced, form.formState.isDirty]);
```

- 자동 저장 Action도 일반 Action과 동일하게 서버 검증과 `getClaims()` 확인을 합니다 (초안용 느슨한 스키마를 `.partial()`로 만들 수 있습니다).
- Effect 안에서 구독/타이머를 만들면 cleanup을 작성합니다 (`<Activity>`로 숨겨지면 Effect가 정리됩니다).

## 보안

- **서버 재검증과 인증**: 위 Action 예시의 1~2단계를 모든 변경 Action에 적용합니다.
- **RLS**: 사용자 데이터 테이블은 RLS를 켜고 정책을 만듭니다. 정책 작성 전에 `supabase-postgres-best-practices` 스킬의 `security-rls-*` 참고 문서를 확인합니다. service role 키는 `NEXT_PUBLIC_` 변수에 넣지 않고, 사용하더라도 서버 전용 코드에서만 씁니다.
- **Rate limiting**: 모듈 전역 `Map` 기반 구현은 서버리스/다중 인스턴스에서 공유되지 않아 효과가 없습니다. 로그인·가입 남용 방지는 Supabase Auth의 rate limit 설정을 먼저 확인하고, 추가가 필요하면 Redis 등 외부 저장소 기반 제한을 씁니다. IP는 `x-forwarded-for` 첫 번째 값을 신뢰할 수 있는 프록시 환경에서만 사용합니다.
- **민감 정보 반환 금지**: 오류 메시지에 계정 존재 여부, SQL 오류 등을 노출하지 않습니다. `/auth/error?error=...`처럼 메시지를 쿼리 스트링으로 넘기는 starter 방식은 화면에 그대로 출력되므로, 새 흐름에서는 사용자용 문구로 바꿔서 전달합니다.
- **`NEXT_PUBLIC_` 변수**는 브라우저에 노출됩니다. 비밀 키는 서버 전용 환경 변수에 둡니다 (`.env`는 커밋하지 않고 `.env.example`에 키 이름만 기록).
- **리다이렉트 대상**: `next` 같은 쿼리 파라미터로 받은 이동 경로는 `/`로 시작하는 내부 경로인지 확인합니다. 현재는 그런 파라미터를 받는 라우트가 없습니다(`app/auth/confirm/route.ts`는 삭제됨).

## 안티패턴

```tsx
// 금지: 클라이언트 검증만 수행하고 서버 검증 없음
// 금지: 입력마다 전체 객체를 setState (RHF 사용 또는 비제어 입력)
// 금지: Action을 transition 밖에서 직접 호출 (startTransition 필수)
// 금지: 필요한 로그인/권한 확인 생략 (getClaims, RLS)
// 금지: try/catch 안에서 redirect() 호출
// 금지: 사용자 입력 오류를 throw로 처리 (반환값 사용)
// 금지: 서버 전용 모듈(@/lib/supabase/server)을 Client Component 폼에서 import
// 금지: 사용자 데이터를 'use cache'로 캐시
// 금지: 폼 필드를 div + space-y-* 로 배치 (FieldGroup + Field 사용)
// 금지: Supabase 오류 메시지를 사용자에게 그대로 노출
```

## 체크리스트

**필수**

- [ ] 스키마를 `lib/schemas/`에서 클라이언트·서버가 공유
- [ ] Zod 4 API 사용 (`z.email()`, `{ error }`, `z.flattenError`)
- [ ] Server Action에서 `safeParse` + `getClaims()` 로그인 확인
- [ ] 테이블에 RLS 정책 적용 확인
- [ ] `FieldGroup` / `Field`, 오류는 `data-invalid` + `aria-invalid`
- [ ] 로딩(`isPending`)과 오류 메시지 UI (`text-destructive`)
- [ ] 접근성: `<label>` 연결, `role="status"`/`role="alert"`

**권장**

- [ ] 변경 후 `updateTag` / `revalidateTag(tag, "max")` (캐시를 쓰는 경우)
- [ ] 파일 업로드는 직접 업로드 + 크기/형식 제한
- [ ] 다단계/자동 저장 폼의 Effect cleanup
- [ ] 폼 흐름의 E2E 테스트 추가 (`e2e/*.spec.ts`)

**품질**

- [ ] `npm run lint`
- [ ] `npm run check`
- [ ] `npm run build`

## 참고

- 번들 문서: `node_modules/next/dist/docs/01-app/02-guides/forms.md`, `server-actions.md`, `data-security.md`
- shadcn 스킬: `.agents/skills/shadcn/rules/forms.md`
- Supabase 스킬: `.agents/skills/supabase/SKILL.md`, `.agents/skills/supabase-postgres-best-practices/`
- [React Hook Form](https://react-hook-form.com/), [Zod 4](https://zod.dev/)
