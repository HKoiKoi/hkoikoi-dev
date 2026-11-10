import { describe, expect, it } from "vitest";

import { buildBlogListMetadata } from "@/lib/posts/list-metadata";
import { parseListParams } from "@/lib/posts/list-params";
import { absoluteUrl } from "@/lib/site-url";

const build = (search: Record<string, string>) =>
  buildBlogListMetadata(parseListParams(search));

describe("buildBlogListMetadata", () => {
  it("page가 없으면 기본 title과 /blog canonical", () => {
    const meta = build({});
    expect(meta.title).toBe("블로그");
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/blog"));
  });

  it("page 2 이상이면 title에 페이지를 붙이고 canonical에 page를 포함", () => {
    const meta = build({ page: "3" });
    expect(meta.title).toBe("블로그 (3페이지)");
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/blog?page=3"));
  });

  it.each(["1", "0", "-1", "abc", ""])("잘못된/1 page(%s)는 기본값", (page) => {
    const meta = build({ page });
    expect(meta.title).toBe("블로그");
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/blog"));
  });

  it("필터와 page를 canonical에 함께 담는다", () => {
    const meta = build({ category: "개발", page: "2" });
    expect(meta.title).toBe("블로그 (2페이지)");
    expect(meta.alternates?.canonical).toBe(
      absoluteUrl(`/blog?category=${encodeURIComponent("개발")}&page=2`),
    );
  });

  it("description을 유지한다", () => {
    expect(build({}).description).toBe(
      "개발과 일상에 대한 글을 모아둔 블로그입니다.",
    );
  });

  it("검색어가 있으면 noindex이고 canonical은 q와 page를 뺀 목록 URL", () => {
    const meta = build({ q: "캐시", page: "2" });
    expect(meta.robots).toEqual({ index: false });
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/blog"));
  });

  it("검색어와 필터가 함께 있으면 canonical에 필터만 남긴다", () => {
    const meta = build({ q: "캐시", category: "개발" });
    expect(meta.robots).toEqual({ index: false });
    expect(meta.alternates?.canonical).toBe(
      absoluteUrl(`/blog?category=${encodeURIComponent("개발")}`),
    );
  });

  it("1자 검색어도 noindex로 두고 canonical에서 q를 뺀다", () => {
    const meta = build({ q: "a" });
    expect(meta.robots).toEqual({ index: false });
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/blog"));
  });

  it("검색어가 없으면 robots를 지정하지 않는다", () => {
    expect(build({ category: "개발" }).robots).toBeUndefined();
  });
});
