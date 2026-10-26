import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      {children}
      {/* 푸터 자리: 저작권·링크가 들어갈 예정 */}
    </>
  );
}
