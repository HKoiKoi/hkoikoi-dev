import { describe, expect, it } from "vitest";

import {
  getPageItems,
  getPageRange,
  getTotalPages,
  POSTS_PER_PAGE,
} from "./pagination";

describe("POSTS_PER_PAGE", () => {
  it("페이지당 12개다", () => {
    expect(POSTS_PER_PAGE).toBe(12);
  });
});

describe("getTotalPages", () => {
  it("글이 없어도 1페이지다", () => {
    expect(getTotalPages(0)).toBe(1);
  });

  it("12건은 1페이지, 13건은 2페이지다", () => {
    expect(getTotalPages(12)).toBe(1);
    expect(getTotalPages(13)).toBe(2);
  });

  it("24건은 2페이지, 25건은 3페이지다", () => {
    expect(getTotalPages(24)).toBe(2);
    expect(getTotalPages(25)).toBe(3);
  });
});

describe("getPageRange", () => {
  it("1페이지는 0~11이다", () => {
    expect(getPageRange(1)).toEqual({ from: 0, to: 11 });
  });

  it("2페이지는 12~23이다", () => {
    expect(getPageRange(2)).toEqual({ from: 12, to: 23 });
  });

  it("범위 길이는 항상 페이지 크기와 같다", () => {
    const { from, to } = getPageRange(5);
    expect(to - from + 1).toBe(POSTS_PER_PAGE);
  });
});

describe("getPageItems", () => {
  it("1페이지뿐이면 [1]이다", () => {
    expect(getPageItems(1, 1)).toEqual([1]);
  });

  it("7페이지 이하는 번호를 전부 나열한다", () => {
    expect(getPageItems(1, 2)).toEqual([1, 2]);
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("앞쪽 페이지는 뒤쪽만 생략한다", () => {
    expect(getPageItems(1, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(getPageItems(2, 10)).toEqual([1, 2, 3, "ellipsis", 10]);
  });

  it("뒤쪽 페이지는 앞쪽만 생략한다", () => {
    expect(getPageItems(10, 10)).toEqual([1, "ellipsis", 9, 10]);
    expect(getPageItems(9, 10)).toEqual([1, "ellipsis", 8, 9, 10]);
  });

  it("중간 페이지는 양쪽을 생략한다", () => {
    expect(getPageItems(5, 10)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      10,
    ]);
  });

  it("한 페이지만 건너뛰면 생략 기호 대신 번호를 둔다", () => {
    expect(getPageItems(4, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10]);
    expect(getPageItems(7, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10]);
  });

  it("범위를 벗어난 current는 가장자리로 보정한다", () => {
    expect(getPageItems(0, 10)).toEqual(getPageItems(1, 10));
    expect(getPageItems(999, 10)).toEqual(getPageItems(10, 10));
  });
});
