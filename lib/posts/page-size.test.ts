import { describe, expect, it } from "vitest";

import {
  DESKTOP_PAGE_SIZE,
  getPageSize,
  isMobileRequest,
  MOBILE_PAGE_SIZE,
} from "./page-size";

const headersOf = (init: Record<string, string>) => new Headers(init);

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID_PHONE =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";
const ANDROID_TABLET =
  "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const IPAD =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const DESKTOP_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

describe("페이지 크기 상수", () => {
  it("모바일은 6개, 그 외는 10개다", () => {
    expect(MOBILE_PAGE_SIZE).toBe(6);
    expect(DESKTOP_PAGE_SIZE).toBe(10);
  });
});

describe("isMobileRequest", () => {
  it("Sec-CH-UA-Mobile이 ?1이면 모바일이다", () => {
    expect(isMobileRequest(headersOf({ "sec-ch-ua-mobile": "?1" }))).toBe(true);
  });

  it("Sec-CH-UA-Mobile이 ?0이면 User-Agent와 무관하게 모바일이 아니다", () => {
    expect(
      isMobileRequest(
        headersOf({ "sec-ch-ua-mobile": "?0", "user-agent": IPHONE }),
      ),
    ).toBe(false);
  });

  it("힌트가 없으면 iPhone·Android 폰 User-Agent를 모바일로 본다", () => {
    expect(isMobileRequest(headersOf({ "user-agent": IPHONE }))).toBe(true);
    expect(isMobileRequest(headersOf({ "user-agent": ANDROID_PHONE }))).toBe(
      true,
    );
  });

  it("힌트가 없을 때 태블릿과 데스크톱은 모바일이 아니다", () => {
    for (const ua of [ANDROID_TABLET, IPAD, DESKTOP_CHROME]) {
      expect(isMobileRequest(headersOf({ "user-agent": ua }))).toBe(false);
    }
  });

  it("헤더가 하나도 없으면 모바일이 아니다", () => {
    expect(isMobileRequest(headersOf({}))).toBe(false);
  });
});

describe("getPageSize", () => {
  it("모바일이면 6, 아니면 10을 돌려준다", () => {
    expect(getPageSize(headersOf({ "sec-ch-ua-mobile": "?1" }))).toBe(6);
    expect(getPageSize(headersOf({ "user-agent": DESKTOP_CHROME }))).toBe(10);
    expect(getPageSize(headersOf({}))).toBe(10);
  });
});
