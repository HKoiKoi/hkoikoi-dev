import { describe, expect, it } from "vitest";
import { isBot } from "@/lib/views/is-bot";

const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const FIREFOX =
  "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0";

describe("isBot", () => {
  it("검색 엔진 크롤러는 봇", () => {
    expect(
      isBot(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
    ).toBe(true);
    expect(
      isBot(
        "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      ),
    ).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; YandexBot/3.0)")).toBe(true);
  });

  it("헤드리스 브라우저·Lighthouse는 봇", () => {
    expect(isBot(CHROME.replace("Chrome/", "HeadlessChrome/"))).toBe(true);
    expect(isBot(`${CHROME} Chrome-Lighthouse`)).toBe(true);
  });

  it("링크 미리보기·CLI 클라이언트는 봇", () => {
    expect(isBot("Slackbot-LinkExpanding 1.0")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot("curl/8.7.1")).toBe(true);
  });

  it("일반 브라우저 UA는 봇이 아님", () => {
    expect(isBot(CHROME)).toBe(false);
    expect(isBot(SAFARI_IOS)).toBe(false);
    expect(isBot(FIREFOX)).toBe(false);
  });

  it("대소문자를 구분하지 않음", () => {
    expect(isBot("GOOGLEBOT")).toBe(true);
  });

  it("null·undefined·빈 문자열·공백은 봇", () => {
    expect(isBot(null)).toBe(true);
    expect(isBot(undefined)).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot("   ")).toBe(true);
  });
});
