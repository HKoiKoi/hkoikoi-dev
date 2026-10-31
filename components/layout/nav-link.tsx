"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/lib/is-active-path";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function NavLink({ href, children }: NavLinkProps) {
  const active = isActivePath(usePathname(), href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center rounded-md px-2.5 text-sm whitespace-nowrap transition-colors outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring",
        "aria-[current=page]:bg-muted aria-[current=page]:font-semibold aria-[current=page]:text-foreground",
        !active && "text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}
