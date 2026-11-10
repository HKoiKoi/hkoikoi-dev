import { connection } from "next/server";
import { buildRss } from "@/lib/feed/build-rss";
import { getLatestPosts } from "@/lib/queries/posts";
import { getSiteUrl } from "@/lib/site-url";

// 글 조회는 'use cache'라 요청 시점 API가 아니므로, 그대로 두면 빌드 때 정적으로
// 고정되어 발행·삭제가 반영되지 않는다(sitemap.ts와 같은 이유). connection()으로
// 요청 시점 렌더링을 강제하고, 글 목록은 posts 태그 캐시에서 읽는다.
// 조회 오류 시 getLatestPosts가 빈 배열을 주므로 200 + 빈 채널로 응답한다.
export async function GET() {
  await connection();
  const posts = await getLatestPosts(20);

  return new Response(buildRss(posts, getSiteUrl()), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
