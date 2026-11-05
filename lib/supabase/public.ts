import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * 쿠키·세션을 읽지 않는 공개 조회용 클라이언트. 항상 anon 역할로 동작하므로
 * `'use cache'` 안에서 쓸 수 있다. 관리자 쿼리에는 쓰지 않는다.
 * 전역 변수에 저장하지 말고 호출마다 새로 만든다.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
