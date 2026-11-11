import { describe, expect, it } from "vitest";

import {
  formatTagGroups,
  parseResumeFormData,
  parseTagGroups,
  RESUME_LIMITS,
  resumeEntrySchema,
} from "./resume";

const valid = {
  title: "회사",
  subtitle: "",
  period: "",
  description: "",
  grade: "",
  grade_label: "",
  tags: [] as string[],
  tag_groups: [] as { label: string; tags: string[] }[],
  link: "",
};

function parse(overrides: Record<string, unknown> = {}) {
  return resumeEntrySchema.safeParse({ ...valid, ...overrides });
}

function errorPaths(result: ReturnType<typeof parse>) {
  return result.success ? [] : result.error.issues.map((i) => i.path[0]);
}

describe("parseTagGroups", () => {
  it("줄마다 '라벨: 태그, 태그'를 파싱한다", () => {
    expect(parseTagGroups("개발: React, Next.js\nDB: Postgres")).toEqual([
      { label: "개발", tags: ["React", "Next.js"] },
      { label: "DB", tags: ["Postgres"] },
    ]);
  });

  it("빈 줄·CRLF·전각 콜론·중복 태그를 처리한다", () => {
    expect(parseTagGroups("\r\n개발： a, a, b\r\n\r\n")).toEqual([
      { label: "개발", tags: ["a", "b"] },
    ]);
  });

  it("첫 콜론만 구분자로 쓴다", () => {
    expect(parseTagGroups("a: b:c")).toEqual([{ label: "a", tags: ["b:c"] }]);
  });

  it("콜론이 없는 줄은 태그가 빈 그룹이 된다", () => {
    expect(parseTagGroups("라벨만")).toEqual([{ label: "라벨만", tags: [] }]);
  });

  it("formatTagGroups로 되돌리면 같은 그룹이 나온다", () => {
    const groups = [{ label: "개발", tags: ["a", "b"] }];
    expect(parseTagGroups(formatTagGroups(groups))).toEqual(groups);
  });
});

describe("resumeEntrySchema", () => {
  it("올바른 입력을 통과시키고 빈 선택값을 null로 바꾼다", () => {
    const result = parse();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subtitle).toBeNull();
      expect(result.data.link).toBeNull();
    }
  });

  it("빈 제목과 공백 제목을 거부한다", () => {
    expect(errorPaths(parse({ title: "" }))).toContain("title");
    expect(errorPaths(parse({ title: "   " }))).toContain("title");
  });

  it("제목 200자는 통과, 201자는 거부한다", () => {
    expect(parse({ title: "가".repeat(200) }).success).toBe(true);
    expect(errorPaths(parse({ title: "가".repeat(201) }))).toContain("title");
  });

  it.each([
    ["subtitle", RESUME_LIMITS.subtitle],
    ["period", RESUME_LIMITS.period],
    ["description", RESUME_LIMITS.description],
    ["grade", RESUME_LIMITS.grade],
    ["grade_label", RESUME_LIMITS.gradeLabel],
  ])("%s 한도 경계값", (key, max) => {
    expect(parse({ [key]: "a".repeat(max) }).success).toBe(true);
    expect(errorPaths(parse({ [key]: "a".repeat(max + 1) }))).toContain(key);
  });

  it("태그는 20개까지, 원소는 50자까지 허용한다", () => {
    const twenty = Array.from({ length: 20 }, (_, i) => `t${i}`);
    expect(parse({ tags: twenty }).success).toBe(true);
    expect(errorPaths(parse({ tags: [...twenty, "t20"] }))).toContain("tags");
    expect(parse({ tags: ["a".repeat(50)] }).success).toBe(true);
    expect(errorPaths(parse({ tags: ["a".repeat(51)] }))).toContain("tags");
  });

  it("태그 그룹은 10개까지 허용한다", () => {
    const group = (i: number) => ({ label: `g${i}`, tags: ["a"] });
    const ten = Array.from({ length: 10 }, (_, i) => group(i));
    expect(parse({ tag_groups: ten }).success).toBe(true);
    expect(errorPaths(parse({ tag_groups: [...ten, group(10)] }))).toContain(
      "tag_groups",
    );
  });

  it("그룹 라벨 50자 경계와 빈 라벨·빈 태그를 검사한다", () => {
    expect(
      parse({ tag_groups: [{ label: "a".repeat(50), tags: ["x"] }] }).success,
    ).toBe(true);
    expect(
      parse({ tag_groups: [{ label: "a".repeat(51), tags: ["x"] }] }).success,
    ).toBe(false);
    expect(parse({ tag_groups: [{ label: "", tags: ["x"] }] }).success).toBe(
      false,
    );
    expect(parse({ tag_groups: [{ label: "a", tags: [] }] }).success).toBe(
      false,
    );
  });

  it("https 링크만 허용한다", () => {
    const ok = parse({ link: "https://example.com/a" });
    expect(ok.success && ok.data.link).toBe("https://example.com/a");
    for (const link of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "http://example.com",
      "https:",
      "https:example.com",
      "HTTPS://example.com",
      "https://",
      "example.com",
      "data:text/html,x",
    ]) {
      expect(errorPaths(parse({ link }))).toContain("link");
    }
  });

  it("링크 500자 경계", () => {
    const base = "https://e.com/";
    expect(parse({ link: base + "a".repeat(500 - base.length) }).success).toBe(
      true,
    );
    expect(
      errorPaths(parse({ link: base + "a".repeat(501 - base.length) })),
    ).toContain("link");
  });
});

describe("parseResumeFormData", () => {
  it("FormData를 스키마 입력으로 바꾼다", () => {
    const fd = new FormData();
    fd.set("title", "회사");
    fd.set("tags", "a, b, a");
    fd.set("tag_groups", "개발: x, y");
    expect(parseResumeFormData(fd)).toMatchObject({
      title: "회사",
      subtitle: "",
      tags: ["a", "b"],
      tag_groups: [{ label: "개발", tags: ["x", "y"] }],
    });
  });
});
