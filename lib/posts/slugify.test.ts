import { describe, expect, it } from "vitest";

import { slugify } from "./slugify";

describe("slugify", () => {
  it("공백·대소문자·특수문자를 정리한다", () => {
    expect(slugify("Next.js 16 시작하기!")).toBe("nextjs-16-시작하기");
  });

  it("연속 공백·하이픈을 축약하고 양끝 하이픈을 제거한다", () => {
    expect(slugify("  Hello   -- World  ")).toBe("hello-world");
  });

  it("NFD로 분해된 한글도 NFC 결과와 동일하다", () => {
    const nfc = "시작하기 가이드";
    const nfd = nfc.normalize("NFD");
    expect(nfd).not.toBe(nfc);
    expect(slugify(nfd)).toBe(slugify(nfc));
    expect(slugify(nfd)).toBe("시작하기-가이드");
  });

  it("특수문자만 있으면 빈 문자열을 반환한다", () => {
    expect(slugify("!@#$%^&*()")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});
