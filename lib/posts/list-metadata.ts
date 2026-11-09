import type { Metadata } from "next";

import { buildBlogHref, type ListParams } from "@/lib/posts/list-params";
import { absoluteUrl } from "@/lib/site-url";

export const BLOG_DESCRIPTION = "개발과 일상에 대한 글을 모아둔 블로그입니다.";

/**
 * /blog 목록 메타데이터. title은 page 값만으로 정하고(2페이지 이상만 "(n페이지)"),
 * canonical은 필터·page를 포함한 자기 자신 URL이다.
 */
export function buildBlogListMetadata(params: ListParams): Metadata {
  const page = params.page ?? 1;
  return {
    title: page > 1 ? `블로그 (${page}페이지)` : "블로그",
    description: BLOG_DESCRIPTION,
    alternates: { canonical: absoluteUrl(buildBlogHref(params, {})) },
  };
}
