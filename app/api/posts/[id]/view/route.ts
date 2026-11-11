import { unstable_rethrow } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth/is-admin";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isBot } from "@/lib/views/is-bot";

// 조회수 증가는 POST만 받는다. GET/HEAD를 export하지 않아 링크 프리페치·크롤러의
// GET으로는 늘지 않는다(미지원 메서드는 Next가 405를 낸다). 비-GET 핸들러는
// 프리렌더되지 않으므로 connection()이 필요 없다.
// 캐시 무효화(updateTag 등)는 호출하지 않는다. 조회수는 본문 캐시와 분리된다.
// IP·User-Agent는 판정에만 쓰고 저장·로깅하지 않는다.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIEWED_COOKIE_MAX_AGE = 60 * 60 * 24; // 24시간

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/posts/[id]/view">,
) {
  const { id } = await ctx.params;

  // 형식이 틀린 id는 클라이언트 버그이므로 400으로 드러낸다(부수효과 없음).
  if (!UUID_PATTERN.test(id)) {
    return new NextResponse(null, { status: 400 });
  }

  const cookieName = `post_viewed_${id}`;
  if (request.cookies.has(cookieName)) return noContent();
  if (isBot(request.headers.get("user-agent"))) return noContent();

  try {
    // 비로그인은 집계 대상이다. requireAdmin()은 redirect/notFound를 던지므로 쓰지 않는다.
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (isAdmin(claimsData?.claims)) return noContent();

    // 발행 글이 아니면 RPC가 아무것도 쓰지 않고 false를 돌려준다.
    const { data: counted, error } = await createPublicClient().rpc(
      "increment_post_view",
      { p_post_id: id },
    );
    if (error) {
      console.error("조회수 증가 RPC 실패:", error.message);
      return noContent();
    }
    if (counted !== true) return noContent();
  } catch (err) {
    unstable_rethrow(err);
    console.error("조회수 집계 실패:", err);
    return noContent();
  }

  const response = noContent();
  response.cookies.set(cookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VIEWED_COOKIE_MAX_AGE,
  });
  return response;
}
