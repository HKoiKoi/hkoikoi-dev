"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isActivePath } from "@/lib/is-active-path";
import { isNavGroup, navItems } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const itemClassName =
  "min-h-10 px-3 text-sm aria-[current=page]:bg-muted aria-[current=page]:font-semibold";

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
      <DropdownMenuContent align="end" className="w-48">
        {navItems.map((item, index) => {
          const isLast = index === navItems.length - 1;

          if (isNavGroup(item)) {
            return (
              <Fragment key={item.label}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-3">
                    {item.label}
                  </DropdownMenuLabel>
                  {item.children.map((child) => (
                    <DropdownMenuItem
                      key={child.href}
                      render={
                        <Link
                          href={child.href}
                          aria-current={
                            isActivePath(pathname, child.href)
                              ? "page"
                              : undefined
                          }
                        />
                      }
                      className={cn(itemClassName, "pl-6")}
                    >
                      {child.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                {!isLast && <DropdownMenuSeparator />}
              </Fragment>
            );
          }

          return (
            <DropdownMenuItem
              key={item.href}
              render={
                <Link
                  href={item.href}
                  aria-current={
                    isActivePath(pathname, item.href) ? "page" : undefined
                  }
                />
              }
              className={itemClassName}
            >
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
