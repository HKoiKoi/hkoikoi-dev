import { describe, expect, it } from "vitest";

import { buildRss } from "@/lib/feed/build-rss";
import type { PostSummary } from "@/lib/types/post";

const SITE = "https://hkoikoi.dev";

function makePost(overrides: Partial<PostSummary> = {}): PostSummary {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    slug: "hello",
    title: "안녕",
    excerpt: "소개글",
    category: "dev",
    tags: [],
    thumbnail_url: null,
    published: true,
    published_at: "2026-11-01T00:00:00Z",
    created_at: "2026-10-31T00:00:00Z",
    updated_at: "2026-11-02T00:00:00Z",
    ...overrides,
  };
}

function parse(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}

describe("buildRss", () => {
  it("DOMParser로 파싱 가능한 XML이다", () => {
    const doc = parse(buildRss([makePost()], SITE));
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.documentElement.getAttribute("version")).toBe("2.0");
  });

  it("제목의 & 와 < 를 이스케이프한다", () => {
    const xml = buildRss([makePost({ title: "A & B <C>" })], SITE);
    expect(xml).toContain("A &amp; B &lt;C&gt;");
    const doc = parse(xml);
    expect(doc.querySelector("item > title")?.textContent).toBe("A & B <C>");
  });

  it("한글 슬러그를 퍼센트 인코딩해 절대 URL을 만든다", () => {
    const doc = parse(buildRss([makePost({ slug: "한글-글" })], SITE));
    expect(doc.querySelector("item > link")?.textContent).toBe(
      `${SITE}/blog/${encodeURIComponent("한글-글")}`,
    );
  });

  it("guid는 id이고 permalink가 아니다", () => {
    const post = makePost();
    const guid = parse(buildRss([post], SITE)).querySelector("item > guid");
    expect(guid?.textContent).toBe(post.id);
    expect(guid?.getAttribute("isPermaLink")).toBe("false");
  });

  it("빈 목록이면 item 없는 채널이고 lastBuildDate를 생략한다", () => {
    const doc = parse(buildRss([], SITE));
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelectorAll("item")).toHaveLength(0);
    expect(doc.querySelector("channel > title")).not.toBeNull();
    expect(doc.querySelector("lastBuildDate")).toBeNull();
  });

  it("excerpt가 비어 있으면 description을 생략한다", () => {
    const doc = parse(buildRss([makePost({ excerpt: "  " })], SITE));
    expect(doc.querySelector("item > description")).toBeNull();
  });

  it("published_at이 null이면 created_at을 pubDate로 쓴다", () => {
    const doc = parse(buildRss([makePost({ published_at: null })], SITE));
    expect(doc.querySelector("item > pubDate")?.textContent).toBe(
      "Sat, 31 Oct 2026 00:00:00 GMT",
    );
  });

  it("pubDate와 lastBuildDate가 RFC 822 형식(UTC)이다", () => {
    const doc = parse(buildRss([makePost()], SITE));
    expect(doc.querySelector("item > pubDate")?.textContent).toBe(
      "Sun, 01 Nov 2026 00:00:00 GMT",
    );
    expect(doc.querySelector("channel > lastBuildDate")?.textContent).toBe(
      "Mon, 02 Nov 2026 00:00:00 GMT",
    );
  });

  it("채널에 language와 self 링크가 있다", () => {
    const xml = buildRss([], SITE);
    expect(xml).toContain("<language>ko</language>");
    expect(xml).toContain(
      `<atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>`,
    );
  });
});
