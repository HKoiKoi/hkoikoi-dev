import { describe, expect, it } from "vitest";

import {
  parsePublicationFormData,
  PUBLICATION_LIMITS,
  publicationSchema,
} from "./publication";

const valid = {
  title: "논문",
  authors: "",
  venue: "",
  year: 2024,
  link: "",
};

function parse(overrides: Record<string, unknown> = {}) {
  return publicationSchema.safeParse({ ...valid, ...overrides });
}

function errorPaths(result: ReturnType<typeof parse>) {
  return result.success ? [] : result.error.issues.map((i) => i.path[0]);
}

describe("publicationSchema", () => {
  it("올바른 입력을 통과시키고 빈 링크를 null로 바꾼다", () => {
    const result = parse();
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.link).toBeNull();
  });

  it("빈 제목을 거부하고 500/501자 경계를 지킨다", () => {
    expect(errorPaths(parse({ title: "" }))).toContain("title");
    expect(parse({ title: "a".repeat(500) }).success).toBe(true);
    expect(errorPaths(parse({ title: "a".repeat(501) }))).toContain("title");
  });

  it.each([
    ["authors", PUBLICATION_LIMITS.authors],
    ["venue", PUBLICATION_LIMITS.venue],
  ])("%s 한도 경계값", (key, max) => {
    expect(parse({ [key]: "a".repeat(max) }).success).toBe(true);
    expect(errorPaths(parse({ [key]: "a".repeat(max + 1) }))).toContain(key);
  });

  it("연도는 1900~2100 정수만 허용한다", () => {
    expect(parse({ year: 1900 }).success).toBe(true);
    expect(parse({ year: 2100 }).success).toBe(true);
    expect(errorPaths(parse({ year: 1899 }))).toContain("year");
    expect(errorPaths(parse({ year: 2101 }))).toContain("year");
    expect(errorPaths(parse({ year: 2024.5 }))).toContain("year");
    expect(errorPaths(parse({ year: Number.NaN }))).toContain("year");
  });

  it("javascript: 와 http: 링크를 거부한다", () => {
    expect(errorPaths(parse({ link: "javascript:alert(1)" }))).toContain(
      "link",
    );
    expect(errorPaths(parse({ link: "http://a.com" }))).toContain("link");
    expect(parse({ link: "https://doi.org/10.1/x" }).success).toBe(true);
  });
});

describe("parsePublicationFormData", () => {
  it("연도를 숫자로 바꾸고 숫자가 아니면 NaN으로 둔다", () => {
    const fd = new FormData();
    fd.set("title", "t");
    fd.set("year", " 2024 ");
    expect(parsePublicationFormData(fd).year).toBe(2024);
    fd.set("year", "20a4");
    expect(parsePublicationFormData(fd).year).toBeNaN();
    fd.set("year", "");
    expect(parsePublicationFormData(fd).year).toBeNaN();
  });
});
