// 편집기 로컬 백업 (localStorage). React 비의존 순수 모듈이며 모든 접근은 실패해도 예외를 던지지 않는다.

export type PostDraft = {
  title: string;
  slug: string;
  category: string;
  tags: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string;
  /** 로컬에 저장한 시각(ms) */
  savedAt: number;
  /** 편집을 시작한 시점의 서버 updated_at. 새 글이면 null */
  baseUpdatedAt: string | null;
};

const STRING_FIELDS = [
  "title",
  "slug",
  "category",
  "tags",
  "excerpt",
  "content",
  "thumbnailUrl",
] as const;

/** id가 없으면(새 글) `post-draft:new`를 쓴다. */
export function draftKey(id: string | null): string {
  return `post-draft:${id ?? "new"}`;
}

function isPostDraft(value: unknown): value is PostDraft {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!STRING_FIELDS.every((field) => typeof obj[field] === "string")) {
    return false;
  }
  if (typeof obj.savedAt !== "number" || !Number.isFinite(obj.savedAt)) {
    return false;
  }
  return obj.baseUpdatedAt === null || typeof obj.baseUpdatedAt === "string";
}

/** 저장된 사본을 읽는다. 없거나 깨졌거나 저장소를 쓸 수 없으면 null. */
export function readDraft(id: string | null): PostDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(id));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPostDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 사본을 저장한다. 용량 초과·저장소 사용 불가면 false. */
export function writeDraft(id: string | null, draft: PostDraft): boolean {
  try {
    localStorage.setItem(draftKey(id), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/** 사본을 지운다. 실패해도 조용히 넘어간다. */
export function clearDraft(id: string | null): void {
  try {
    localStorage.removeItem(draftKey(id));
  } catch {
    // 저장소를 쓸 수 없으면 지울 것도 없다.
  }
}
