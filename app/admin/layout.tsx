import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { AdminGuard } from "@/app/admin/_components/admin-guard";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { LogoutButton } from "@/app/admin/_components/logout-button";
import { siteConfig } from "@/lib/site-config";

// robots.txt disallow만으로는 색인 차단이 보장되지 않아 페이지 단위로도 noindex를 둔다.
export const metadata: Metadata = { robots: { index: false, follow: false } };

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
              className="shrink-0 rounded-md text-lg font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              {siteConfig.name}
            </Link>
            <Suspense fallback={<AdminNav active={false} />}>
              <AdminNav />
            </Suspense>
          </div>
          <LogoutButton variant="outline" size="sm" />
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-4 py-12 outline-none"
      >
        <Suspense fallback={null}>
          <AdminGuard>{children}</AdminGuard>
        </Suspense>
      </main>
      <ScrollToTop />
    </>
  );
}
