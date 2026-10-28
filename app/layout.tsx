import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "hkoikoi.dev",
    template: "%s | hkoikoi.dev",
  },
  description: "hkoikoi의 개발 블로그와 프로젝트 기록",
};

// 가변 폰트이므로 weight를 지정하지 않는다(기본값 'variable').
// 타입 정의상 Noto Sans KR의 subsets에 'korean'이 없어 'latin'만 preload하고,
// 한글 글리프는 Google Fonts가 제공하는 unicode-range 조각으로 로드된다.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
