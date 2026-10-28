"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isActivePath, isGroupActive } from "@/lib/is-active-path";
import type { NavGroup } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type NavGroupDropdownProps = {
  group: NavGroup;
};

// 데스크톱 내비의 그룹 드롭다운 (트리거 + 하위 링크 목록)
export function NavGroupDropdown({ group }: NavGroupDropdownProps) {
  const pathname = usePathname();
  const active = isGroupActive(pathname, group);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-sm whitespace-nowrap transition-colors outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted/60 data-popup-open:text-foreground [&_svg]:size-3.5 [&_svg]:shrink-0",
          active
            ? "bg-muted font-semibold text-foreground"
            : "text-muted-foreground",
        )}
      >
        {group.label}
        <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-36">
        <DropdownMenuGroup>
          {group.children.map((child) => {
            const current = isActivePath(pathname, child.href);
            return (
              <DropdownMenuItem
                key={child.href}
                render={
                  <Link
                    href={child.href}
                    aria-current={current ? "page" : undefined}
                  />
                }
                className="min-h-9 px-2.5 aria-[current=page]:bg-muted aria-[current=page]:font-semibold"
              >
                {child.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
