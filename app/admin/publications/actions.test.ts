import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  allOps,
  findOp,
  mockSupabase,
  type DbResult,
} from "@/lib/admin/mock-supabase";

const requireAdminMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const updateTagMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  updateTag: updateTagMock,
}));
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  // Next 내부 신호(NEXT_로 시작)만 다시 던지고 나머지는 삼키는 실제 동작을 흉내 낸다.
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message.startsWith("NEXT_")) {
      throw error;
    }
  },
}));

import {
  deletePublication,
  savePublication,
  togglePublicationVisibility,
} from "./actions";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const DB_ERROR = { code: "XX000", message: "relation secret_table failed" };
const ok = (data: unknown): DbResult => ({ data, error: null });
const fail: DbResult = { data: null, error: DB_ERROR };

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ app_metadata: { role: "admin" } });
  redirectMock.mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function expectNoWrite() {
  expect(createClientMock).not.toHaveBeenCalled();
  expect(updateTagMock).not.toHaveBeenCalled();
}

function buildFormData(overrides: Record<string, string> = {}) {
  const fields: Record<string, string> = {
    title: "e2e-논문",
    authors: "홍길동",
    venue: "KSII",
    year: "2024",
    link: "https://doi.org/10.1/x",
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("savePublication", () => {
  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(
      savePublication({ ok: false }, buildFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expectNoWrite();
  });

  it("검증에 실패하면 필드 오류와 입력값을 돌려주고 쓰지 않는다", async () => {
    const result = await savePublication(
      { ok: false },
      buildFormData({ title: "", year: "20a4", link: "javascript:alert(1)" }),
    );

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.title).toBeDefined();
    expect(result.fieldErrors?.year).toBeDefined();
    expect(result.fieldErrors?.link).toBeDefined();
    expect(result.values).toMatchObject({ title: "", year: "20a4" });
    expectNoWrite();
  });

  it("id가 uuid가 아니면 DB를 호출하지 않는다", async () => {
    expect(
      (await savePublication({ ok: false }, buildFormData({ id: "nope" }))).ok,
    ).toBe(false);
    expectNoWrite();
  });

  it("새 논문은 max sort_order + 10으로 insert하고 publications 태그를 만료한 뒤 redirect한다", async () => {
    const { calls } = mockSupabase(createClientMock, [
      ok({ sort_order: 30 }),
      ok({ id: ID }),
    ]);

    await expect(
      savePublication({ ok: false }, buildFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/publications");

    const [payload] = findOp(calls[1], "insert") as [Record<string, unknown>];
    expect(payload).toMatchObject({
      title: "e2e-논문",
      year: 2024,
      link: "https://doi.org/10.1/x",
      sort_order: 40,
    });
    expect(updateTagMock).toHaveBeenCalledWith("publications");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/publications");
  });

  it("수정은 id로 update하고 sort_order는 바꾸지 않는다", async () => {
    const { calls } = mockSupabase(createClientMock, [ok({ id: ID })]);

    await expect(
      savePublication({ ok: false }, buildFormData({ id: ID })),
    ).rejects.toThrow("NEXT_REDIRECT");

    const [payload] = findOp(calls[0], "update") as [Record<string, unknown>];
    expect(payload).not.toHaveProperty("sort_order");
    expect(allOps(calls[0], "eq")).toEqual([["id", ID]]);
  });

  it("update가 0행이면 성공으로 보지 않고 태그를 만료하지 않는다", async () => {
    mockSupabase(createClientMock, [ok(null)]);

    const result = await savePublication(
      { ok: false },
      buildFormData({ id: ID }),
    );

    expect(result.ok).toBe(false);
    expect(updateTagMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("DB 오류 원문을 노출하지 않고 태그를 만료하지 않는다", async () => {
    mockSupabase(createClientMock, [ok({ sort_order: 10 }), fail]);

    const result = await savePublication({ ok: false }, buildFormData());

    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("예외는 일반 메시지로 바꾸고, Next 내부 신호는 다시 던진다", async () => {
    createClientMock.mockRejectedValue(new Error("connection refused"));
    const result = await savePublication({ ok: false }, buildFormData());
    expect(JSON.stringify(result)).not.toContain("connection refused");

    createClientMock.mockRejectedValue(new Error("NEXT_PRERENDER_INTERRUPTED"));
    await expect(
      savePublication({ ok: false }, buildFormData()),
    ).rejects.toThrow("NEXT_PRERENDER_INTERRUPTED");
  });
});

describe("deletePublication", () => {
  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(deletePublication(ID)).rejects.toThrow("NEXT_REDIRECT");
    expectNoWrite();
  });

  it("id가 uuid가 아니면 DB를 호출하지 않는다", async () => {
    expect((await deletePublication("nope")).ok).toBe(false);
    expectNoWrite();
  });

  it("삭제하면 publications 태그를 만료한다", async () => {
    mockSupabase(createClientMock, [ok([{ id: ID }])]);

    await expect(deletePublication(ID)).resolves.toEqual({ ok: true });
    expect(updateTagMock).toHaveBeenCalledWith("publications");
  });

  it("영향 행이 0이면 실패하고, DB 오류 원문은 숨긴다", async () => {
    mockSupabase(createClientMock, [ok([])]);
    expect((await deletePublication(ID)).ok).toBe(false);
    expect(updateTagMock).not.toHaveBeenCalled();

    mockSupabase(createClientMock, [fail]);
    const result = await deletePublication(ID);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });
});

describe("togglePublicationVisibility", () => {
  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(togglePublicationVisibility(ID, true)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expectNoWrite();
  });

  it("잘못된 id나 boolean이 아닌 값은 DB를 호출하지 않는다", async () => {
    expect((await togglePublicationVisibility("nope", true)).ok).toBe(false);
    expect(
      (await togglePublicationVisibility(ID, "true" as unknown as boolean)).ok,
    ).toBe(false);
    expectNoWrite();
  });

  it("is_visible만 바꾸고 publications 태그를 만료한다", async () => {
    const { calls } = mockSupabase(createClientMock, [ok({ id: ID })]);

    await expect(togglePublicationVisibility(ID, false)).resolves.toEqual({
      ok: true,
    });
    expect(findOp(calls[0], "update")).toEqual([{ is_visible: false }]);
    expect(updateTagMock).toHaveBeenCalledWith("publications");
  });

  it("영향 행이 0이면 실패하고, DB 오류 원문은 숨긴다", async () => {
    mockSupabase(createClientMock, [ok(null)]);
    expect((await togglePublicationVisibility(ID, true)).ok).toBe(false);

    mockSupabase(createClientMock, [fail]);
    const result = await togglePublicationVisibility(ID, true);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });
});
