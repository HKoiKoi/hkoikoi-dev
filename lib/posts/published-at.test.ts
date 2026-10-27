import { describe, expect, it } from "vitest";

import { resolvePublishedAt } from "./published-at";

const NOW = new Date("2026-10-27T12:00:00.000Z");
const EXISTING = "2026-01-01T00:00:00.000Z";

describe("resolvePublishedAt", () => {
  it("최초 발행이면 현재 시각을 반환한다", () => {
    expect(resolvePublishedAt(null, true, NOW)).toBe(NOW.toISOString());
  });

  it("이미 발행한 글을 다시 저장해도 기존 값을 유지한다", () => {
    expect(resolvePublishedAt(EXISTING, true, NOW)).toBe(EXISTING);
  });

  it("초안으로 전환해도 기존 값을 유지한다", () => {
    expect(resolvePublishedAt(EXISTING, false, NOW)).toBe(EXISTING);
  });

  it("발행한 적 없는 초안은 null이다", () => {
    expect(resolvePublishedAt(null, false, NOW)).toBeNull();
  });
});
