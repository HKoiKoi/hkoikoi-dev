import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const cacheTagMock = vi.hoisted(() => vi.fn());
const cacheLifeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/public", () => ({
  createPublicClient: createClientMock,
}));
vi.mock("next/cache", () => ({
  cacheTag: cacheTagMock,
  cacheLife: cacheLifeMock,
}));

import { getLatestPosts, getPostBySlug, getPublishedPosts } from "./posts";

type Result = { data: unknown; error: { message: string } | null };

// 체이닝 가능하고 await하면 result로 풀리는 가짜 쿼리 빌더
function createBuilder(result: Result) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    contains: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (
      resolve: (value: Result) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  for (const key of ["select", "eq", "contains", "order", "limit"] as const) {
    builder[key].mockReturnValue(builder);
  }
  const from = vi.fn(() => builder);
  createClientMock.mockReturnValue({ from });
  return { builder, from };
}

const ok = (data: unknown): Result => ({ data, error: null });

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  errorSpy.mockRestore();
});

describe("getLatestPosts", () => {
  it("published 조건·내림차순·limit으로 조회하고 content는 select하지 않는다", async () => {
    const rows = [{ id: "1" }];
    const { builder, from } = createBuilder(ok(rows));

    await expect(getLatestPosts(3)).resolves.toEqual(rows);

    expect(from).toHaveBeenCalledWith("posts");
    const columns = builder.select.mock.calls[0][0] as string;
    expect(columns).not.toContain("content");
    expect(builder.eq).toHaveBeenCalledWith("published", true);
    expect(builder.order).toHaveBeenCalledWith("published_at", {
      ascending: false,
    });
    expect(builder.limit).toHaveBeenCalledWith(3);
  });

  it("posts 태그를 붙인다", async () => {
    createBuilder(ok([]));

    await getLatestPosts(3);

    expect(cacheTagMock).toHaveBeenCalledWith("posts");
    expect(cacheLifeMock).toHaveBeenCalledWith("max");
  });

  it("오류면 []를 반환하고 로그를 남긴다", async () => {
    createBuilder({ data: null, error: { message: "boom" } });

    await expect(getLatestPosts(3)).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("클라이언트 생성이 던져도 []를 반환한다", async () => {
    createClientMock.mockImplementation(() => {
      throw new Error("no env");
    });

    await expect(getLatestPosts(3)).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("getPublishedPosts", () => {
  it("필터가 없으면 published 조건만 건다", async () => {
    const { builder } = createBuilder(ok([]));

    await getPublishedPosts();

    expect(builder.eq).toHaveBeenCalledTimes(1);
    expect(builder.eq).toHaveBeenCalledWith("published", true);
    expect(builder.contains).not.toHaveBeenCalled();
    expect(builder.order).toHaveBeenCalledWith("published_at", {
      ascending: false,
    });
  });

  it("category와 tag를 함께 적용한다", async () => {
    const { builder } = createBuilder(ok([]));

    await getPublishedPosts({ category: "개발", tag: "nextjs" });

    expect(builder.eq).toHaveBeenCalledWith("published", true);
    expect(builder.eq).toHaveBeenCalledWith("category", "개발");
    expect(builder.contains).toHaveBeenCalledWith("tags", ["nextjs"]);
  });

  it("tag만 있으면 category 조건은 걸지 않는다", async () => {
    const { builder } = createBuilder(ok([]));

    await getPublishedPosts({ tag: "react" });

    expect(builder.eq).not.toHaveBeenCalledWith("category", expect.anything());
    expect(builder.contains).toHaveBeenCalledWith("tags", ["react"]);
  });

  it("data가 null이면 []를 반환한다", async () => {
    createBuilder(ok(null));

    await expect(getPublishedPosts()).resolves.toEqual([]);
  });

  it("오류면 []를 반환하고 로그를 남긴다", async () => {
    createBuilder({ data: null, error: { message: "boom" } });

    await expect(getPublishedPosts()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("클라이언트 생성이 던져도 []를 반환한다", async () => {
    createClientMock.mockImplementation(() => {
      throw new Error("no env");
    });

    await expect(getPublishedPosts()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("getPostBySlug", () => {
  it("published 조건과 slug로 maybeSingle 조회하고 content를 포함한다", async () => {
    const row = { id: "1", slug: "hello" };
    const { builder } = createBuilder(ok(row));

    await expect(getPostBySlug("hello")).resolves.toEqual(row);

    expect(builder.select.mock.calls[0][0]).toContain("content");
    expect(builder.eq).toHaveBeenCalledWith("published", true);
    expect(builder.eq).toHaveBeenCalledWith("slug", "hello");
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it("posts와 post:<slug> 태그를 붙인다", async () => {
    createBuilder(ok(null));

    await getPostBySlug("hello");

    expect(cacheTagMock).toHaveBeenCalledWith("posts", "post:hello");
  });

  it("NFD로 들어온 slug를 NFC로 바꿔 조회한다", async () => {
    const nfc = "한글-글".normalize("NFC");
    const nfd = nfc.normalize("NFD");
    expect(nfd).not.toBe(nfc);
    const { builder } = createBuilder(ok(null));

    await getPostBySlug(nfd);

    expect(builder.eq).toHaveBeenCalledWith("slug", nfc);
    expect(cacheTagMock).toHaveBeenCalledWith("posts", `post:${nfc}`);
  });

  it("없으면 null을 반환한다", async () => {
    createBuilder(ok(null));

    await expect(getPostBySlug("missing")).resolves.toBeNull();
  });

  it("오류면 null을 반환하고 로그를 남긴다", async () => {
    createBuilder({ data: null, error: { message: "boom" } });

    await expect(getPostBySlug("x-error")).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("클라이언트 생성이 던져도 null을 반환한다", async () => {
    createClientMock.mockImplementation(() => {
      throw new Error("no env");
    });

    await expect(getPostBySlug("x-throw")).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });
});
