import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { POST_COLUMNS, SUMMARY_COLUMNS } from "@/lib/queries/columns";
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
 * 글 id별 누적 조회수 맵. 조회 기록이 없는 글은 맵에 없다(호출 측이 0으로 본다).
 * 오류는 null로 돌려준다(목록은 그대로 보이고 조회수 열만 '-'로 표시한다).
 * 캐시하지 않으며 반드시 requireAdmin() 이후에 호출한다.
 */
export async function getAdminPostViewCounts(): Promise<Record<
  string,
  number
> | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("post_views")
      .select("post_id, view_count");

    if (error) {
      console.error("[getAdminPostViewCounts]", error.message);
      return null;
    }
    return Object.fromEntries(
      (data ?? []).map((row) => [row.post_id, row.view_count]),
    );
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getAdminPostViewCounts]", error);
    return null;
  }
}

export type PostReference = { content: string; thumbnail_url: string | null };

/**
 * 이미지 참조 판정용: 초안 포함 모든 글의 content·thumbnail_url. 캐시하지 않는다.
 * 오류는 null로 돌려준다. 빈 배열("글이 없음")과 구분해야 하므로, 호출 측은 null이면
 * 반드시 중단해야 한다 (실패를 빈 참조로 보면 모든 이미지가 고아로 보인다).
 * 반드시 requireAdmin() 이후에 호출한다.
 */
export async function getAdminPostReferences(): Promise<
  PostReference[] | null
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("content, thumbnail_url");

    if (error) {
      console.error("[getAdminPostReferences]", error.message);
      return null;
    }
    return data ?? [];
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getAdminPostReferences]", error);
    return null;
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
