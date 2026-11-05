"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin/posts", label: "글 관리" },
  { href: "/admin/posts/new", label: "새 글" },
];

// 관리자 헤더 메뉴. "글 관리"는 새 글·수정 하위 경로에서도 활성으로 보되,
// 더 구체적인 항목("새 글")이 일치하면 그쪽만 현재 페이지로 표시한다.
export function AdminNav({ active = true }: { active?: boolean }) {
  return (
    <nav aria-label="관리자 메뉴" className="flex items-center gap-1">
      {items.map((item) => (
        <AdminNavLink key={item.href} {...item} active={active} />
      ))}
    </nav>
  );
}

function AdminNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return active ? (
    <ActiveLink href={href} label={label} />
  ) : (
    <Link
      href={href}
      className={buttonVariants({ variant: "ghost", size: "sm" })}
    >
      {label}
    </Link>
  );
}

function ActiveLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const current =
    href === "/admin/posts"
      ? pathname === href || /^\/admin\/posts\/(?!new(\/|$))/.test(pathname)
      : pathname === href;

  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "aria-[current=page]:bg-muted aria-[current=page]:font-semibold",
      )}
    >
      {label}
    </Link>
  );
}
