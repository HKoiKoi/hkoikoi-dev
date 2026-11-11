import { z } from "zod";

// 이력·프로젝트·논문 스키마가 공유하는 필드 규칙.
// zod `.max`는 UTF-16 코드 단위, DB `char_length`는 코드포인트 기준이라 zod가 더 엄격한 안전한 방향이다.

/** 공백을 다듬은 필수 문자열(1자 이상) */
export function requiredText(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, { error: `${label}을(를) 입력해 주세요.` })
    .max(max, { error: `${label}은(는) ${max}자 이하로 입력해 주세요.` });
}

/** 공백을 다듬은 문자열. 빈 값은 허용하고 그대로 둔다(DB가 not null + default '' 인 열용). */
export function text(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, { error: `${label}은(는) ${max}자 이하로 입력해 주세요.` });
}

/** 공백을 다듬은 선택 문자열. 빈 값은 null로 바꾼다(DB가 nullable인 열용). */
export function optionalText(label: string, max: number) {
  return text(label, max).transform((value) => value || null);
}

/** 태그 배열: trim·빈 값·중복 제거 뒤 개수와 원소 길이를 검사한다. */
export function tagList(label: string, maxCount: number, maxLength: number) {
  return z
    .array(
      z
        .string()
        .trim()
        .max(maxLength, {
          error: `${label}은(는) ${maxLength}자 이하로 입력해 주세요.`,
        }),
    )
    .transform((tags) => [...new Set(tags.filter(Boolean))])
    .refine((tags) => tags.length <= maxCount, {
      error: `${label}은(는) 최대 ${maxCount}개까지 사용할 수 있습니다.`,
    });
}

function isHttpsUrl(value: string): boolean {
  // DB check(`~ '^https://'`)와 같이 대소문자를 구분해 "https://"로 시작해야 한다.
  if (!value.startsWith("https://")) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** 선택 링크: https URL만 허용하고 빈 값은 null로 바꾼다. javascript: 등은 거부한다. */
export function optionalHttpsUrl(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, { error: `${label}은(는) ${max}자 이하로 입력해 주세요.` })
    .refine((value) => value === "" || isHttpsUrl(value), {
      error: `${label}은(는) https:// 로 시작하는 올바른 주소여야 합니다.`,
    })
    .transform((value) => value || null);
}

/** FormData의 문자열 값을 꺼낸다. 없거나 파일이면 빈 문자열이다. */
export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
