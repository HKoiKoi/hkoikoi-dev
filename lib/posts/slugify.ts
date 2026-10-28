/**
 * 제목을 URL 슬러그로 변환한다. 한글은 유지하고 영문은 소문자로 바꾼다.
 * 순서: NFC 정규화 → 공백→하이픈 → 소문자 → 허용 문자 외 제거 → 연속 하이픈 축약 → 양끝 하이픈 제거
 */
export function slugify(input: string): string {
  return input
    .normalize("NFC")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}
