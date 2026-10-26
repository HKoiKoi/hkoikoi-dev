import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/format-date";

describe("formatDate", () => {
  it("ISO 문자열을 '연. 월. 일.' 형식으로 변환한다", () => {
    expect(formatDate("2026-10-25T03:00:00Z")).toBe("2026. 10. 25.");
  });

  it("UTC 자정 직전 입력은 서울 기준 다음 날로 변환한다", () => {
    expect(formatDate("2026-10-25T23:59:00Z")).toBe("2026. 10. 26.");
  });
});
