"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 로그아웃은 관리자 여부와 무관하게 누구나 할 수 있어야 하므로 requireAdmin을 거치지 않는다.
// signOut()의 기본 scope는 global이라 같은 계정의 모든 기기·브라우저 세션이 함께 끊긴다.
// 이 기기의 세션만 끊도록 local로 지정한다(다른 브라우저의 로그인과 공유한 e2e 세션을 지킨다).
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
