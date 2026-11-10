import { siteConfig } from "@/lib/site-config";
import type { PostSummary } from "@/lib/types/post";

// XML 텍스트·속성값에 들어가는 5개 특수 문자를 이스케이프한다.
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toItem(post: PostSummary, siteUrl: string): string {
  const link = `${siteUrl}/blog/${encodeURIComponent(post.slug)}`;
  const pubDate = new Date(post.published_at ?? post.created_at).toUTCString();
  const description = post.excerpt.trim();

  // guid는 슬러그가 바뀌어도 리더가 같은 글로 인식하도록 불변인 id를 쓴다(permalink가 아니므로 isPermaLink=false).
  // description에는 소개글만 넣고 본문은 싣지 않는다.
  return [
    "<item>",
    `<title>${escapeXml(post.title)}</title>`,
    `<link>${escapeXml(link)}</link>`,
    `<guid isPermaLink="false">${escapeXml(post.id)}</guid>`,
    `<pubDate>${pubDate}</pubDate>`,
    description ? `<description>${escapeXml(description)}</description>` : "",
    "</item>",
  ].join("");
}

/**
 * 공개 글 목록(최신순)으로 RSS 2.0 문서를 만든다.
 * lastBuildDate에 현재 시각을 쓰면 요청마다 출력이 달라져 리더의 변경 감지가 흔들리므로,
 * 가장 최근 글의 updated_at에서 도출하고 글이 없으면 생략한다.
 */
export function buildRss(posts: PostSummary[], siteUrl: string): string {
  const lastBuildDate = posts[0]
    ? `<lastBuildDate>${new Date(posts[0].updated_at).toUTCString()}</lastBuildDate>`
    : "";

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(siteConfig.name)}</title>`,
    `<link>${escapeXml(siteUrl)}</link>`,
    `<description>${escapeXml(siteConfig.description)}</description>`,
    "<language>ko</language>",
    `<atom:link href="${escapeXml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml"/>`,
    lastBuildDate,
    ...posts.map((post) => toItem(post, siteUrl)),
    "</channel>",
    "</rss>",
  ]
    .filter(Boolean)
    .join("\n");
}
