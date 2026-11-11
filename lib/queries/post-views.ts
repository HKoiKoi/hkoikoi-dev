import { unstable_rethrow } from "next/navigation";

import { createPublicClient } from "@/lib/supabase/public";

/*
 * 조회수는 요청마다 달라지므로 'use cache'를 쓰지 않는다. 호출 측이 connection() 뒤
 * Suspense 안에서 await한다. 발행 글만 select 정책으로 읽히며, 행이 없으면 아직 조회가 없는 것이다.
 */

/** 글의 누적 조회수. 행이 없으면 0, 오류면 null(호출 측이 숫자를 숨긴다) */
export async function getPostViewCount(postId: string): Promise<number | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("post_views")
      .select("view_count")
      .eq("post_id", postId)
      .maybeSingle();

    if (error) {
      console.error("[getPostViewCount]", error.message);
      return null;
    }
    return data?.view_count ?? 0;
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getPostViewCount]", error);
    return null;
  }
}
