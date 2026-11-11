// User-Agent로 봇·자동화 도구를 판정한다. 조회수 집계에서 제외하는 용도다.
// UA는 위조할 수 있으므로 정확한 차단이 아니라 흔한 크롤러·헤드리스 브라우저를 걸러내는 1차 필터다.
// 저장하지 않고 요청 중 판정에만 쓴다.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|curl|wget|python-requests|go-http-client|node-fetch|undici|axios|httpclient/i;

export function isBot(userAgent: string | null | undefined): boolean {
  // UA가 없으면 브라우저가 아닌 클라이언트로 본다.
  if (!userAgent || userAgent.trim() === "") return true;
  return BOT_PATTERN.test(userAgent);
}
