import type { Metadata } from "next";

import { buildBlogHref, type ListParams } from "@/lib/posts/list-params";
import { absoluteUrl } from "@/lib/site-url";

export const BLOG_DESCRIPTION = "개발과 일상에 대한 글을 모아둔 블로그입니다.";

/**
 * /blog 목록 메타데이터. title은 page 값만으로 정하고(2페이지 이상만 "(n페이지)"),
 * canonical은 필터·page를 포함한 자기 자신 URL이다.
 * 검색(q)이 있는 URL은 키 공간이 무한해 색인하지 않고(noindex), canonical은 검색어와 page를 뺀
 * 필터 목록 URL로 모은다. 1자라 검색하지 않은 q(qTooShort)도 같은 URL 변형이므로 똑같이 다룬다.
 */
export function buildBlogListMetadata(params: ListParams): Metadata {
  const page = params.page ?? 1;
  const searching = Boolean(params.q || params.qTooShort);
  const canonicalParams: ListParams = searching
    ? { category: params.category, tag: params.tag }
    : params;
  return {
    title: page > 1 ? `블로그 (${page}페이지)` : "블로그",
    description: BLOG_DESCRIPTION,
    alternates: { canonical: absoluteUrl(buildBlogHref(canonicalParams, {})) },
    ...(searching && { robots: { index: false } }),
  };
}
