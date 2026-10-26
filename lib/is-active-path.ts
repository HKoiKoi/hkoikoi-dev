// 현재 경로가 내비게이션 항목 href와 일치하는지 판정한다.
// "/"는 정확 일치, 그 외에는 하위 경로까지 활성으로 본다.
export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
