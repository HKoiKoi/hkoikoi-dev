import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SkipLink } from "@/components/layout/skip-link";
import { getSiteUrl } from "@/lib/site-url";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "hkoikoi.dev",
    template: "%s | hkoikoi.dev",
  },
  description: "hkoikoi의 개발 블로그와 프로젝트 기록",
};

// 본문 폰트 Pretendard Variable은 위 CSS(unicode-range 분할 서브셋, font-display: swap)로 로드하고,
// 폰트 이름은 globals.css의 --font-sans에서 지정한다. 코드용 JetBrains Mono는 가변 폰트다.
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={jetBrainsMono.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipLink />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
