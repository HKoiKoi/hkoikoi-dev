export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* 헤더 자리: 사이트 내비게이션이 들어갈 예정 */}
      {children}
      {/* 푸터 자리: 저작권·링크가 들어갈 예정 */}
    </>
  );
}
