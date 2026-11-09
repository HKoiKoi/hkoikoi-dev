import { describe, expect, it } from "vitest";

import { buildBlogHref, parseListParams } from "./list-params";

describe("parseListParams", () => {
  it("category와 tag를 읽는다", () => {
    expect(parseListParams({ category: "개발", tag: "nextjs" })).toEqual({
      category: "개발",
      tag: "nextjs",
    });
  });

  it("배열이면 첫 값을 사용한다", () => {
    expect(parseListParams({ tag: ["a", "b"] })).toEqual({ tag: "a" });
  });

  it("빈 값·공백·undefined·빈 배열은 무시한다", () => {
    expect(parseListParams({ category: "", tag: "   " })).toEqual({});
    expect(parseListParams({ category: undefined })).toEqual({});
    expect(parseListParams({ tag: [] })).toEqual({});
  });

  it("앞뒤 공백을 제거한다", () => {
    expect(parseListParams({ tag: "  react " })).toEqual({ tag: "react" });
  });

  it("50자는 허용하고 51자는 무시한다", () => {
    expect(parseListParams({ tag: "a".repeat(50) })).toEqual({
      tag: "a".repeat(50),
    });
    expect(parseListParams({ tag: "a".repeat(51) })).toEqual({});
  });

  it("NFD 한글을 NFC로 정규화한다", () => {
    const nfd = "한글".normalize("NFD");
    expect(nfd).not.toBe("한글");
    expect(parseListParams({ category: nfd })).toEqual({ category: "한글" });
  });

  it("알 수 없는 키는 무시한다", () => {
    expect(parseListParams({ page: "2", q: "x" })).toEqual({});
  });
});

describe("buildBlogHref", () => {
  it("조건이 없으면 /blog를 돌려준다", () => {
    expect(buildBlogHref({}, {})).toBe("/blog");
    expect(buildBlogHref({})).toBe("/blog");
  });

  it("patch로 조건을 설정한다", () => {
    expect(buildBlogHref({}, { tag: "react" })).toBe("/blog?tag=react");
  });

  it("다른 조건은 유지한다", () => {
    expect(buildBlogHref({ tag: "react" }, { category: "개발" })).toBe(
      `/blog?category=${encodeURIComponent("개발")}&tag=react`,
    );
  });

  it("값이 undefined인 키는 해제한다", () => {
    expect(
      buildBlogHref(
        { category: "개발", tag: "react" },
        { category: undefined },
      ),
    ).toBe("/blog?tag=react");
  });

  it("둘 다 해제하면 /blog를 돌려준다", () => {
    expect(
      buildBlogHref(
        { category: "개발", tag: "react" },
        { category: undefined, tag: undefined },
      ),
    ).toBe("/blog");
  });

  it("patch 값이 현재 조건을 덮어쓴다", () => {
    expect(buildBlogHref({ tag: "a" }, { tag: "b" })).toBe("/blog?tag=b");
  });

  it("특수문자와 한글을 인코딩하고 parseListParams로 되돌릴 수 있다", () => {
    const tag = "C++ & 한글/태그?";
    const href = buildBlogHref({}, { tag });
    const parsed = parseListParams(
      Object.fromEntries(new URL(href, "http://x").searchParams),
    );
    expect(parsed).toEqual({ tag });
    expect(href).not.toContain(" ");
    expect(href).not.toContain("&  ");
  });
});
