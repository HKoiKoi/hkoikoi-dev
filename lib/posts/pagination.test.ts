import { describe, expect, it } from "vitest";

import { getPageItems, getPageRange, getTotalPages } from "./pagination";

describe("getTotalPages", () => {
  it("글이 없어도 1페이지다", () => {
    expect(getTotalPages(0, 10)).toBe(1);
    expect(getTotalPages(0, 6)).toBe(1);
  });

  it("페이지 크기 10: 10건은 1페이지, 11건은 2페이지다", () => {
    expect(getTotalPages(10, 10)).toBe(1);
    expect(getTotalPages(11, 10)).toBe(2);
  });

  it("페이지 크기 10: 20건은 2페이지, 21건은 3페이지다", () => {
    expect(getTotalPages(20, 10)).toBe(2);
    expect(getTotalPages(21, 10)).toBe(3);
  });

  it("페이지 크기 6: 6건은 1페이지, 7건은 2페이지, 18건은 3페이지다", () => {
    expect(getTotalPages(6, 6)).toBe(1);
    expect(getTotalPages(7, 6)).toBe(2);
    expect(getTotalPages(18, 6)).toBe(3);
  });
});

describe("getPageRange", () => {
  it("페이지 크기 10: 1페이지는 0~9, 2페이지는 10~19다", () => {
    expect(getPageRange(1, 10)).toEqual({ from: 0, to: 9 });
    expect(getPageRange(2, 10)).toEqual({ from: 10, to: 19 });
  });

  it("페이지 크기 6: 1페이지는 0~5, 3페이지는 12~17이다", () => {
    expect(getPageRange(1, 6)).toEqual({ from: 0, to: 5 });
    expect(getPageRange(3, 6)).toEqual({ from: 12, to: 17 });
  });

  it("범위 길이는 항상 페이지 크기와 같다", () => {
    for (const size of [6, 10]) {
      const { from, to } = getPageRange(5, size);
      expect(to - from + 1).toBe(size);
    }
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
