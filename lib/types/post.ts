import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

type PostRow = Tables<"posts">;

/** 블로그 목록 카드용 (본문 제외) */
export type PostSummary = Omit<PostRow, "content">;

/** 블로그 상세용 */
export type Post = PostRow;

/** 관리자 편집기 입력값 (DB가 채우는 컬럼 제외) */
export type PostInput = Required<
  Omit<
    TablesInsert<"posts">,
    "id" | "published_at" | "created_at" | "updated_at"
  >
>;
