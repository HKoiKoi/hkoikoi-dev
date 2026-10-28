// 보호 대상은 /admin 세그먼트뿐이다. /administrator 같은 경로는 보호하지 않는다.
export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
