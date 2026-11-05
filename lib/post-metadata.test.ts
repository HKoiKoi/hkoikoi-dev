import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPostMetadata } from "@/lib/post-metadata";

const base = {
  title: "제목",
  excerpt: "소개글",
  thumbnail_url: null,
  published_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-02T00:00:00Z",
};

describe("buildPostMetadata", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("글이 없으면 noindex", () => {
    expect(buildPostMetadata(null)).toEqual({ robots: { index: false } });
  });

  it("title·description·article OG 필드를 채운다", () => {
    const meta = buildPostMetadata(base);
    expect(meta.title).toBe("제목");
    expect(meta.description).toBe("소개글");
    expect(meta.openGraph).toMatchObject({
      type: "article",
      title: "제목",
      description: "소개글",
      publishedTime: "2026-10-01T00:00:00Z",
      modifiedTime: "2026-10-02T00:00:00Z",
    });
  });

  it("썸네일이 없으면 기본 OG·트위터 이미지를 절대 URL로 명시한다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const meta = buildPostMetadata(base);
    expect(meta.openGraph).toMatchObject({
      images: ["https://example.com/opengraph-image.png"],
    });
    expect(meta.twitter).toMatchObject({
      images: ["https://example.com/twitter-image.png"],
    });
  });

  it("썸네일이 있으면 OG·트위터 이미지로 쓴다", () => {
    const url = "https://example.supabase.co/a.png";
    const meta = buildPostMetadata({ ...base, thumbnail_url: url });
    expect(meta.openGraph).toMatchObject({ images: [url] });
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: [url],
    });
  });
});
