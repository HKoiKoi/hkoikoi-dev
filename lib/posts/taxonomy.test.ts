import { describe, expect, it } from "vitest";

import { countTaxonomy, EMPTY_TAXONOMY, splitTopTags } from "./taxonomy";

describe("countTaxonomy", () => {
  it("빈 입력이면 빈 목록을 돌려준다", () => {
    expect(countTaxonomy([])).toEqual({ categories: [], tags: [] });
    expect(EMPTY_TAXONOMY).toEqual({ categories: [], tags: [] });
  });

  it("카테고리와 태그별 글 수를 센다", () => {
    const result = countTaxonomy([
      { category: "개발", tags: ["react", "nextjs"] },
      { category: "개발", tags: ["react"] },
      { category: "일상", tags: [] },
    ]);

    expect(result.categories).toEqual([
      { name: "개발", count: 2 },
      { name: "일상", count: 1 },
    ]);
    expect(result.tags).toEqual([
      { name: "nextjs", count: 1 },
      { name: "react", count: 2 },
    ]);
  });

  it("한 글에 중복된 태그는 한 번만 센다", () => {
    const result = countTaxonomy([{ category: "개발", tags: ["a", "a"] }]);
    expect(result.tags).toEqual([{ name: "a", count: 1 }]);
  });

  it("대소문자만 다른 태그는 별개로 센다", () => {
    const result = countTaxonomy([
      { category: "개발", tags: ["Next.js"] },
      { category: "개발", tags: ["next.js"] },
    ]);
    expect(result.tags).toEqual([
      { name: "Next.js", count: 1 },
      { name: "next.js", count: 1 },
    ]);
  });

  it("이름을 숫자·기호, 영문, 한글, 기타 순으로 정렬한다", () => {
    const result = countTaxonomy([
      {
        category: "개발",
        tags: ["react", "회고", "Next.js", "AI", "가나다", "2026"],
      },
    ]);
    expect(result.tags.map((tag) => tag.name)).toEqual([
      "2026",
      "AI",
      "Next.js",
      "react",
      "가나다",
      "회고",
    ]);
  });

  it("기본 카테고리 '일반'을 맨 앞에 고정하지 않는다", () => {
    const result = countTaxonomy([
      { category: "일반", tags: [] },
      { category: "개발", tags: [] },
      { category: "Life", tags: [] },
    ]);
    expect(result.categories.map((category) => category.name)).toEqual([
      "Life",
      "개발",
      "일반",
    ]);
  });
});

describe("splitTopTags", () => {
  const tags = [
    { name: "c", count: 1 },
    { name: "a", count: 5 },
    { name: "b", count: 3 },
    { name: "d", count: 3 },
  ];

  it("글 수 상위 limit개를 이름 순으로 보여 주고 나머지를 따로 돌려준다", () => {
    const { visible, rest } = splitTopTags(tags, undefined, 2);
    expect(visible.map((t) => t.name)).toEqual(["a", "b"]);
    expect(rest.map((t) => t.name)).toEqual(["c", "d"]);
  });

  it("글 수가 같으면 이름 규칙 순으로 고른다", () => {
    const { visible } = splitTopTags(tags, undefined, 3);
    expect(visible.map((t) => t.name)).toEqual(["a", "b", "d"]);
  });

  it("선택된 태그는 상위에 없어도 반드시 포함한다", () => {
    const { visible, rest } = splitTopTags(tags, "c", 2);
    expect(visible.map((t) => t.name)).toEqual(["a", "c"]);
    expect(rest.map((t) => t.name)).toEqual(["b", "d"]);
  });

  it("태그가 limit 이하이면 나머지는 비어 있다", () => {
    const { visible, rest } = splitTopTags(tags, undefined, 12);
    expect(visible).toHaveLength(4);
    expect(rest).toEqual([]);
  });

  it("목록에 없는 선택 태그는 무시하고 빈 입력도 처리한다", () => {
    expect(splitTopTags(tags, "없음", 2).visible.map((t) => t.name)).toEqual([
      "a",
      "b",
    ]);
    expect(splitTopTags([], "a", 12)).toEqual({ visible: [], rest: [] });
  });
});
