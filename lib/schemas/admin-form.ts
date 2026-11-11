import { z } from "zod";

import { formString } from "@/lib/schemas/fields";

// 이력·프로젝트·논문 관리자 폼이 공유하는 Server Action 상태 (useActionState)
export type AdminFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  // 검증 실패 시 입력값을 유지하기 위해 돌려주는 원본 값
  values?: Record<string, string>;
};

/** 폼 입력 원본을 키별 문자열로 모은다(체크박스는 체크됐을 때만 값이 와서 "on"/빈 문자열이 된다). */
export function formValues(
  formData: FormData,
  keys: readonly string[],
): Record<string, string> {
  return Object.fromEntries(
    keys.map((key) => [key, formString(formData, key)]),
  );
}

/** zod 검증 실패를 필드별 오류와 입력값 유지용 values로 바꾼다. */
export function validationFailure(
  error: z.ZodError,
  formData: FormData,
  keys: readonly string[],
): AdminFormState {
  return {
    ok: false,
    message: "입력값을 확인해 주세요.",
    fieldErrors: z.flattenError(error).fieldErrors,
    values: formValues(formData, keys),
  };
}
