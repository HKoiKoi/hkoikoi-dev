import { describe, expect, it } from "vitest";

import type { PostSummary } from "@/lib/types/post";

import { filterPosts } from "./filter";

const make = (
  slug: string,
  overrides: Partial<PostSummary> = {},
): PostSummary => ({
  id: slug,
  slug,
  title: slug,
  excerpt: "",
  thumbnail_url: null,
  category: "일반",
  tags: [],
  published: true,
  published_at: "2026-10-01T00:00:00.000Z",
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
  ...overrides,
});

describe("filterPosts", () => {
  it("발행된 글만 반환한다", () => {
    const posts = [make("a"), make("b", { published: false })];
    expect(filterPosts(posts).map((p) => p.slug)).toEqual(["a"]);
  });

  it("발행일 내림차순으로 정렬하고 원본을 변경하지 않는다", () => {
    const posts = [
      make("old", { published_at: "2026-01-01T00:00:00.000Z" }),
      make("new", { published_at: "2026-09-01T00:00:00.000Z" }),
    ];
    expect(filterPosts(posts).map((p) => p.slug)).toEqual(["new", "old"]);
    expect(posts.map((p) => p.slug)).toEqual(["old", "new"]);
  });

  it("category로 필터링한다", () => {
    const posts = [make("a", { category: "개발" }), make("b")];
    expect(filterPosts(posts, { category: "개발" }).map((p) => p.slug)).toEqual(
      ["a"],
    );
  });

  it("tag로 필터링한다", () => {
    const posts = [make("a", { tags: ["x", "y"] }), make("b", { tags: ["z"] })];
    expect(filterPosts(posts, { tag: "y" }).map((p) => p.slug)).toEqual(["a"]);
  });

  it("category와 tag는 AND 조건이다", () => {
    const posts = [
      make("a", { category: "개발", tags: ["x"] }),
      make("b", { category: "개발", tags: ["y"] }),
      make("c", { category: "일반", tags: ["x"] }),
    ];
    expect(
      filterPosts(posts, { category: "개발", tag: "x" }).map((p) => p.slug),
    ).toEqual(["a"]);
  });

  it("일치하는 글이 없으면 빈 배열을 반환한다", () => {
    expect(filterPosts([make("a")], { tag: "없는태그" })).toEqual([]);
  });
});
