import { beforeEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { getPublishedPosts } from "@/lib/queries/posts";
import type { PostSummary } from "@/lib/types/post";

vi.mock("@/lib/queries/posts", () => ({ getPublishedPosts: vi.fn() }));

function makePost(slug: string, updatedAt: string): PostSummary {
  return { slug, updated_at: updatedAt } as PostSummary;
}

describe("sitemap", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.mocked(getPublishedPosts).mockReset();
  });

  it("글이 없으면 고정 페이지 10개만 반환한다", async () => {
    vi.mocked(getPublishedPosts).mockResolvedValue([]);
    const result = await sitemap();
    expect(result).toHaveLength(10);
    expect(result.map((e) => e.url)).toEqual([
      "https://example.com/",
      "https://example.com/education",
      "https://example.com/career",
      "https://example.com/certifications",
      "https://example.com/languages",
      "https://example.com/volunteer",
      "https://example.com/activities",
      "https://example.com/projects",
      "https://example.com/publications",
      "https://example.com/blog",
    ]);
  });

  it("발행 글을 updated_at 기준 lastModified로 추가한다", async () => {
    vi.mocked(getPublishedPosts).mockResolvedValue([
      makePost("hello", "2026-10-01T00:00:00Z"),
    ]);
    const result = await sitemap();
    expect(result).toHaveLength(11);
    expect(result[10]).toEqual({
      url: "https://example.com/blog/hello",
      lastModified: new Date("2026-10-01T00:00:00Z"),
    });
  });

  it("한글 슬러그는 퍼센트 인코딩한다", async () => {
    vi.mocked(getPublishedPosts).mockResolvedValue([
      makePost("테스트-글", "2026-10-01T00:00:00Z"),
    ]);
    const result = await sitemap();
    expect(result[10].url).toBe(
      `https://example.com/blog/${encodeURIComponent("테스트-글")}`,
    );
    expect(result[10].url).toMatch(/^[\x21-\x7e]+$/);
  });
});
