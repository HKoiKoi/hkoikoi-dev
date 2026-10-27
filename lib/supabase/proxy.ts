import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 결론: hasEnvVars 검사는 유지한다.
  // 근거: 환경변수가 없을 때 아래 createServerClient가 URL/키 누락 오류를 던지면
  // 공개 페이지를 포함한 모든 요청이 500이 된다. 이 검사는 빌드·CI나 env 미설정
  // 환경에서 공개 라우트가 뜨게 하려는 안전장치다.
  // 보안 영향 없음: 여기서 세션 검사를 건너뛰어도 /admin의 실제 인가는
  // requireAdmin()(서버 코드)과 RLS가 맡는다. env가 없으면 서버 클라이언트
  // 생성도 실패하므로 /admin은 열리지 않고 오류로 닫힌다(fail-closed).
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // 보호 대상은 /admin 세그먼트뿐이다. /administrator 같은 경로는 보호하지 않는다.
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!user && isAdminPath) {
    // 비로그인 사용자는 로그인 페이지로 보낸다.
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    // getClaims()가 갱신한 토큰 쿠키가 유실되지 않도록 그대로 복사한다.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
