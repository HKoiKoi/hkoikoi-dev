import { describe, expect, it } from "vitest";

import { parsePostFormData } from "@/lib/posts/form-data";

function makeForm(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.set(key, value);
  return formData;
}

describe("parsePostFormData", () => {
  it("모든 필드를 변환한다", () => {
    const result = parsePostFormData(
      makeForm({
        id: " abc ",
        title: "제목",
        slug: "my-slug",
        category: "개발",
        tags: "a, b, a,",
        excerpt: "소개",
        content: "본문",
        thumbnail_url: "https://x/y.png",
        published: "on",
      }),
    );
    expect(result.id).toBe("abc");
    expect(result.values).toEqual({
      title: "제목",
      slug: "my-slug",
      category: "개발",
      tags: ["a", "b"],
      excerpt: "소개",
      content: "본문",
      thumbnail_url: "https://x/y.png",
      published: true,
    });
  });

  it("누락된 필드는 빈 값, published는 false, id는 null이다", () => {
    const result = parsePostFormData(new FormData());
    expect(result.id).toBeNull();
    expect(result.values.published).toBe(false);
    expect(result.values.tags).toEqual([]);
    expect(result.values.title).toBe("");
  });

  it("published가 'on'이 아니면 false다", () => {
    expect(
      parsePostFormData(makeForm({ published: "true" })).values.published,
    ).toBe(false);
  });

  it("문자열이 아닌 값(File)은 빈 문자열로 취급한다", () => {
    const formData = new FormData();
    formData.set("title", new File(["x"], "a.txt"));
    expect(parsePostFormData(formData).values.title).toBe("");
  });
});
