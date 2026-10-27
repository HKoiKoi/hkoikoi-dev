import { afterEach, describe, expect, it, vi } from "vitest";

import { parseTags, POST_LIMITS, postSchema } from "./post";

const SUPABASE_URL = "https://abc.supabase.co";
const BUCKET = `${SUPABASE_URL}/storage/v1/object/public/blog-images/`;

const valid = {
  title: "제목",
  slug: "hello-world",
  category: "일반",
  tags: ["a"],
  excerpt: "",
  content: "",
  thumbnail_url: "",
  published: false,
};

function parse(overrides: Partial<Record<keyof typeof valid, unknown>> = {}) {
  return postSchema.safeParse({ ...valid, ...overrides });
}

function errorPaths(result: ReturnType<typeof parse>) {
  return result.success ? [] : result.error.issues.map((i) => i.path[0]);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseTags", () => {
  it("trim·빈 값·중복을 제거한다", () => {
    expect(parseTags(" a, b ,, a ,c")).toEqual(["a", "b", "c"]);
  });
});

describe("postSchema", () => {
  it("올바른 입력을 통과시킨다", () => {
    expect(parse().success).toBe(true);
  });

  it("title이 비어 있거나 공백뿐이면 거부한다", () => {
    expect(errorPaths(parse({ title: "   " }))).toContain("title");
  });

  it("title 201자를 거부한다", () => {
    expect(
      errorPaths(parse({ title: "a".repeat(POST_LIMITS.title + 1) })),
    ).toContain("title");
  });

  it("NFD 한글 슬러그를 NFC로 정규화한다", () => {
    const result = parse({ slug: "한글".normalize("NFD") });
    expect(result.success && result.data.slug).toBe("한글");
  });

  it.each(["", "Hello", "a b", "a_b", "a/b", "-a", "a--b"])(
    "슬러그 %j를 거부한다",
    (slug) => {
      expect(errorPaths(parse({ slug }))).toContain("slug");
    },
  );

  it("category가 비면 '일반'이 된다", () => {
    const result = parse({ category: "  " });
    expect(result.success && result.data.category).toBe("일반");
  });

  it("tags의 중복·빈 값을 제거한다", () => {
    const result = parse({ tags: [" a ", "a", ""] });
    expect(result.success && result.data.tags).toEqual(["a"]);
  });

  it("tags 10개는 통과, 11개는 거부한다", () => {
    const make = (n: number) => Array.from({ length: n }, (_, i) => `t${i}`);
    expect(parse({ tags: make(10) }).success).toBe(true);
    expect(errorPaths(parse({ tags: make(11) }))).toContain("tags");
  });

  it("excerpt 150자는 통과, 151자는 거부한다", () => {
    expect(parse({ excerpt: "a".repeat(150) }).success).toBe(true);
    expect(errorPaths(parse({ excerpt: "a".repeat(151) }))).toContain(
      "excerpt",
    );
  });

  it("content 상한을 넘으면 거부한다", () => {
    expect(
      errorPaths(parse({ content: "a".repeat(POST_LIMITS.content + 1) })),
    ).toContain("content");
  });

  describe("thumbnail_url", () => {
    it("빈 값은 null이 된다", () => {
      const result = parse({ thumbnail_url: "" });
      expect(result.success && result.data.thumbnail_url).toBeNull();
    });

    it("버킷 URL은 통과한다", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
      const url = `${BUCKET}posts/a.png`;
      const result = parse({ thumbnail_url: url });
      expect(result.success && result.data.thumbnail_url).toBe(url);
    });

    it("외부 도메인과 javascript: 를 거부한다", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
      for (const thumbnail_url of [
        "https://evil.com/a.png",
        "javascript:alert(1)",
        `${SUPABASE_URL}.evil.com/storage/v1/object/public/blog-images/a.png`,
      ]) {
        expect(errorPaths(parse({ thumbnail_url }))).toContain("thumbnail_url");
      }
    });

    it("환경변수가 없으면 값이 있는 썸네일을 거부한다", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      expect(errorPaths(parse({ thumbnail_url: `${BUCKET}a.png` }))).toContain(
        "thumbnail_url",
      );
    });
  });
});
