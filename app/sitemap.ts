import type { MetadataRoute } from "next";
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

// 글 조회가 cookies()를 읽는 요청 시점 데이터라 이 라우트는 요청마다 생성된다.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();

  return [
    ...staticPaths.map((path) => ({ url: absoluteUrl(path) })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`),
      lastModified: new Date(post.updated_at),
    })),
  ];
}
