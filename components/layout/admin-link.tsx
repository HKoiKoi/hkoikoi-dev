import Link from "next/link";
import { connection } from "next/server";
import { isAdmin } from "@/lib/auth/is-admin";
import { createClient } from "@/lib/supabase/server";

// site-footer.tsx의 주변 링크와 동일한 스타일
const linkClassName =
  "inline-flex items-center gap-1.5 rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring";

// 푸터에 표시할 관리자 링크.
// `getClaims()`로 확인한 app_metadata.role이 admin일 때만 `/admin/posts` 링크를 렌더링한다.
// 쿠키(요청 시점 데이터)를 읽으므로 호출하는 쪽에서 반드시 <Suspense>로 감싼다.
export async function AdminLink() {
  // getClaims()가 만료 판정에 Date.now()를 쓰므로 프리렌더 단계에서 멈추고 요청 시점에 실행한다.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!isAdmin(data?.claims)) {
    return null;
  }

  return (
    <Link href="/admin/posts" className={linkClassName}>
      관리
    </Link>
  );
}
