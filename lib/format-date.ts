// 서버/클라이언트 모두 동일한 결과를 내도록 타임존을 Asia/Seoul로 고정한다.
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

// ISO 8601 문자열을 '2026. 10. 25.' 형식(서울 기준)으로 변환한다.
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
