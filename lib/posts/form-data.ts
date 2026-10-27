import { parseTags } from "@/lib/schemas/post";

/** 폼에서 꺼낸 원시 값. postSchema.safeParse에 그대로 넘긴다. */
export type RawPostFormData = {
  id: string | null;
  values: {
    title: string;
    slug: string;
    category: string;
    tags: string[];
    excerpt: string;
    content: string;
    thumbnail_url: string;
    published: boolean;
  };
};

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  // File 등 문자열이 아닌 값은 빈 문자열로 취급한다.
  return typeof value === "string" ? value : "";
}

/**
 * 편집기 FormData를 스키마 입력 객체로 바꾼다 (검증은 하지 않는다).
 * - published: 체크박스라 'on'일 때만 true
 * - tags: 쉼표 구분 문자열을 배열로
 * - thumbnail_url 빈 값 → null 변환은 스키마가 맡는다
 * - id: hidden 필드, 없거나 비면 null (신규 글)
 */
export function parsePostFormData(formData: FormData): RawPostFormData {
  return {
    id: getString(formData, "id").trim() || null,
    values: {
      title: getString(formData, "title"),
      slug: getString(formData, "slug"),
      category: getString(formData, "category"),
      tags: parseTags(getString(formData, "tags")),
      excerpt: getString(formData, "excerpt"),
      content: getString(formData, "content"),
      thumbnail_url: getString(formData, "thumbnail_url"),
      published: formData.get("published") === "on",
    },
  };
}
