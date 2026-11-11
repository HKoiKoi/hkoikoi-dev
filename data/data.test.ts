import { describe, expect, it } from "vitest";

import { profile } from "@/data/profile";

// 이력·프로젝트·논문은 DB(resume_entries, projects, publications)로 옮겼다.
// 길이·링크·section 제약은 마이그레이션 check가, 조회·매핑은 lib/queries/resume.test.ts가 검증한다.
const isBlank = (value: string | undefined) => !value || value.trim() === "";

describe("profile", () => {
  it("필수 필드가 채워져 있다", () => {
    for (const key of ["name", "tagline", "bio", "email", "github"] as const) {
      expect(isBlank(profile[key])).toBe(false);
    }
  });

  it("이메일과 GitHub 주소 형식이 올바르다", () => {
    expect(profile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(profile.github).toMatch(/^https:\/\/github\.com\//);
  });
});
