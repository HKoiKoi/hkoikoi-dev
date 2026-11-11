import { z } from "zod";

import {
  formString,
  optionalHttpsUrl,
  optionalText,
  requiredText,
  tagList,
} from "@/lib/schemas/fields";
import { parseTags } from "@/lib/schemas/post";
import type { ResumeEntryRow } from "@/lib/types/resume";

// DB check 제약과 같은 한도
export const RESUME_LIMITS = {
  title: 200,
  subtitle: 200,
  period: 100,
  description: 2000,
  grade: 50,
  gradeLabel: 50,
  tags: 20,
  tag: 50,
  tagGroups: 10,
  tagGroupLabel: 50,
  link: 500,
} as const;

export type TagGroup = { label: string; tags: string[] };

/**
 * 줄마다 '라벨: 태그, 태그' 형식인 텍스트를 태그 그룹 배열로 바꾼다.
 * 빈 줄은 건너뛰고, 첫 ':'(전각 '：' 포함)을 기준으로 나눈다.
 * ':'가 없는 줄은 태그가 빈 그룹이 되어 스키마 검증에서 형식 오류로 거부된다.
 */
export function parseTagGroups(raw: string): TagGroup[] {
  const groups: TagGroup[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const index = trimmed.search(/[:：]/);
    if (index === -1) {
      groups.push({ label: trimmed, tags: [] });
      continue;
    }
    groups.push({
      label: trimmed.slice(0, index).trim(),
      tags: parseTags(trimmed.slice(index + 1)),
    });
  }
  return groups;
}

/** 저장된 그룹을 폼 textarea 값('라벨: 태그, 태그' 줄)으로 되돌린다. */
export function formatTagGroups(groups: TagGroup[]): string {
  return groups.map((g) => `${g.label}: ${g.tags.join(", ")}`).join("\n");
}

const tagGroupSchema = z.object({
  label: requiredText("그룹 이름", RESUME_LIMITS.tagGroupLabel),
  tags: tagList("그룹 태그", RESUME_LIMITS.tags, RESUME_LIMITS.tag).refine(
    (tags) => tags.length > 0,
    { error: "각 줄은 '라벨: 태그, 태그' 형식으로 입력해 주세요." },
  ),
});

export const resumeEntrySchema = z.object({
  title: requiredText("제목", RESUME_LIMITS.title),
  subtitle: optionalText("부제목", RESUME_LIMITS.subtitle),
  period: optionalText("기간", RESUME_LIMITS.period),
  description: optionalText("설명", RESUME_LIMITS.description),
  grade: optionalText("강조 수치", RESUME_LIMITS.grade),
  grade_label: optionalText("강조 수치 이름", RESUME_LIMITS.gradeLabel),
  tags: tagList("태그", RESUME_LIMITS.tags, RESUME_LIMITS.tag),
  tag_groups: z.array(tagGroupSchema).max(RESUME_LIMITS.tagGroups, {
    error: `태그 그룹은 최대 ${RESUME_LIMITS.tagGroups}개까지 사용할 수 있습니다.`,
  }),
  link: optionalHttpsUrl("링크", RESUME_LIMITS.link),
});

/** FormData를 resumeEntrySchema 입력 객체로 바꾼다. */
export function parseResumeFormData(formData: FormData) {
  return {
    title: formString(formData, "title"),
    subtitle: formString(formData, "subtitle"),
    period: formString(formData, "period"),
    description: formString(formData, "description"),
    grade: formString(formData, "grade"),
    grade_label: formString(formData, "grade_label"),
    tags: parseTags(formString(formData, "tags")),
    tag_groups: parseTagGroups(formString(formData, "tag_groups")),
    link: formString(formData, "link"),
  };
}

/** jsonb는 형태를 보장하지 않으므로 [{ label, tags[] }]가 아닌 값은 버린다. */
function coerceTagGroups(value: unknown): TagGroup[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { label, tags } = item as { label?: unknown; tags?: unknown };
    if (typeof label !== "string" || !Array.isArray(tags)) return [];
    return [
      {
        label,
        tags: tags.filter((tag): tag is string => typeof tag === "string"),
      },
    ];
  });
}

/** 저장된 이력 항목을 수정 폼의 입력값(문자열)으로 바꾼다. */
export function entryToFormValues(row: ResumeEntryRow): Record<string, string> {
  return {
    title: row.title,
    subtitle: row.subtitle ?? "",
    period: row.period ?? "",
    description: row.description ?? "",
    grade: row.grade ?? "",
    grade_label: row.grade_label ?? "",
    tags: row.tags.join(", "),
    tag_groups: formatTagGroups(coerceTagGroups(row.tag_groups)),
    link: row.link ?? "",
  };
}
