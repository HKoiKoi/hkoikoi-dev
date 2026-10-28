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

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  nextConfig,
);
