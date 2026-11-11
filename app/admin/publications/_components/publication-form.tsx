"use client";

import { useActionState } from "react";
import { FormActions } from "@/app/admin/_components/form-actions";
import { FormField } from "@/app/admin/_components/form-field";
import { savePublication } from "@/app/admin/publications/actions";
import type { AdminFormState } from "@/lib/schemas/admin-form";

const initialState: AdminFormState = { ok: false };

interface PublicationFormProps {
  /** 수정 모드일 때 논문 id. 없으면 새 논문. */
  publicationId?: string;
  initialValues?: Record<string, string>;
}

// 논문 폼
export function PublicationForm({
  publicationId,
  initialValues,
}: PublicationFormProps) {
  const [state, formAction, isPending] = useActionState(
    savePublication,
    initialState,
  );
  const values = state.values ?? initialValues ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5">
      {publicationId && <input type="hidden" name="id" value={publicationId} />}

      <FormField
        name="title"
        label="제목"
        required
        defaultValue={values.title ?? ""}
        errors={errors.title}
      />
      <FormField
        name="authors"
        label="저자"
        defaultValue={values.authors ?? ""}
        errors={errors.authors}
      />
      <FormField
        name="venue"
        label="게재처"
        defaultValue={values.venue ?? ""}
        errors={errors.venue}
      />
      <FormField
        name="year"
        label="연도"
        required
        inputMode="numeric"
        defaultValue={values.year ?? ""}
        errors={errors.year}
        hint="1900년부터 2100년까지 입력할 수 있습니다."
      />
      <FormField
        name="link"
        label="링크"
        inputMode="url"
        defaultValue={values.link ?? ""}
        errors={errors.link}
        hint="https:// 로 시작하는 주소만 사용할 수 있습니다."
      />

      <FormActions
        pending={isPending}
        message={state.ok ? undefined : state.message}
        cancelHref="/admin/publications"
      />
    </form>
  );
}
