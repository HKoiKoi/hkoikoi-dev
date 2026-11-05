import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getPublishedPosts } from "@/lib/queries/posts";
import { isNavGroup, navItems } from "@/lib/site-config";
import { absoluteUrl } from "@/lib/site-url";

// 메인 + 메뉴의 리프 경로(그룹은 평탄화)
const staticPaths = [
  "/",
  ...navItems.flatMap((item) =>
    isNavGroup(item) ? item.children.map((child) => child.href) : [item.href],
  ),
];

// 글 조회는 'use cache'라 요청 시점 API가 아니므로, 그대로 두면 빌드 때 정적으로
// 프리렌더되어 글을 저장·삭제해도 갱신되지 않는다(운영에서 확인). connection()으로
// 요청 시점 렌더링을 강제하고, 글 목록은 posts 태그 캐시에서 읽어 비용을 줄인다.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const posts = await getPublishedPosts();

  return [
    ...staticPaths.map((path) => ({ url: absoluteUrl(path) })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`),
      lastModified: new Date(post.updated_at),
    })),
  ];
}
