// 고아 이미지 판정 (순수 함수, Supabase·Next 비의존).
// Storage 목록·삭제 같은 I/O는 호출 측이 맡고, 여기서는 "무엇이 후보인가"만 계산한다.

/** 버킷 안의 객체 한 건. path는 버킷 기준 상대 경로(YYYY/MM/<uuid>.<ext>). */
export type StorageObjectInfo = {
  path: string;
  size: number;
  /** ISO 8601 업로드 시각 */
  createdAt: string;
};

/** 편집 중 업로드했지만 아직 저장하지 않은 이미지를 지키기 위한 기본 유예 기간(일). */
export const DEFAULT_GRACE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 참조되지 않았고 유예 기간이 지난 객체만 오래된 순으로 돌려준다.
 * 업로드 시각을 해석할 수 없는 객체는 안전하게 후보에서 뺀다.
 */
export function filterOrphans(
  objects: ReadonlyArray<StorageObjectInfo>,
  referenced: ReadonlySet<string>,
  now: Date,
  graceDays: number = DEFAULT_GRACE_DAYS,
): StorageObjectInfo[] {
  const cutoff = now.getTime() - graceDays * DAY_MS;

  return objects
    .map((object) => ({ object, time: Date.parse(object.createdAt) }))
    .filter(
      ({ object, time }) =>
        !referenced.has(object.path) && Number.isFinite(time) && time <= cutoff,
    )
    .sort((a, b) => a.time - b.time)
    .map(({ object }) => object);
}
