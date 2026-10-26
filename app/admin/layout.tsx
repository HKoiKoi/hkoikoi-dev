export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // TODO: 관리자 권한 검증은 이후 Task에서 추가한다 (현재는 proxy의 로그인 검사만 적용).
  return <div className="mx-auto w-full max-w-5xl px-4 py-12">{children}</div>;
}
