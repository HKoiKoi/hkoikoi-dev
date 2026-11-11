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
  deleteProject,
  moveProject,
  saveProject,
  toggleProjectVisibility,
} from "./actions";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const ID_B = "223e4567-e89b-42d3-a456-426614174000";
const ID_C = "323e4567-e89b-42d3-a456-426614174000";
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
    name: "e2e-프로젝트",
    summary: "소개",
    period: "2024",
    role: "개발",
    stack: "Next.js, Supabase",
    github_url: "https://github.com/a/b",
    demo_url: "",
    featured: "on",
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("saveProject", () => {
  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(saveProject({ ok: false }, buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/auth/login",
    );
    expectNoWrite();
  });

  it("검증에 실패하면 필드 오류와 입력값을 돌려주고 쓰지 않는다", async () => {
    const result = await saveProject(
      { ok: false },
      buildFormData({ name: "", demo_url: "javascript:alert(1)" }),
    );

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.name).toBeDefined();
    expect(result.fieldErrors?.demo_url).toBeDefined();
    expect(result.values).toMatchObject({
      name: "",
      demo_url: "javascript:alert(1)",
      featured: "on",
    });
    expectNoWrite();
  });

  it("id가 uuid가 아니면 DB를 호출하지 않는다", async () => {
    expect(
      (await saveProject({ ok: false }, buildFormData({ id: "nope" }))).ok,
    ).toBe(false);
    expectNoWrite();
  });

  it("새 프로젝트는 max sort_order + 10으로 insert하고 projects 태그를 만료한 뒤 redirect한다", async () => {
    const { calls } = mockSupabase(createClientMock, [
      ok({ sort_order: 40 }),
      ok({ id: ID }),
    ]);

    await expect(saveProject({ ok: false }, buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/admin/projects",
    );

    const [payload] = findOp(calls[1], "insert") as [Record<string, unknown>];
    expect(payload).toMatchObject({
      name: "e2e-프로젝트",
      stack: ["Next.js", "Supabase"],
      featured: true,
      github_url: "https://github.com/a/b",
      demo_url: null,
      sort_order: 50,
    });
    expect(updateTagMock).toHaveBeenCalledWith("projects");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/projects");
  });

  it("체크박스를 해제하면 featured가 false로 저장된다", async () => {
    const formData = buildFormData({ id: ID });
    formData.delete("featured");
    const { calls } = mockSupabase(createClientMock, [ok({ id: ID })]);

    await expect(saveProject({ ok: false }, formData)).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    const [payload] = findOp(calls[0], "update") as [Record<string, unknown>];
    expect(payload.featured).toBe(false);
    expect(payload).not.toHaveProperty("sort_order");
    expect(allOps(calls[0], "eq")).toEqual([["id", ID]]);
  });

  it("update가 0행이면 성공으로 보지 않고 태그를 만료하지 않는다", async () => {
    mockSupabase(createClientMock, [ok(null)]);

    const result = await saveProject({ ok: false }, buildFormData({ id: ID }));

    expect(result.ok).toBe(false);
    expect(updateTagMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("DB 오류 원문을 노출하지 않고 태그를 만료하지 않는다", async () => {
    mockSupabase(createClientMock, [ok({ sort_order: 10 }), fail]);

    const result = await saveProject({ ok: false }, buildFormData());

    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("예외는 일반 메시지로 바꾸고, Next 내부 신호는 다시 던진다", async () => {
    createClientMock.mockRejectedValue(new Error("connection refused"));
    const result = await saveProject({ ok: false }, buildFormData());
    expect(JSON.stringify(result)).not.toContain("connection refused");

    createClientMock.mockRejectedValue(new Error("NEXT_PRERENDER_INTERRUPTED"));
    await expect(saveProject({ ok: false }, buildFormData())).rejects.toThrow(
      "NEXT_PRERENDER_INTERRUPTED",
    );
  });
});

describe("deleteProject", () => {
  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(deleteProject(ID)).rejects.toThrow("NEXT_REDIRECT");
    expectNoWrite();
  });

  it("id가 uuid가 아니면 DB를 호출하지 않는다", async () => {
    expect((await deleteProject("nope")).ok).toBe(false);
    expectNoWrite();
  });

  it("삭제하면 projects 태그를 만료한다", async () => {
    mockSupabase(createClientMock, [ok([{ id: ID }])]);

    await expect(deleteProject(ID)).resolves.toEqual({ ok: true });
    expect(updateTagMock).toHaveBeenCalledWith("projects");
  });

  it("영향 행이 0이면 실패하고, DB 오류 원문은 숨긴다", async () => {
    mockSupabase(createClientMock, [ok([])]);
    expect((await deleteProject(ID)).ok).toBe(false);
    expect(updateTagMock).not.toHaveBeenCalled();

    mockSupabase(createClientMock, [fail]);
    const result = await deleteProject(ID);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });
});

describe("toggleProjectVisibility", () => {
  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(toggleProjectVisibility(ID, true)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expectNoWrite();
  });

  it("잘못된 id나 boolean이 아닌 값은 DB를 호출하지 않는다", async () => {
    expect((await toggleProjectVisibility("nope", true)).ok).toBe(false);
    expect(
      (await toggleProjectVisibility(ID, 1 as unknown as boolean)).ok,
    ).toBe(false);
    expectNoWrite();
  });

  it("is_visible만 바꾸고 projects 태그를 만료한다", async () => {
    const { calls } = mockSupabase(createClientMock, [ok({ id: ID })]);

    await expect(toggleProjectVisibility(ID, false)).resolves.toEqual({
      ok: true,
    });
    expect(findOp(calls[0], "update")).toEqual([{ is_visible: false }]);
    expect(updateTagMock).toHaveBeenCalledWith("projects");
  });

  it("영향 행이 0이면 실패하고, DB 오류 원문은 숨긴다", async () => {
    mockSupabase(createClientMock, [ok(null)]);
    expect((await toggleProjectVisibility(ID, true)).ok).toBe(false);

    mockSupabase(createClientMock, [fail]);
    const result = await toggleProjectVisibility(ID, true);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });
});

describe("moveProject", () => {
  const rows = [{ id: ID }, { id: ID_B }, { id: ID_C }];

  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(moveProject(ID, "up")).rejects.toThrow("NEXT_REDIRECT");
    expectNoWrite();
  });

  it("잘못된 id나 방향은 DB를 호출하지 않는다", async () => {
    expect((await moveProject("nope", "up")).ok).toBe(false);
    expect((await moveProject(ID, "left" as unknown as "up")).ok).toBe(false);
    expectNoWrite();
  });

  it("이웃과 바꾼 순서로 RPC를 한 번 호출하고 태그를 만료한다", async () => {
    const { rpc, calls } = mockSupabase(createClientMock, [ok(rows), ok(3)]);

    await expect(moveProject(ID_C, "up")).resolves.toEqual({ ok: true });

    expect(allOps(calls[0], "order")).toEqual([
      ["sort_order", { ascending: true }],
      ["id", { ascending: true }],
    ]);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("reorder_projects", {
      p_ids: [ID, ID_C, ID_B],
    });
    expect(updateTagMock).toHaveBeenCalledWith("projects");
  });

  it("맨 앞의 위는 RPC 없이 성공으로 끝낸다", async () => {
    const { rpc } = mockSupabase(createClientMock, [ok(rows)]);

    await expect(moveProject(ID, "up")).resolves.toEqual({ ok: true });
    expect(rpc).not.toHaveBeenCalled();
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("목록에 없는 id는 실패한다", async () => {
    const { rpc } = mockSupabase(createClientMock, [ok([{ id: ID_B }])]);

    expect((await moveProject(ID, "down")).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("RPC·목록 조회 오류 원문을 노출하지 않고 태그를 만료하지 않는다", async () => {
    mockSupabase(createClientMock, [ok(rows), fail]);
    const rpcFailed = await moveProject(ID, "down");
    expect(JSON.stringify(rpcFailed)).not.toContain("secret_table");

    mockSupabase(createClientMock, [fail]);
    const listFailed = await moveProject(ID, "down");
    expect(JSON.stringify(listFailed)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });
});
