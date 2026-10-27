import { z } from "zod";

import { slugify } from "@/lib/posts/slugify";

export const POST_LIMITS = {
  title: 200,
  excerpt: 150,
  content: 100000,
  tags: 10,
} as const;

const DEFAULT_CATEGORY = "일반";
const BUCKET_PATH = "/storage/v1/object/public/blog-images/";

/** 쉼표로 구분된 입력을 trim·빈 값 제거·중복 제거한 태그 배열로 바꾼다. */
export function parseTags(raw: string): string[] {
  const tags = raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(tags)];
}

/** 환경변수가 없으면 null을 돌려주어 값이 있는 썸네일을 모두 거부하게 한다. */
function getThumbnailPrefix(): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base.replace(/\/+$/, "")}${BUCKET_PATH}` : null;
}

export const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "제목을 입력해 주세요." })
    .max(POST_LIMITS.title, {
      error: `제목은 ${POST_LIMITS.title}자 이하로 입력해 주세요.`,
    }),
  slug: z
    .string()
    .transform((value) => value.normalize("NFC"))
    .refine((value) => value.length > 0 && slugify(value) === value, {
      error: "사용할 수 없는 슬러그입니다.",
    }),
  category: z
    .string()
    .trim()
    .transform((value) => value || DEFAULT_CATEGORY),
  tags: z
    .array(z.string().trim())
    .transform((tags) => [...new Set(tags.filter(Boolean))])
    .refine((tags) => tags.length <= POST_LIMITS.tags, {
      error: `태그는 최대 ${POST_LIMITS.tags}개까지 사용할 수 있습니다.`,
    }),
  excerpt: z.string().max(POST_LIMITS.excerpt, {
    error: `소개글은 ${POST_LIMITS.excerpt}자 이하로 입력해 주세요.`,
  }),
  content: z.string().max(POST_LIMITS.content, {
    error: `본문은 ${POST_LIMITS.content}자 이하로 입력해 주세요.`,
  }),
  thumbnail_url: z
    .string()
    .trim()
    .transform((value) => value || null)
    .refine(
      (value) => {
        if (value === null) return true;
        const prefix = getThumbnailPrefix();
        return prefix !== null && value.startsWith(prefix);
      },
      { error: "업로드한 이미지 주소만 사용할 수 있습니다." },
    ),
  published: z.boolean(),
});

export type PostActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
