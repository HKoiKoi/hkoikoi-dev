"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_NAV_ITEMS, isNavCurrent } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

// 관리자 헤더 메뉴. 좁은 화면에서는 페이지가 넘치지 않고 메뉴만 가로로 스크롤한다.
export function AdminNav({ active = true }: { active?: boolean }) {
  return (
    <nav
      aria-label="관리자 메뉴"
      className="flex min-w-0 items-center gap-1 overflow-x-auto"
    >
      {ADMIN_NAV_ITEMS.map((item) =>
        active ? (
          <ActiveLink key={item.href} {...item} />
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "shrink-0",
            )}
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}

function ActiveLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const current = isNavCurrent(href, pathname);

  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "shrink-0 aria-[current=page]:bg-muted aria-[current=page]:font-semibold",
      )}
    >
      {label}
    </Link>
  );
}
