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
  deleteResumeEntry,
  moveResumeEntry,
  saveResumeEntry,
  toggleResumeVisibility,
} from "./actions";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const ID_B = "223e4567-e89b-42d3-a456-426614174000";
const ID_C = "323e4567-e89b-42d3-a456-426614174000";
const DB_ERROR = { code: "XX000", message: "relation secret_table failed" };

function buildFormData(overrides: Record<string, string> = {}) {
  const fields: Record<string, string> = {
    section: "career",
    title: "e2e-회사",
    subtitle: "백엔드",
    period: "2024 - 현재",
    tags: "go, sql",
    tag_groups: "개발: React, Next.js",
    link: "https://example.com",
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

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

describe("saveResumeEntry", () => {
  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(
      saveResumeEntry({ ok: false }, buildFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expectNoWrite();
  });

  it("section이 허용 목록 밖이면 DB를 호출하지 않는다", async () => {
    const result = await saveResumeEntry(
      { ok: false },
      buildFormData({ section: "posts" }),
    );

    expect(result.ok).toBe(false);
    expectNoWrite();
  });

  it("검증에 실패하면 필드 오류와 입력값을 돌려주고 쓰지 않는다", async () => {
    const result = await saveResumeEntry(
      { ok: false },
      buildFormData({ title: "", link: "javascript:alert(1)" }),
    );

    expect(result.ok).toBe(false);
    expect(result.message).toBe("입력값을 확인해 주세요.");
    expect(result.fieldErrors?.title).toBeDefined();
    expect(result.fieldErrors?.link).toBeDefined();
    expect(result.values).toMatchObject({
      title: "",
      link: "javascript:alert(1)",
      subtitle: "백엔드",
    });
    expectNoWrite();
  });

  it("id가 uuid가 아니면 DB를 호출하지 않는다", async () => {
    const result = await saveResumeEntry(
      { ok: false },
      buildFormData({ id: "nope" }),
    );

    expect(result.ok).toBe(false);
    expectNoWrite();
  });

  it("새 항목은 섹션 max sort_order + 10으로 insert하고 태그를 만료한 뒤 목록으로 redirect한다", async () => {
    const { calls } = mockSupabase(createClientMock, [
      ok({ sort_order: 30 }),
      ok({ id: ID }),
    ]);

    await expect(
      saveResumeEntry({ ok: false }, buildFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/resume/career");

    expect(allOps(calls[0], "eq")).toEqual([["section", "career"]]);
    expect(findOp(calls[0], "order")).toEqual([
      "sort_order",
      { ascending: false },
    ]);
    const [payload] = findOp(calls[1], "insert") as [Record<string, unknown>];
    expect(payload).toMatchObject({
      section: "career",
      sort_order: 40,
      title: "e2e-회사",
      tags: ["go", "sql"],
      tag_groups: [{ label: "개발", tags: ["React", "Next.js"] }],
      link: "https://example.com",
      grade: null,
    });
    expect(updateTagMock).toHaveBeenCalledWith("resume");
    expect(updateTagMock).toHaveBeenCalledWith("resume:career");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/resume/career");
  });

  it("섹션이 비어 있으면 sort_order 10으로 시작한다", async () => {
    const { calls } = mockSupabase(createClientMock, [
      ok(null),
      ok({ id: ID }),
    ]);

    await expect(
      saveResumeEntry({ ok: false }, buildFormData()),
    ).rejects.toThrow("NEXT_REDIRECT");

    const [payload] = findOp(calls[1], "insert") as [Record<string, unknown>];
    expect(payload.sort_order).toBe(10);
  });

  it("수정은 id와 section으로 update하고 sort_order는 바꾸지 않는다", async () => {
    const { calls } = mockSupabase(createClientMock, [ok({ id: ID })]);

    await expect(
      saveResumeEntry({ ok: false }, buildFormData({ id: ID })),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/resume/career");

    expect(allOps(calls[0], "eq")).toEqual([
      ["id", ID],
      ["section", "career"],
    ]);
    const [payload] = findOp(calls[0], "update") as [Record<string, unknown>];
    expect(payload).not.toHaveProperty("sort_order");
    expect(payload).not.toHaveProperty("section");
    expect(updateTagMock).toHaveBeenCalledWith("resume:career");
  });

  it("update가 0행이면 성공으로 보지 않고 태그를 만료하지 않는다", async () => {
    mockSupabase(createClientMock, [ok(null)]);

    const result = await saveResumeEntry(
      { ok: false },
      buildFormData({ id: ID }),
    );

    expect(result).toEqual({ ok: false, message: "항목을 찾을 수 없습니다." });
    expect(updateTagMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("DB 오류는 일반 메시지만 돌려주고 원문을 노출하지 않으며 태그를 만료하지 않는다", async () => {
    mockSupabase(createClientMock, [ok({ sort_order: 10 }), fail]);

    const result = await saveResumeEntry({ ok: false }, buildFormData());

    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("마지막 sort_order 조회 오류도 원문을 숨긴다", async () => {
    mockSupabase(createClientMock, [fail]);

    const result = await saveResumeEntry({ ok: false }, buildFormData());

    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("예기치 못한 예외는 일반 메시지로 바꾸고, Next 내부 신호는 다시 던진다", async () => {
    createClientMock.mockRejectedValue(new Error("connection refused"));
    const result = await saveResumeEntry({ ok: false }, buildFormData());
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("connection refused");

    createClientMock.mockRejectedValue(new Error("NEXT_PRERENDER_INTERRUPTED"));
    await expect(
      saveResumeEntry({ ok: false }, buildFormData()),
    ).rejects.toThrow("NEXT_PRERENDER_INTERRUPTED");
  });
});

describe("deleteResumeEntry", () => {
  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(deleteResumeEntry(ID)).rejects.toThrow("NEXT_REDIRECT");
    expectNoWrite();
  });

  it("id가 uuid가 아니면 DB를 호출하지 않는다", async () => {
    expect((await deleteResumeEntry("nope")).ok).toBe(false);
    expectNoWrite();
  });

  it("삭제된 행의 section 태그를 만료하고 ok를 반환한다", async () => {
    const { calls } = mockSupabase(createClientMock, [
      ok([{ id: ID, section: "education" }]),
    ]);

    await expect(deleteResumeEntry(ID)).resolves.toEqual({ ok: true });

    expect(allOps(calls[0], "eq")).toEqual([["id", ID]]);
    expect(updateTagMock).toHaveBeenCalledWith("resume");
    expect(updateTagMock).toHaveBeenCalledWith("resume:education");
  });

  it("영향 행이 0이면 실패로 처리하고 태그를 만료하지 않는다", async () => {
    mockSupabase(createClientMock, [ok([])]);

    expect((await deleteResumeEntry(ID)).ok).toBe(false);
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("DB 오류 원문을 노출하지 않는다", async () => {
    mockSupabase(createClientMock, [fail]);

    const result = await deleteResumeEntry(ID);

    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });
});

describe("toggleResumeVisibility", () => {
  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(toggleResumeVisibility(ID, false)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expectNoWrite();
  });

  it("잘못된 id나 boolean이 아닌 값은 DB를 호출하지 않는다", async () => {
    expect((await toggleResumeVisibility("nope", true)).ok).toBe(false);
    expect(
      (await toggleResumeVisibility(ID, "false" as unknown as boolean)).ok,
    ).toBe(false);
    expectNoWrite();
  });

  it("is_visible만 바꾸고 해당 섹션 태그를 만료한다", async () => {
    const { calls } = mockSupabase(createClientMock, [
      ok({ id: ID, section: "career" }),
    ]);

    await expect(toggleResumeVisibility(ID, false)).resolves.toEqual({
      ok: true,
    });

    expect(findOp(calls[0], "update")).toEqual([{ is_visible: false }]);
    expect(updateTagMock).toHaveBeenCalledWith("resume");
    expect(updateTagMock).toHaveBeenCalledWith("resume:career");
  });

  it("영향 행이 0이면 실패하고 태그를 만료하지 않는다", async () => {
    mockSupabase(createClientMock, [ok(null)]);

    expect((await toggleResumeVisibility(ID, true)).ok).toBe(false);
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("DB 오류 원문을 노출하지 않는다", async () => {
    mockSupabase(createClientMock, [fail]);

    const result = await toggleResumeVisibility(ID, true);

    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });
});

describe("moveResumeEntry", () => {
  const rows = [{ id: ID }, { id: ID_B }, { id: ID_C }];

  it("requireAdmin이 거부하면 DB를 호출하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(moveResumeEntry(ID, "up")).rejects.toThrow("NEXT_REDIRECT");
    expectNoWrite();
  });

  it("잘못된 id나 방향은 DB를 호출하지 않는다", async () => {
    expect((await moveResumeEntry("nope", "up")).ok).toBe(false);
    expect((await moveResumeEntry(ID, "left" as unknown as "up")).ok).toBe(
      false,
    );
    expectNoWrite();
  });

  it("이웃과 바꾼 순서로 RPC를 한 번 호출하고 태그를 만료한다", async () => {
    const { rpc, calls } = mockSupabase(createClientMock, [
      ok({ section: "career" }),
      ok(rows),
      ok(3),
    ]);

    await expect(moveResumeEntry(ID_B, "up")).resolves.toEqual({ ok: true });

    // 목록은 관리자 화면과 같은 정렬(sort_order, id)로 읽는다.
    expect(allOps(calls[1], "order")).toEqual([
      ["sort_order", { ascending: true }],
      ["id", { ascending: true }],
    ]);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("reorder_resume_entries", {
      p_section: "career",
      p_ids: [ID_B, ID, ID_C],
    });
    expect(updateTagMock).toHaveBeenCalledWith("resume:career");
  });

  it("맨 앞의 위, 맨 뒤의 아래는 RPC 없이 성공으로 끝낸다", async () => {
    const { rpc } = mockSupabase(createClientMock, [
      ok({ section: "career" }),
      ok(rows),
    ]);

    await expect(moveResumeEntry(ID, "up")).resolves.toEqual({ ok: true });

    expect(rpc).not.toHaveBeenCalled();
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("항목이 없으면 실패하고 RPC를 호출하지 않는다", async () => {
    const { rpc } = mockSupabase(createClientMock, [ok(null)]);

    expect((await moveResumeEntry(ID, "up")).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("RPC 오류 원문을 노출하지 않고 태그를 만료하지 않는다", async () => {
    mockSupabase(createClientMock, [ok({ section: "career" }), ok(rows), fail]);

    const result = await moveResumeEntry(ID_B, "down");

    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("목록 조회 오류도 원문을 숨기고 RPC를 호출하지 않는다", async () => {
    const { rpc } = mockSupabase(createClientMock, [
      ok({ section: "career" }),
      fail,
    ]);

    const result = await moveResumeEntry(ID_B, "down");

    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret_table");
    expect(rpc).not.toHaveBeenCalled();
  });
});
