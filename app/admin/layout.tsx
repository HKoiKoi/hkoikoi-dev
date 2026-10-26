import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // TODO: 관리자 권한 검증은 이후 Task에서 추가한다 (현재는 proxy의 로그인 검사만 적용).
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
          {/* TODO: Task 011에서 로그아웃 동작을 연결한다. */}
          <Button type="button" variant="outline" size="sm">
            로그아웃
          </Button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-12">{children}</div>
    </>
  );
}
