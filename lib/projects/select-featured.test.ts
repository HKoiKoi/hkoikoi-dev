import { describe, expect, it } from "vitest";

import type { Project } from "@/lib/types/resume";

import { selectFeatured } from "./select-featured";

const make = (name: string, featured?: boolean): Project => ({
  name,
  summary: "",
  period: "",
  role: "",
  stack: [],
  links: {},
  featured,
});

describe("selectFeatured", () => {
  it("featured가 count 이상이면 featured만 count개 반환한다", () => {
    const projects = [
      make("a", true),
      make("b"),
      make("c", true),
      make("d", true),
      make("e", true),
    ];
    expect(selectFeatured(projects).map((p) => p.name)).toEqual([
      "a",
      "c",
      "d",
    ]);
  });

  it("featured가 count 미만이면 목록 앞에서부터 채운다", () => {
    const projects = [make("a"), make("b", true), make("c"), make("d")];
    expect(selectFeatured(projects).map((p) => p.name)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("프로젝트가 count보다 적으면 전부 반환한다", () => {
    expect(selectFeatured([make("a")])).toHaveLength(1);
    expect(selectFeatured([])).toEqual([]);
  });

  it("count를 지정할 수 있다", () => {
    const projects = [make("a"), make("b"), make("c")];
    expect(selectFeatured(projects, 2)).toHaveLength(2);
  });
});
