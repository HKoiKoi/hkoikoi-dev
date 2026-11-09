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

import {
  getAdjacentPosts,
  getLatestPosts,
  getPostBySlug,
  getPublishedPosts,
} from "./posts";

type Result = { data: unknown; error: { message: string } | null };

// 체이닝 가능하고 await하면 result로 풀리는 가짜 쿼리 빌더
function newBuilder(result: Result) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    gt: vi.fn(),
    lt: vi.fn(),
    contains: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (
      resolve: (value: Result) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  for (const key of [
    "select",
    "eq",
    "or",
    "gt",
    "lt",
    "contains",
    "order",
    "limit",
  ] as const) {
    builder[key].mockReturnValue(builder);
  }
  return builder;
}

function createBuilder(result: Result) {
  const builder = newBuilder(result);
  const from = vi.fn(() => builder);
  createClientMock.mockReturnValue({ from });
  return { builder, from };
}

// 인접 글 조회는 from()을 두 번(이전·다음 순서) 호출하므로 빌더를 따로 돌려준다.
function createAdjacentBuilders(older: Result, newer: Result) {
  const olderBuilder = newBuilder(older);
  const newerBuilder = newBuilder(newer);
  const from = vi
    .fn()
    .mockReturnValueOnce(olderBuilder)
    .mockReturnValueOnce(newerBuilder);
  createClientMock.mockReturnValue({ from });
  return { olderBuilder, newerBuilder, from };
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
    expect(builder.order).toHaveBeenNthCalledWith(1, "published_at", {
      ascending: false,
    });
    expect(builder.order).toHaveBeenNthCalledWith(2, "id", {
      ascending: false,
    });
    expect(builder.limit).toHaveBeenCalledWith(3);
  });

  it("오류 결과는 수명을 0으로 줄여 캐시에 저장되지 않게 한다", async () => {
    createBuilder({ data: null, error: { message: "boom" } });

    await getLatestPosts(3);

    expect(cacheLifeMock).toHaveBeenCalledWith({
      stale: 0,
      revalidate: 0,
      expire: 0,
    });
  });

  it("성공하면 수명을 줄이지 않는다", async () => {
    createBuilder(ok([]));

    await getLatestPosts(3);

    expect(cacheLifeMock).toHaveBeenCalledTimes(1);
    expect(cacheLifeMock).toHaveBeenCalledWith("max");
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
    expect(builder.order).toHaveBeenNthCalledWith(1, "published_at", {
      ascending: false,
    });
    expect(builder.order).toHaveBeenNthCalledWith(2, "id", {
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

describe("getAdjacentPosts", () => {
  const publishedAt = "2026-11-09T02:30:35.377+00:00";
  const id = "fb6ba941-a4ba-424c-84ac-7bd84abbdcf2";
  const olderRow = { slug: "old", title: "오래된 글" };
  const newerRow = { slug: "new", title: "최근 글" };

  it("이전은 더 오래된 글, 다음은 더 최근 글로 매핑한다", async () => {
    createAdjacentBuilders(ok([olderRow]), ok([newerRow]));

    await expect(getAdjacentPosts(publishedAt, id)).resolves.toEqual({
      prev: olderRow,
      next: newerRow,
    });
  });

  it("한쪽 결과가 비어 있으면 그쪽만 null이다", async () => {
    createAdjacentBuilders(ok([]), ok([newerRow]));

    await expect(getAdjacentPosts(publishedAt, id)).resolves.toEqual({
      prev: null,
      next: newerRow,
    });
  });

  it("published 조건·slug,title 컬럼·limit(1)로 조회한다", async () => {
    const { olderBuilder, newerBuilder, from } = createAdjacentBuilders(
      ok([]),
      ok([]),
    );

    await getAdjacentPosts(publishedAt, id);

    expect(from).toHaveBeenCalledTimes(2);
    for (const builder of [olderBuilder, newerBuilder]) {
      expect(builder.eq).toHaveBeenCalledWith("published", true);
      const columns = builder.select.mock.calls[0][0] as string;
      expect(columns).toBe("slug, title");
      expect(columns).not.toContain("content");
      expect(builder.limit).toHaveBeenCalledWith(1);
    }
  });

  it("이전은 lt 조건과 내림차순, 다음은 gt 조건과 오름차순이며 동률은 id로 가른다", async () => {
    const { olderBuilder, newerBuilder } = createAdjacentBuilders(
      ok([]),
      ok([]),
    );

    await getAdjacentPosts(publishedAt, id);

    expect(olderBuilder.or).toHaveBeenCalledWith(
      `published_at.lt.${publishedAt},and(published_at.eq.${publishedAt},id.lt.${id})`,
    );
    expect(olderBuilder.order).toHaveBeenNthCalledWith(1, "published_at", {
      ascending: false,
    });
    expect(olderBuilder.order).toHaveBeenNthCalledWith(2, "id", {
      ascending: false,
    });
    expect(newerBuilder.or).toHaveBeenCalledWith(
      `published_at.gt.${publishedAt},and(published_at.eq.${publishedAt},id.gt.${id})`,
    );
    expect(newerBuilder.order).toHaveBeenNthCalledWith(1, "published_at", {
      ascending: true,
    });
    expect(newerBuilder.order).toHaveBeenNthCalledWith(2, "id", {
      ascending: true,
    });
  });

  it("posts 태그와 max 수명을 붙인다", async () => {
    createAdjacentBuilders(ok([]), ok([]));

    await getAdjacentPosts(publishedAt, id);

    expect(cacheTagMock).toHaveBeenCalledWith("posts");
    expect(cacheLifeMock).toHaveBeenCalledTimes(1);
    expect(cacheLifeMock).toHaveBeenCalledWith("max");
  });

  it("이전·다음 중 하나라도 오류면 수명을 0으로 줄이고 빈 값을 반환한다", async () => {
    createAdjacentBuilders(ok([olderRow]), {
      data: null,
      error: { message: "boom" },
    });

    await expect(getAdjacentPosts(publishedAt, id)).resolves.toEqual({
      prev: null,
      next: null,
    });
    expect(cacheLifeMock).toHaveBeenCalledWith({
      stale: 0,
      revalidate: 0,
      expire: 0,
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("클라이언트 생성이 던져도 빈 값을 반환한다", async () => {
    createClientMock.mockImplementation(() => {
      throw new Error("no env");
    });

    await expect(getAdjacentPosts(publishedAt, id)).resolves.toEqual({
      prev: null,
      next: null,
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("publishedAt이 null이면 조회하지 않고 빈 값을 반환한다", async () => {
    const { from } = createBuilder(ok([]));

    await expect(getAdjacentPosts(null, id)).resolves.toEqual({
      prev: null,
      next: null,
    });
    expect(from).not.toHaveBeenCalled();
  });
});
