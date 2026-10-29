import Link from "next/link";
import { Suspense } from "react";
import { ChevronDownIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavGroupDropdown } from "@/components/layout/nav-group-dropdown";
import { NavLink } from "@/components/layout/nav-link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { isNavGroup, navItems, siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="shrink-0 rounded-md text-lg font-bold tracking-tight text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          {siteConfig.name}
        </Link>
        <nav aria-label="주요 메뉴" className="hidden min-w-0 md:block">
          {/* usePathname은 동적 라우트에서 요청 시점 값이므로 Suspense 필요 */}
          <Suspense fallback={<NavList active={false} />}>
            <NavList active />
          </Suspense>
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeSwitcher />
          <div className="md:hidden">
            <Suspense
              fallback={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10"
                  aria-label="메뉴 열기"
                  disabled
                >
                  <MenuIcon />
                </Button>
              }
            >
              <MobileNav />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

// active=false면 경로 강조 없이 정적 링크만 렌더링하는 fallback
function NavList({ active }: { active: boolean }) {
  return (
    <ul className="flex items-center gap-1">
      {navItems.map((item) => (
        <li key={isNavGroup(item) ? item.label : item.href}>
          {isNavGroup(item) ? (
            active ? (
              <NavGroupDropdown group={item} />
            ) : (
              // fallback: 링크가 아닌 정적 비활성 트리거 모양
              <span className="inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-sm whitespace-nowrap text-muted-foreground">
                {item.label}
                <ChevronDownIcon
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
              </span>
            )
          ) : active ? (
            <NavLink href={item.href}>{item.label}</NavLink>
          ) : (
            <Link
              href={item.href}
              className="inline-flex h-9 items-center rounded-md px-2.5 text-sm whitespace-nowrap text-muted-foreground"
            >
              {item.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
