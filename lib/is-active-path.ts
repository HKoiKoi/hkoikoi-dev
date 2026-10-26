import type { NavGroup } from "@/lib/site-config";

// 현재 경로가 내비게이션 항목 href와 일치하는지 판정한다.
// "/"는 정확 일치, 그 외에는 하위 경로까지 활성으로 본다.
export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// 그룹의 자식 중 하나라도 활성이면 그룹을 활성으로 본다.
export function isGroupActive(pathname: string, group: NavGroup) {
  return group.children.some((child) => isActivePath(pathname, child.href));
}
