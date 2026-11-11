import { z } from "zod";

import {
  formString,
  optionalHttpsUrl,
  requiredText,
  tagList,
  text,
} from "@/lib/schemas/fields";
import { parseTags } from "@/lib/schemas/post";

// DB check 제약과 같은 한도
export const PROJECT_LIMITS = {
  name: 200,
  summary: 1000,
  period: 100,
  role: 100,
  stack: 20,
  stackItem: 50,
  url: 500,
} as const;

export const projectSchema = z.object({
  name: requiredText("프로젝트 이름", PROJECT_LIMITS.name),
  summary: text("소개", PROJECT_LIMITS.summary),
  period: text("기간", PROJECT_LIMITS.period),
  role: text("역할", PROJECT_LIMITS.role),
  stack: tagList("기술 스택", PROJECT_LIMITS.stack, PROJECT_LIMITS.stackItem),
  github_url: optionalHttpsUrl("GitHub 주소", PROJECT_LIMITS.url),
  demo_url: optionalHttpsUrl("데모 주소", PROJECT_LIMITS.url),
  featured: z.boolean(),
});

/** FormData를 projectSchema 입력 객체로 바꾼다. 체크박스는 체크됐을 때만 값이 온다. */
export function parseProjectFormData(formData: FormData) {
  return {
    name: formString(formData, "name"),
    summary: formString(formData, "summary"),
    period: formString(formData, "period"),
    role: formString(formData, "role"),
    stack: parseTags(formString(formData, "stack")),
    github_url: formString(formData, "github_url"),
    demo_url: formString(formData, "demo_url"),
    featured: formData.get("featured") === "on",
  };
}
