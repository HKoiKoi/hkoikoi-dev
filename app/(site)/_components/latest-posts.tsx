import { PostCard } from "@/components/blog/post-card";
import { EmptyState } from "@/components/content/empty-state";
import { getLatestPosts } from "@/lib/queries/posts";

// DB 조회(cookies 사용)는 요청 시점 데이터라 홈의 정적 셸과 분리해 Suspense 안에서 렌더한다.
export async function LatestPosts() {
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
