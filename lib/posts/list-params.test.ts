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
    expect(parseListParams({ sort: "old", foo: "bar" })).toEqual({});
  });

  describe("q", () => {
    it("검색어를 읽는다", () => {
      expect(parseListParams({ q: "캐시" })).toEqual({ q: "캐시" });
    });

    it("앞뒤 공백을 제거하고 안쪽 공백은 유지한다", () => {
      expect(parseListParams({ q: "  next js " })).toEqual({ q: "next js" });
    });

    it("NFD 한글을 NFC로 정규화한다", () => {
      const nfd = "캐시".normalize("NFD");
      expect(nfd).not.toBe("캐시");
      expect(parseListParams({ q: nfd })).toEqual({ q: "캐시" });
    });

    it("50자는 그대로, 51자 이상은 50자로 자른다", () => {
      expect(parseListParams({ q: "a".repeat(50) })).toEqual({
        q: "a".repeat(50),
      });
      expect(parseListParams({ q: "a".repeat(51) })).toEqual({
        q: "a".repeat(50),
      });
      expect(parseListParams({ q: "a".repeat(500) })).toEqual({
        q: "a".repeat(50),
      });
    });

    it("1자는 검색하지 않고 qTooShort와 원문을 돌려준다", () => {
      expect(parseListParams({ q: "a" })).toEqual({
        qTooShort: true,
        rawQ: "a",
      });
      expect(parseListParams({ q: " 가 " })).toEqual({
        qTooShort: true,
        rawQ: "가",
      });
    });

    it("2자는 검색한다", () => {
      expect(parseListParams({ q: "ab" })).toEqual({ q: "ab" });
    });

    it("빈 값·공백·undefined·빈 배열은 무시한다", () => {
      expect(parseListParams({ q: "" })).toEqual({});
      expect(parseListParams({ q: "   " })).toEqual({});
      expect(parseListParams({ q: undefined })).toEqual({});
      expect(parseListParams({ q: [] })).toEqual({});
    });

    it("배열이면 첫 값을 사용한다", () => {
      expect(parseListParams({ q: ["캐시", "태그"] })).toEqual({ q: "캐시" });
    });

    it("% _ 쉼표 따옴표 같은 특수문자도 그대로 읽는다", () => {
      expect(parseListParams({ q: "100%_a,b)'" })).toEqual({
        q: "100%_a,b)'",
      });
    });

    it("category·tag·page와 함께 읽는다", () => {
      expect(
        parseListParams({ q: "캐시", category: "개발", tag: "x", page: "2" }),
      ).toEqual({ q: "캐시", category: "개발", tag: "x", page: 2 });
    });
  });

  describe("page", () => {
    it("2 이상의 정수를 읽는다", () => {
      expect(parseListParams({ page: "2" })).toEqual({ page: 2 });
      expect(parseListParams({ page: " 15 " })).toEqual({ page: 15 });
    });

    it("1페이지는 기본값이라 결과에 넣지 않는다", () => {
      expect(parseListParams({ page: "1" })).toEqual({});
      expect(parseListParams({ page: "01" })).toEqual({});
    });

    it("정수가 아니거나 1 미만이면 무시한다", () => {
      for (const page of ["abc", "0", "-1", "1.5", "", "2abc", "1e3", "NaN"]) {
        expect(parseListParams({ page })).toEqual({});
      }
    });

    it("배열이면 첫 값을 사용한다", () => {
      expect(parseListParams({ page: ["3", "5"] })).toEqual({ page: 3 });
      expect(parseListParams({ page: [] })).toEqual({});
    });

    it("상한(10000)을 넘으면 상한으로 고정한다", () => {
      expect(parseListParams({ page: "10000" })).toEqual({ page: 10000 });
      expect(parseListParams({ page: "10001" })).toEqual({ page: 10000 });
      expect(parseListParams({ page: "9".repeat(30) })).toEqual({
        page: 10000,
      });
    });

    it("필터와 함께 읽는다", () => {
      expect(parseListParams({ tag: "react", page: "2" })).toEqual({
        tag: "react",
        page: 2,
      });
    });
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

  describe("q", () => {
    it("q를 설정하고 다른 조건은 유지한다", () => {
      expect(buildBlogHref({ tag: "react" }, { q: "캐시" })).toBe(
        `/blog?tag=react&q=${encodeURIComponent("캐시")}`,
      );
    });

    it("q만 있는 현재 조건을 그대로 유지한다", () => {
      expect(buildBlogHref({ q: "캐시" })).toBe(
        `/blog?q=${encodeURIComponent("캐시")}`,
      );
    });

    it("category·tag 변경 시 q를 유지한다", () => {
      expect(buildBlogHref({ q: "캐시" }, { tag: "react" })).toBe(
        `/blog?tag=react&q=${encodeURIComponent("캐시")}`,
      );
    });

    it("q를 해제하면 다른 조건은 남기고 없으면 /blog를 돌려준다", () => {
      expect(buildBlogHref({ tag: "react", q: "캐시" }, { q: undefined })).toBe(
        "/blog?tag=react",
      );
      expect(buildBlogHref({ q: "캐시" }, { q: undefined })).toBe("/blog");
    });

    it("qTooShort 상태는 href에 q를 남기지 않는다", () => {
      expect(buildBlogHref({ tag: "react", qTooShort: true, rawQ: "a" })).toBe(
        "/blog?tag=react",
      );
    });

    it("q가 바뀌거나 해제되면 page를 지운다", () => {
      expect(buildBlogHref({ q: "가나", page: 3 }, { q: "다라" })).toBe(
        `/blog?q=${encodeURIComponent("다라")}`,
      );
      expect(
        buildBlogHref({ tag: "a", q: "가나", page: 3 }, { q: undefined }),
      ).toBe("/blog?tag=a");
    });

    it("page만 바꾸면 q를 유지한다", () => {
      expect(buildBlogHref({ q: "캐시" }, { page: 2 })).toBe(
        `/blog?q=${encodeURIComponent("캐시")}&page=2`,
      );
    });

    it("특수문자 검색어를 인코딩하고 parseListParams로 되돌릴 수 있다", () => {
      const q = "100%_a,b)' &=";
      const href = buildBlogHref({}, { q });
      const parsed = parseListParams(
        Object.fromEntries(new URL(href, "http://x").searchParams),
      );
      expect(parsed).toEqual({ q });
    });
  });

  describe("page", () => {
    it("page만 바꾸면 필터를 유지한다", () => {
      expect(
        buildBlogHref({ category: "개발", tag: "react" }, { page: 2 }),
      ).toBe(`/blog?category=${encodeURIComponent("개발")}&tag=react&page=2`);
    });

    it("page를 지정하지 않으면 현재 page를 유지한다", () => {
      expect(buildBlogHref({ page: 3 })).toBe("/blog?page=3");
    });

    it("1페이지와 undefined는 쿼리에 쓰지 않는다", () => {
      expect(buildBlogHref({ tag: "react", page: 3 }, { page: 1 })).toBe(
        "/blog?tag=react",
      );
      expect(buildBlogHref({ page: 3 }, { page: undefined })).toBe("/blog");
    });

    it("category가 바뀌면 page를 지운다", () => {
      expect(
        buildBlogHref({ tag: "react", page: 3 }, { category: "개발" }),
      ).toBe(`/blog?category=${encodeURIComponent("개발")}&tag=react`);
    });

    it("tag가 바뀌거나 해제돼도 page를 지운다", () => {
      expect(buildBlogHref({ tag: "a", page: 3 }, { tag: "b" })).toBe(
        "/blog?tag=b",
      );
      expect(buildBlogHref({ tag: "a", page: 3 }, { tag: undefined })).toBe(
        "/blog",
      );
    });

    it("같은 값으로 필터를 다시 지정해도 page를 지운다", () => {
      expect(buildBlogHref({ tag: "a", page: 3 }, { tag: "a" })).toBe(
        "/blog?tag=a",
      );
    });

    it("patch에 필터와 page가 함께 있으면 page를 따른다", () => {
      expect(buildBlogHref({ page: 3 }, { tag: "a", page: 2 })).toBe(
        "/blog?tag=a&page=2",
      );
    });

    it("parseListParams로 되돌릴 수 있다", () => {
      const href = buildBlogHref({ category: "개발" }, { page: 4 });
      const parsed = parseListParams(
        Object.fromEntries(new URL(href, "http://x").searchParams),
      );
      expect(parsed).toEqual({ category: "개발", page: 4 });
    });
  });
});
