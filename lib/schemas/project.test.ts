import { describe, expect, it } from "vitest";

import { parseProjectFormData, PROJECT_LIMITS, projectSchema } from "./project";

const valid = {
  name: "프로젝트",
  summary: "",
  period: "",
  role: "",
  stack: [] as string[],
  github_url: "",
  demo_url: "",
  featured: false,
};

function parse(overrides: Record<string, unknown> = {}) {
  return projectSchema.safeParse({ ...valid, ...overrides });
}

function errorPaths(result: ReturnType<typeof parse>) {
  return result.success ? [] : result.error.issues.map((i) => i.path[0]);
}

describe("projectSchema", () => {
  it("올바른 입력을 통과시키고 빈 URL을 null로 바꾼다", () => {
    const result = parse();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.github_url).toBeNull();
      expect(result.data.demo_url).toBeNull();
      expect(result.data.summary).toBe("");
    }
  });

  it("빈 이름을 거부하고 200/201자 경계를 지킨다", () => {
    expect(errorPaths(parse({ name: "" }))).toContain("name");
    expect(parse({ name: "a".repeat(200) }).success).toBe(true);
    expect(errorPaths(parse({ name: "a".repeat(201) }))).toContain("name");
  });

  it.each([
    ["summary", PROJECT_LIMITS.summary],
    ["period", PROJECT_LIMITS.period],
    ["role", PROJECT_LIMITS.role],
  ])("%s 한도 경계값", (key, max) => {
    expect(parse({ [key]: "a".repeat(max) }).success).toBe(true);
    expect(errorPaths(parse({ [key]: "a".repeat(max + 1) }))).toContain(key);
  });

  it("스택은 20개까지, 원소는 50자까지 허용한다", () => {
    const twenty = Array.from({ length: 20 }, (_, i) => `s${i}`);
    expect(parse({ stack: twenty }).success).toBe(true);
    expect(errorPaths(parse({ stack: [...twenty, "x"] }))).toContain("stack");
    expect(errorPaths(parse({ stack: ["a".repeat(51)] }))).toContain("stack");
  });

  it("javascript: 와 http: URL을 거부한다", () => {
    for (const key of ["github_url", "demo_url"]) {
      expect(errorPaths(parse({ [key]: "javascript:alert(1)" }))).toContain(
        key,
      );
      expect(errorPaths(parse({ [key]: "http://a.com" }))).toContain(key);
      expect(parse({ [key]: "https://a.com" }).success).toBe(true);
    }
  });
});

describe("parseProjectFormData", () => {
  it("체크박스와 스택을 변환한다", () => {
    const fd = new FormData();
    fd.set("name", "p");
    fd.set("stack", "a, b");
    fd.set("featured", "on");
    expect(parseProjectFormData(fd)).toMatchObject({
      name: "p",
      stack: ["a", "b"],
      featured: true,
    });
    fd.delete("featured");
    expect(parseProjectFormData(fd).featured).toBe(false);
  });
});
