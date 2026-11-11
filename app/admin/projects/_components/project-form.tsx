"use client";

import { useActionState } from "react";
import { FormActions } from "@/app/admin/_components/form-actions";
import { FormField } from "@/app/admin/_components/form-field";
import { saveProject } from "@/app/admin/projects/actions";
import { Label } from "@/components/ui/label";
import type { AdminFormState } from "@/lib/schemas/admin-form";

const initialState: AdminFormState = { ok: false };

interface ProjectFormProps {
  /** 수정 모드일 때 프로젝트 id. 없으면 새 프로젝트. */
  projectId?: string;
  initialValues?: Record<string, string>;
}

// 프로젝트 폼. 대표 프로젝트(featured)는 체크박스이며 체크됐을 때만 "on"이 제출된다.
export function ProjectForm({ projectId, initialValues }: ProjectFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveProject,
    initialState,
  );
  const values = state.values ?? initialValues ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5">
      {projectId && <input type="hidden" name="id" value={projectId} />}

      <FormField
        name="name"
        label="프로젝트 이름"
        required
        defaultValue={values.name ?? ""}
        errors={errors.name}
      />
      <FormField
        name="summary"
        label="소개"
        multiline
        rows={4}
        defaultValue={values.summary ?? ""}
        errors={errors.summary}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          name="period"
          label="기간"
          defaultValue={values.period ?? ""}
          errors={errors.period}
          placeholder="2024.01 - 2024.06"
        />
        <FormField
          name="role"
          label="역할"
          defaultValue={values.role ?? ""}
          errors={errors.role}
        />
      </div>
      <FormField
        name="stack"
        label="기술 스택"
        defaultValue={values.stack ?? ""}
        errors={errors.stack}
        hint="쉼표로 구분합니다. 최대 20개."
      />
      <FormField
        name="github_url"
        label="GitHub 주소"
        inputMode="url"
        defaultValue={values.github_url ?? ""}
        errors={errors.github_url}
        hint="https:// 로 시작하는 주소만 사용할 수 있습니다."
      />
      <FormField
        name="demo_url"
        label="데모 주소"
        inputMode="url"
        defaultValue={values.demo_url ?? ""}
        errors={errors.demo_url}
        hint="https:// 로 시작하는 주소만 사용할 수 있습니다."
      />

      <div className="flex items-center gap-2">
        {/* 제출 실패 뒤 입력값 유지를 위해 key로 기본값을 다시 반영한다. */}
        <input
          key={values.featured === "on" ? "on" : "off"}
          id="field-featured"
          name="featured"
          type="checkbox"
          defaultChecked={values.featured === "on"}
          className="size-4 accent-primary"
        />
        <Label htmlFor="field-featured">홈에 대표 프로젝트로 표시</Label>
      </div>

      <FormActions
        pending={isPending}
        message={state.ok ? undefined : state.message}
        cancelHref="/admin/projects"
      />
    </form>
  );
}
