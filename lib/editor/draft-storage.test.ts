import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearDraft,
  draftKey,
  readDraft,
  writeDraft,
  type PostDraft,
} from "./draft-storage";

const draft: PostDraft = {
  title: "제목",
  slug: "slug",
  category: "개발",
  tags: "a, b",
  excerpt: "소개",
  content: "# 본문",
  thumbnailUrl: "",
  savedAt: 1_700_000_000_000,
  baseUpdatedAt: "2026-01-01T00:00:00Z",
};

describe("draft-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("draftKey는 id 또는 new를 쓴다", () => {
    expect(draftKey("abc")).toBe("post-draft:abc");
    expect(draftKey(null)).toBe("post-draft:new");
  });

  it("쓴 사본을 그대로 읽고 지울 수 있다", () => {
    expect(writeDraft("abc", draft)).toBe(true);
    expect(readDraft("abc")).toEqual(draft);
    clearDraft("abc");
    expect(readDraft("abc")).toBeNull();
  });

  it("새 글과 기존 글의 사본은 서로 섞이지 않는다", () => {
    writeDraft(null, { ...draft, baseUpdatedAt: null });
    expect(readDraft("abc")).toBeNull();
    expect(readDraft(null)?.baseUpdatedAt).toBeNull();
  });

  it("사본이 없으면 null", () => {
    expect(readDraft("none")).toBeNull();
  });

  it("JSON이 깨졌으면 null", () => {
    localStorage.setItem(draftKey("abc"), "{not json");
    expect(readDraft("abc")).toBeNull();
  });

  it.each([
    ["객체가 아님", "null"],
    ["문자열 필드 타입 불일치", JSON.stringify({ ...draft, title: 1 })],
    ["savedAt이 숫자가 아님", JSON.stringify({ ...draft, savedAt: "1" })],
    [
      "baseUpdatedAt 타입 불일치",
      JSON.stringify({ ...draft, baseUpdatedAt: 3 }),
    ],
    ["필드 누락", JSON.stringify({ ...draft, content: undefined })],
  ])("필드 검증 실패(%s)면 null", (_name, raw) => {
    localStorage.setItem(draftKey("abc"), raw);
    expect(readDraft("abc")).toBeNull();
  });

  it("용량 초과면 writeDraft는 false", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    expect(writeDraft("abc", draft)).toBe(false);
  });

  it("localStorage 접근자가 throw해도 예외 없이 처리한다", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    expect(readDraft("abc")).toBeNull();
    expect(writeDraft("abc", draft)).toBe(false);
    expect(() => clearDraft("abc")).not.toThrow();
  });
});
