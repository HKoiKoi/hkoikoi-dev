import Link from "next/link";
import { Suspense } from "react";
import { AdminGuard } from "@/app/admin/_components/admin-guard";
import { LogoutButton } from "@/components/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

// 헤더는 일부러 AdminGuard 바깥(정적 셸)에 둔다. 헤더에는 공개 상수와 링크뿐이라
// 로그인한 비관리자에게 잠깐 보여도 노출되는 정보가 없고, 가드 안으로 옮기면 모든
// /admin 진입에서 세션 확인이 끝날 때까지 빈 화면이 생긴다. 인가는 requireAdmin()과 RLS가 맡는다.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/"
              className="shrink-0 rounded-md text-lg font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {siteConfig.name}
            </Link>
            <nav aria-label="관리자 메뉴" className="flex items-center gap-1">
              <Link
                href="/admin/posts"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                글 관리
              </Link>
              <Link
                href="/admin/posts/edit"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                새 글
              </Link>
            </nav>
          </div>
          <LogoutButton variant="outline" size="sm" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <Suspense fallback={null}>
          <AdminGuard>{children}</AdminGuard>
        </Suspense>
      </div>
    </>
  );
}
