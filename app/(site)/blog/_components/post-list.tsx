import { PostCard } from "@/components/blog/post-card";
import { EmptyState } from "@/components/content/empty-state";
import type { PostSummary } from "@/lib/types/post";

interface PostListProps {
  posts: PostSummary[];
  filtered: boolean;
}

// 블로그 글 목록 (0건이면 안내 문구)
export function PostList({ posts, filtered }: PostListProps) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title={
          filtered ? "조건에 맞는 글이 없습니다" : "아직 작성된 글이 없습니다"
        }
        message={filtered ? "다른 필터로 다시 찾아보세요." : undefined}
      />
    );
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
