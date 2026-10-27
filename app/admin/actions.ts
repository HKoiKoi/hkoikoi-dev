"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 로그아웃은 관리자 여부와 무관하게 누구나 할 수 있어야 하므로 requireAdmin을 거치지 않는다.
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
