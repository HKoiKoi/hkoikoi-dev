// 푸터에 표시할 관리자 링크 (placeholder).
// TODO(Task 011): Supabase `getClaims()`로 로그인 사용자의 역할을 확인해
// 관리자일 때만 `/admin` 링크를 렌더링한다.
// 이후 쿠키(요청 시점 데이터)를 읽게 되므로 호출하는 쪽에서 반드시 <Suspense>로 감싼다.
export async function AdminLink() {
  return null;
}
