import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";

describe("robots", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("/admin과 /auth를 차단하고 나머지는 허용한다", () => {
    expect(robots().rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth"],
    });
  });

  it("sitemap은 NEXT_PUBLIC_SITE_URL 기준 절대 URL이다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");
    expect(robots().sitemap).toBe("https://example.com/sitemap.xml");
  });
});
