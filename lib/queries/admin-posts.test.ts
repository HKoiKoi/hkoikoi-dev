import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { getAdminPostById, getAdminPosts } from "./admin-posts";

type Result = { data: unknown; error: { message: string } | null };

// 체이닝 가능하고 await하면 result로 풀리는 가짜 쿼리 빌더
function createBuilder(result: Result) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (
      resolve: (value: Result) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  for (const key of ["select", "eq", "order"] as const) {
    builder[key].mockReturnValue(builder);
  }
  const from = vi.fn(() => builder);
  createClientMock.mockResolvedValue({ from });
  return { builder, from };
}

const ok = (data: unknown): Result => ({ data, error: null });

const VALID_ID = "0b8f4a52-6f0e-4d6a-9c1e-2f5d3a7b9c10";

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  errorSpy.mockRestore();
});

describe("getAdminPosts", () => {
  it("published 필터 없이 updated_at 내림차순으로 조회하고 content는 select하지 않는다", async () => {
    const rows = [{ id: "1" }];
    const { builder, from } = createBuilder(ok(rows));

    await expect(getAdminPosts()).resolves.toEqual(rows);

    expect(from).toHaveBeenCalledWith("posts");
    const columns = builder.select.mock.calls[0][0] as string;
    expect(columns).not.toContain("content");
    expect(builder.eq).not.toHaveBeenCalled();
    expect(builder.order).toHaveBeenCalledWith("updated_at", {
      ascending: false,
    });
  });

  it("data가 null이면 []를 반환한다", async () => {
    createBuilder(ok(null));

    await expect(getAdminPosts()).resolves.toEqual([]);
  });

  it("오류면 []를 반환하고 로그를 남긴다", async () => {
    createBuilder({ data: null, error: { message: "boom" } });

    await expect(getAdminPosts()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("createClient가 던져도 []를 반환한다", async () => {
    createClientMock.mockRejectedValue(new Error("no cookies"));

    await expect(getAdminPosts()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("getAdminPostById", () => {
  it("id로 maybeSingle 조회하고 published 조건은 걸지 않으며 content를 포함한다", async () => {
    const row = { id: VALID_ID, published: false };
    const { builder } = createBuilder(ok(row));

    await expect(getAdminPostById(VALID_ID)).resolves.toEqual(row);

    expect(builder.select.mock.calls[0][0]).toContain("content");
    expect(builder.eq).toHaveBeenCalledTimes(1);
    expect(builder.eq).toHaveBeenCalledWith("id", VALID_ID);
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it("uuid 형식이 아니면 쿼리 없이 null을 반환한다", async () => {
    await expect(getAdminPostById("not-a-uuid")).resolves.toBeNull();
    await expect(getAdminPostById("")).resolves.toBeNull();

    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("없으면 null을 반환한다", async () => {
    createBuilder(ok(null));

    await expect(getAdminPostById(VALID_ID)).resolves.toBeNull();
  });

  it("오류면 null을 반환하고 로그를 남긴다", async () => {
    createBuilder({ data: null, error: { message: "boom" } });

    await expect(getAdminPostById(VALID_ID)).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("createClient가 던져도 null을 반환한다", async () => {
    createClientMock.mockRejectedValue(new Error("no cookies"));

    await expect(getAdminPostById(VALID_ID)).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });
});
