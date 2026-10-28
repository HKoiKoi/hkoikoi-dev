// JWT claims에서 관리자 여부를 판정한다.
// 사용자가 직접 수정할 수 있는 user_metadata는 절대 참조하지 않고 app_metadata.role만 본다.
export function isAdmin(
  claims: { app_metadata?: object } | null | undefined,
): boolean {
  const appMetadata = claims?.app_metadata as { role?: unknown } | undefined;
  return appMetadata?.role === "admin";
}
