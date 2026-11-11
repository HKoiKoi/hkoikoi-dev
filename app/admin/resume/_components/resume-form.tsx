"use client";

import { useActionState } from "react";
import { FormActions } from "@/app/admin/_components/form-actions";
import { FormField } from "@/app/admin/_components/form-field";
import { saveResumeEntry } from "@/app/admin/resume/actions";
import type { AdminFormState } from "@/lib/schemas/admin-form";
import type { ResumeSection } from "@/lib/types/resume";

const initialState: AdminFormState = { ok: false };

interface ResumeFormProps {
  section: ResumeSection;
  /** 수정 모드일 때 항목 id. 없으면 새 항목. */
  entryId?: string;
  /** 수정 모드의 초기 입력값 */
  initialValues?: Record<string, string>;
}

// 이력 항목 폼. 제출 실패 시 서버가 돌려준 입력값(state.values)을 그대로 유지한다.
export function ResumeForm({
  section,
  entryId,
  initialValues,
}: ResumeFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveResumeEntry,
    initialState,
  );
  const values = state.values ?? initialValues ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="section" value={section} />
      {entryId && <input type="hidden" name="id" value={entryId} />}

      <FormField
        name="title"
        label="제목"
        required
        defaultValue={values.title ?? ""}
        errors={errors.title}
        placeholder="회사·학교·자격증 이름"
      />
      <FormField
        name="subtitle"
        label="부제목"
        defaultValue={values.subtitle ?? ""}
        errors={errors.subtitle}
        placeholder="직무·전공 등"
      />
      <FormField
        name="period"
        label="기간"
        defaultValue={values.period ?? ""}
        errors={errors.period}
        placeholder="2020.03 - 2024.02"
      />
      <FormField
        name="description"
        label="설명"
        multiline
        rows={4}
        defaultValue={values.description ?? ""}
        errors={errors.description}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          name="grade"
          label="강조 수치"
          defaultValue={values.grade ?? ""}
          errors={errors.grade}
          hint="카드 오른쪽 아래에 강조해 보여 줍니다. 예: 3.87 / 4.5"
        />
        <FormField
          name="grade_label"
          label="강조 수치 이름"
          defaultValue={values.grade_label ?? ""}
          errors={errors.grade_label}
          hint="스크린리더가 읽을 이름입니다. 비우면 '평점'입니다."
        />
      </div>
      <FormField
        name="tags"
        label="태그"
        defaultValue={values.tags ?? ""}
        errors={errors.tags}
        hint="쉼표로 구분합니다. 최대 20개."
      />
      <FormField
        name="tag_groups"
        label="기술 스택 그룹"
        multiline
        rows={4}
        defaultValue={values.tag_groups ?? ""}
        errors={errors.tag_groups}
        hint="한 줄에 한 그룹, '라벨: 태그, 태그' 형식입니다. 최대 10줄."
        placeholder={"개발: React, Next.js\n데이터베이스: PostgreSQL"}
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
        cancelHref={`/admin/resume/${section}`}
      />
    </form>
  );
}
