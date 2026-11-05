import { connection } from "next/server";

import { PostCard } from "@/components/blog/post-card";
import { EmptyState } from "@/components/content/empty-state";
import { getLatestPosts } from "@/lib/queries/posts";

// 글 조회는 'use cache'라 그대로 두면 결과가 홈의 정적 셸(프리렌더 HTML)에 포함되어,
// 글을 저장·삭제해도 운영에서 갱신되지 않는다(삭제한 글이 계속 보임). connection()으로
// 이 영역만 요청 시점 렌더링으로 분리하고, 목록은 posts 태그 캐시에서 읽어 비용을 줄인다.
// 호출하는 쪽이 Suspense로 감싸야 한다.
export async function LatestPosts() {
  await connection();
  const posts = await getLatestPosts(3);

  if (posts.length === 0) {
    return <EmptyState title="아직 작성된 글이 없습니다" />;
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
