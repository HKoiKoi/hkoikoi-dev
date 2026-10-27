import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { POST_COLUMNS, SUMMARY_COLUMNS } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";
import type { Post, PostSummary } from "@/lib/types/post";

/**
 * 관리자 글 목록: 초안 포함 전체 글을 최근 수정순으로 반환한다 (본문 제외).
 * published 필터를 걸지 않으므로 반드시 requireAdmin() 이후에 호출한다.
 * (초안은 RLS가 관리자에게만 허용한다.)
 */
export async function getAdminPosts(): Promise<PostSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(SUMMARY_COLUMNS)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[getAdminPosts]", error.message);
      return [];
    }
    return data ?? [];
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getAdminPosts]", error);
    return [];
  }
}

/**
 * id로 글 하나 조회 (초안 포함, 본문 포함). uuid 형식이 아니거나 없거나 오류면 null.
 * published 필터를 걸지 않으므로 반드시 requireAdmin() 이후에 호출한다.
 */
export async function getAdminPostById(id: string): Promise<Post | null> {
  // 잘못된 id는 DB까지 가지 않고 막는다 (uuid 컬럼 비교 오류 방지).
  if (!z.uuid().safeParse(id).success) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[getAdminPostById]", error.message);
      return null;
    }
    return data;
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getAdminPostById]", error);
    return null;
  }
}
