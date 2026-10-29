// NEXT_PUBLIC_*는 리터럴로 읽어야 빌드 때 인라인된다. 미설정이면 로컬 개발 주소로 대체하므로
// 배포 환경에서는 반드시 운영 도메인을 설정한다(Task 020).
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

/** 사이트 기준 절대 URL. path는 `/`로 시작한다. */
export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path}`;
}
