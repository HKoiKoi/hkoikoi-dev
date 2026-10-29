import { afterEach, describe, expect, it, vi } from "vitest";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

describe("site-url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("설정된 값의 끝 슬래시를 제거한다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hkoikoi.dev//");
    expect(getSiteUrl()).toBe("https://hkoikoi.dev");
  });

  it("미설정이면 로컬 개발 주소를 쓴다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("경로를 붙여 절대 URL을 만든다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hkoikoi.dev/");
    expect(absoluteUrl("/sitemap.xml")).toBe("https://hkoikoi.dev/sitemap.xml");
  });
});
