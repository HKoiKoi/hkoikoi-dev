import { describe, expect, it } from "vitest";

import { filterOrphans, type StorageObjectInfo } from "./find-orphans";

const NOW = new Date("2026-11-10T00:00:00.000Z");

function obj(path: string, createdAt: string, size = 70): StorageObjectInfo {
  return { path, size, createdAt };
}

describe("filterOrphans", () => {
  it("참조되지 않고 유예가 지난 객체만 후보로 돌려준다", () => {
    const objects = [
      obj("2026/10/old.png", "2026-10-01T00:00:00.000Z"),
      obj("2026/10/used.png", "2026-10-01T00:00:00.000Z"),
    ];
    const result = filterOrphans(objects, new Set(["2026/10/used.png"]), NOW);
    expect(result.map((o) => o.path)).toEqual(["2026/10/old.png"]);
  });

  it("유예 기간 안(6일 23시간)의 객체는 제외한다", () => {
    const objects = [obj("2026/11/new.png", "2026-11-03T01:00:00.000Z")];
    expect(filterOrphans(objects, new Set(), NOW)).toEqual([]);
  });

  it("정확히 7일 된 객체는 후보에 포함한다 (경계)", () => {
    const objects = [obj("2026/11/edge.png", "2026-11-03T00:00:00.000Z")];
    expect(filterOrphans(objects, new Set(), NOW)).toHaveLength(1);
  });

  it("graceDays 인자를 존중한다", () => {
    const objects = [obj("2026/11/a.png", "2026-11-08T00:00:00.000Z")];
    expect(filterOrphans(objects, new Set(), NOW, 1)).toHaveLength(1);
    expect(filterOrphans(objects, new Set(), NOW, 3)).toHaveLength(0);
  });

  it("오래된 순으로 정렬한다", () => {
    const objects = [
      obj("b.png", "2026-09-02T00:00:00.000Z"),
      obj("a.png", "2026-09-01T00:00:00.000Z"),
      obj("c.png", "2026-09-03T00:00:00.000Z"),
    ];
    expect(filterOrphans(objects, new Set(), NOW).map((o) => o.path)).toEqual([
      "a.png",
      "b.png",
      "c.png",
    ]);
  });

  it("업로드 시각을 해석할 수 없으면 안전하게 제외한다", () => {
    const objects = [obj("x.png", ""), obj("y.png", "not-a-date")];
    expect(filterOrphans(objects, new Set(), NOW)).toEqual([]);
  });

  it("입력 배열을 바꾸지 않는다", () => {
    const objects = [
      obj("b.png", "2026-09-02T00:00:00.000Z"),
      obj("a.png", "2026-09-01T00:00:00.000Z"),
    ];
    filterOrphans(objects, new Set(), NOW);
    expect(objects.map((o) => o.path)).toEqual(["b.png", "a.png"]);
  });

  it("객체가 없으면 빈 배열이다", () => {
    expect(filterOrphans([], new Set(), NOW)).toEqual([]);
  });
});
