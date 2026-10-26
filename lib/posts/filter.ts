import type { PostSummary } from "@/lib/types/post";

interface PostFilter {
  category?: string;
  tag?: string;
}

// TODO: Task 012에서 DB 쿼리로 대체되면 삭제한다.
// 발행 글만, 발행일 내림차순, category·tag는 AND 조건
export function filterPosts<T extends PostSummary>(
  posts: T[],
  { category, tag }: PostFilter = {},
): T[] {
  return posts
    .filter((post) => post.published)
    .filter((post) => !category || post.category === category)
    .filter((post) => !tag || post.tags.includes(tag))
    .sort((a, b) =>
      (b.published_at ?? b.created_at).localeCompare(
        a.published_at ?? a.created_at,
      ),
    );
}
