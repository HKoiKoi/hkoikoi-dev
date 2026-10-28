import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { POST_COLUMNS, SUMMARY_COLUMNS } from "@/lib/queries/columns";
import { createClient } from "@/lib/supabase/server";
import type { Post, PostSummary } from "@/lib/types/post";

type PostFilter = { category?: string; tag?: string };

/** 메인 페이지용 최신 공개 글 (본문 제외) */
export async function getLatestPosts(limit: number): Promise<PostSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(SUMMARY_COLUMNS)
      // RLS와 별개로 공개 글만 조회하도록 이중 방어한다.
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getLatestPosts]", error.message);
      return [];
    }
    return data ?? [];
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getLatestPosts]", error);
    return [];
  }
}

/** 블로그 목록용 공개 글 (본문 제외), 카테고리·태그로 필터링 */
export async function getPublishedPosts({
  category,
  tag,
}: PostFilter = {}): Promise<PostSummary[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("posts")
      .select(SUMMARY_COLUMNS)
      .eq("published", true);

    if (category) query = query.eq("category", category);
    // tags는 text[]이므로 배열 포함 연산자로 비교한다.
    if (tag) query = query.contains("tags", [tag]);

    const { data, error } = await query.order("published_at", {
      ascending: false,
    });

    if (error) {
      console.error("[getPublishedPosts]", error.message);
      return [];
    }
    return data ?? [];
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getPublishedPosts]", error);
    return [];
  }
}

/** slug로 공개 글 하나 조회. 없거나 오류면 null */
export const getPostBySlug = cache(
  async (slug: string): Promise<Post | null> => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("posts")
        .select(POST_COLUMNS)
        .eq("published", true)
        // DB에 NFC로 저장되므로 URL에서 온 NFD 한글 slug를 맞춘다.
        .eq("slug", slug.normalize("NFC"))
        .maybeSingle();

      if (error) {
        console.error("[getPostBySlug]", error.message);
        return null;
      }
      return data;
    } catch (error) {
      // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
      unstable_rethrow(error);
      console.error("[getPostBySlug]", error);
      return null;
    }
  },
);
