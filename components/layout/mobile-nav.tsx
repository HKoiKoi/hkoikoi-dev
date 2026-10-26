"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isActivePath } from "@/lib/is-active-path";
import { navItems } from "@/lib/site-config";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="메뉴 열기"
          />
        }
      >
        <MenuIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <DropdownMenuItem
              key={item.href}
              render={
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                />
              }
              className="min-h-10 px-3 text-sm aria-[current=page]:bg-muted aria-[current=page]:font-semibold"
            >
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
