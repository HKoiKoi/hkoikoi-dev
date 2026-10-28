/**
 * 저장 시 published_at 값을 결정한다.
 * - 최초 발행(existing 없음, published=true): 현재 시각
 * - 이미 값이 있으면 항상 유지한다. 초안으로 전환해도 지우지 않는다(정책).
 *   다시 발행해도 최초 발행일이 바뀌지 않아 목록 정렬과 URL 기준 날짜가 안정적이다.
 * - 한 번도 발행하지 않은 초안: null
 */
export function resolvePublishedAt(
  existing: string | null,
  published: boolean,
  now: Date = new Date(),
): string | null {
  if (existing) return existing;
  return published ? now.toISOString() : null;
}
