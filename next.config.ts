import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// nonce 기반 CSP는 모든 페이지를 동적 렌더링해야 해 cacheComponents와 맞지 않고, script-src를
// 'unsafe-inline'으로 열면(next-themes·KaTeX 인라인 스크립트) 이득이 작다. 그래서 script/style/img
// 정책은 두지 않고, 글 본문의 임의 HTML과 충돌하지 않는 지시어만 적용한다.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

// 썸네일은 lib/schemas/post.ts가 Supabase Storage 공개 버킷 주소만 허용하므로 같은 호스트·경로만 연다.
// 환경변수가 없거나 잘못된 값이면 외부 이미지 최적화를 열지 않는다.
function getSupabaseImagePatterns(): URL[] {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return [];
  try {
    const { protocol, hostname, port } = new URL(base);
    return [
      new URL(
        `${protocol}//${hostname}${port ? `:${port}` : ""}/storage/v1/object/public/blog-images/**`,
      ),
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: { remotePatterns: getSupabaseImagePatterns() },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  nextConfig,
);
