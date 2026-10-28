import { requireAdmin } from "@/lib/auth/require-admin";

// 관리자 영역의 본문을 감싸는 서버 가드. 세션 읽기는 요청 시점이므로
// 호출하는 쪽에서 반드시 <Suspense> 안에 둔다.
// 레이아웃은 클라이언트 전환 시 다시 렌더링되지 않을 수 있으므로 이 가드에만 의존하지 않고,
// 각 페이지도 시작부에서 requireAdmin()을 다시 호출한다.
// Server Action(savePost, deletePost)도 첫 줄에서 requireAdmin()을 직접 호출한다.
export async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
