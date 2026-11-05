import type { Metadata } from "next";

// 하위 page에서 robots를 다시 지정하면 얕은 병합으로 이 값이 사라지므로 지정하지 않는다.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return children;
}
