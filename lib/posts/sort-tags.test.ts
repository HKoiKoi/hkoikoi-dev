import { describe, expect, it } from "vitest";

import { compareTagNames, sortTags } from "./sort-tags";

describe("sortTags", () => {
  it("숫자·기호 → 영문 → 한글 순으로 정렬한다", () => {
    expect(
      sortTags(["react", "회고", "Next.js", "AI", "가나다", "2026"]),
    ).toEqual(["2026", "AI", "Next.js", "react", "가나다", "회고"]);
  });

  it("기호로 시작하는 태그도 숫자·기호 그룹에 둔다", () => {
    // 기호끼리의 순서는 collator가 정하므로 그룹 위치만 확인한다
    const result = sortTags(["next", "_draft", "#tip"]);
    expect(result[2]).toBe("next");
    expect(result.slice(0, 2).sort()).toEqual(["#tip", "_draft"]);
  });

  it("대소문자만 다른 태그는 입력 순서와 무관하게 같은 순서가 된다", () => {
    expect(sortTags(["react", "React"])).toEqual(["React", "react"]);
    expect(sortTags(["React", "react"])).toEqual(["React", "react"]);
  });

  it("영문은 대소문자를 무시하고 비교한다", () => {
    expect(sortTags(["banana", "Apple", "cherry"])).toEqual([
      "Apple",
      "banana",
      "cherry",
    ]);
  });

  it("숫자는 크기순으로 비교한다", () => {
    expect(sortTags(["v10", "v2", "v1"])).toEqual(["v1", "v2", "v10"]);
  });

  it("한글은 가나다순으로 정렬한다", () => {
    expect(sortTags(["회고", "나무", "가지", "다리"])).toEqual([
      "가지",
      "나무",
      "다리",
      "회고",
    ]);
  });

  it("일본어·이모지 태그는 맨 뒤 그룹에 둔다", () => {
    expect(sortTags(["日本語", "🚀", "회고", "AI", "1"])).toEqual([
      "1",
      "AI",
      "회고",
      "🚀",
      "日本語",
    ]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const input = ["b", "a"];
    const result = sortTags(input);
    expect(input).toEqual(["b", "a"]);
    expect(result).not.toBe(input);
  });

  it("빈 배열과 빈 문자열을 처리한다", () => {
    expect(sortTags([])).toEqual([]);
    expect(sortTags(["a", ""])).toEqual(["a", ""]);
  });
});

describe("compareTagNames", () => {
  it("같은 이름은 0을 돌려준다", () => {
    expect(compareTagNames("react", "react")).toBe(0);
  });

  it("그룹이 다르면 그룹 순서로 비교한다", () => {
    expect(compareTagNames("zebra", "가")).toBeLessThan(0);
    expect(compareTagNames("1", "a")).toBeLessThan(0);
  });
});
