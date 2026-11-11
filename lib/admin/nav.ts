export type AdminNavItem = { href: string; label: string };

// 관리자 헤더 메뉴. 이력은 섹션 6개를 한 링크로 두고 섹션 전환은 페이지 상단 탭에서 한다.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/posts", label: "글 관리" },
  { href: "/admin/posts/new", label: "새 글" },
  { href: "/admin/resume/education", label: "이력" },
  { href: "/admin/projects", label: "프로젝트" },
  { href: "/admin/publications", label: "논문" },
  { href: "/admin/storage", label: "스토리지" },
];

/**
 * 메뉴 항목이 현재 경로에 해당하는지 판별한다(경로 접두 기준).
 * - "글 관리"는 새 글·수정 하위 경로에서도 활성이되, 더 구체적인 "새 글"이 일치하면 그쪽만 활성이다.
 * - "이력"은 /admin/resume 아래 어느 섹션이든 활성이다.
 */
export function isNavCurrent(href: string, pathname: string): boolean {
  if (href === "/admin/posts") {
    return pathname === href || /^\/admin\/posts\/(?!new(\/|$))/.test(pathname);
  }
  // 이력은 href가 첫 섹션이라 접두를 /admin/resume으로 바꿔 비교한다.
  const base = href.startsWith("/admin/resume/") ? "/admin/resume" : href;
  return pathname === base || pathname.startsWith(`${base}/`);
}
