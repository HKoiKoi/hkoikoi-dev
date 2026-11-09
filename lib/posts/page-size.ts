// /blog 목록의 페이지 크기. 모바일은 6개, 그 외는 10개다.
// 목록은 서버에서 DB를 잘라 가져오므로 CSS 미디어쿼리로는 나눌 수 없어 요청 헤더로 기기를 판별한다.

export const DESKTOP_PAGE_SIZE = 10;
export const MOBILE_PAGE_SIZE = 6;

// Sec-CH-UA-Mobile이 없는 브라우저(Safari·Firefox)를 위한 User-Agent 추정.
// 태블릿(iPad, Mobile 표시가 없는 Android 태블릿)은 넓은 화면이라 데스크톱 크기로 둔다.
const MOBILE_UA = /Mobi|iPhone|iPod/i;

export function isMobileRequest(headers: Pick<Headers, "get">): boolean {
  // Chromium은 기본으로 보내는 저엔트로피 힌트다. 값은 ?1(모바일) 또는 ?0이다.
  const hint = headers.get("sec-ch-ua-mobile");
  if (hint === "?1") return true;
  if (hint === "?0") return false;
  return MOBILE_UA.test(headers.get("user-agent") ?? "");
}

export function getPageSize(headers: Pick<Headers, "get">): number {
  return isMobileRequest(headers) ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
}
