import { describe, expect, it } from "vitest";

import type { Publication } from "@/lib/types/resume";

import { sortPublications } from "./sort";

const make = (title: string, year: number): Publication => ({
  title,
  authors: "",
  venue: "",
  year,
  link: "https://example.com",
});

describe("sortPublications", () => {
  it("year 내림차순으로 정렬한다", () => {
    const items = [make("a", 2020), make("b", 2024), make("c", 2022)];
    expect(sortPublications(items).map((p) => p.year)).toEqual([
      2024, 2022, 2020,
    ]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const items = [make("a", 2020), make("b", 2024)];
    sortPublications(items);
    expect(items.map((p) => p.title)).toEqual(["a", "b"]);
  });

  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(sortPublications([])).toEqual([]);
  });
});
