import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/is-admin";
import { createClient } from "@/lib/supabase/server";

// 서버 컴포넌트·액션에서 관리자만 통과시키는 가드.
// 비로그인은 로그인으로 보내고, 로그인했지만 관리자가 아니면 404로 존재를 숨긴다.
// 환경변수가 없으면 createClient()가 먼저 실패하므로 /admin은 열리지 않고 오류로 닫힌다.
// redirect/notFound는 예외를 던지므로 try/catch 밖에서 호출한다.
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) redirect("/auth/login");
  if (!isAdmin(claims)) notFound();

  return claims;
}
