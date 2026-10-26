// TODO: Task 010 이후 lib/supabase/database.types.ts의 posts Row 타입에서 파생하도록 교체한다.

/** 블로그 목록 카드용 */
export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  thumbnail_url: string | null;
  category: string;
  tags: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** 블로그 상세용 */
export type Post = PostSummary & {
  content: string;
};

/** 관리자 편집기 입력값 */
export type PostInput = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail_url: string | null;
  category: string;
  tags: string[];
  published: boolean;
};
