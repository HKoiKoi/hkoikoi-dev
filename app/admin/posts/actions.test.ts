import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { deletePost, savePost } from "./actions";

const POST_ID = "123e4567-e89b-42d3-a456-426614174000";
const EXISTING_PUBLISHED_AT = "2026-01-01T00:00:00.000Z";

type DbResult = {
  data?: unknown;
  error?: { code?: string; message: string } | null;
};

function buildFormData(overrides: Record<string, string> = {}) {
  const fields: Record<string, string> = {
    title: "테스트 글",
    slug: "test-post",
    category: "개발",
    tags: "nextjs, supabase",
    excerpt: "소개글",
    content: "본문",
    published: "on",
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

/** posts 테이블 쿼리 체인을 흉내 낸다. 각 단계의 결과만 주입한다. */
function mockPostsTable(results: {
  existing?: DbResult;
  update?: DbResult;
  insert?: DbResult;
  delete?: DbResult;
}) {
  const insert = vi.fn(() => ({
    select: () => ({
      single: () =>
        Promise.resolve(
          results.insert ?? { data: { id: POST_ID }, error: null },
        ),
    }),
  }));
  const update = vi.fn(() => ({
    eq: () => ({
      select: () => ({
        maybeSingle: () =>
          Promise.resolve(
            results.update ?? { data: { id: POST_ID }, error: null },
          ),
      }),
    }),
  }));
  const deleteRows = vi.fn(() => ({
    eq: () => ({
      select: () =>
        Promise.resolve(
          results.delete ?? {
            data: [{ id: POST_ID, slug: "deleted-post" }],
            error: null,
          },
        ),
    }),
  }));
  const select = vi.fn(() => ({
    eq: () => ({
      maybeSingle: () =>
        Promise.resolve(
          results.existing ?? {
            data: { published_at: EXISTING_PUBLISHED_AT, slug: "old-slug" },
            error: null,
          },
        ),
    }),
  }));

  const from = vi.fn(() => ({ select, update, insert, delete: deleteRows }));
  createClientMock.mockResolvedValue({ from });
  return { from, select, update, insert, deleteRows };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({
    sub: "admin-1",
    app_metadata: { role: "admin" },
  });
  // 실제 redirect처럼 예외를 던져 이후 코드가 실행되지 않게 한다.
  redirectMock.mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("savePost", () => {
  it("requireAdmin이 거부하면 이후 로직을 실행하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(savePost({ ok: false }, buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/auth/login",
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("입력이 스키마에 맞지 않으면 필드별 오류를 반환하고 DB를 호출하지 않는다", async () => {
    const result = await savePost({ ok: false }, buildFormData({ title: "" }));

    expect(result.ok).toBe(false);
    expect(result.message).toBe("입력값을 확인해 주세요.");
    expect(result.fieldErrors?.title).toEqual(["제목을 입력해 주세요."]);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("id가 uuid가 아니면 수정할 글을 찾을 수 없다고 응답한다", async () => {
    const result = await savePost(
      { ok: false },
      buildFormData({ id: "not-a-uuid" }),
    );

    expect(result).toEqual({
      ok: false,
      message: "수정할 글을 찾을 수 없습니다.",
    });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("수정 대상이 없으면 NOT_FOUND 메시지를 반환한다", async () => {
    const { update } = mockPostsTable({
      existing: { data: null, error: null },
    });

    const result = await savePost(
      { ok: false },
      buildFormData({ id: POST_ID }),
    );

    expect(result).toEqual({
      ok: false,
      message: "수정할 글을 찾을 수 없습니다.",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("update가 0행에 영향을 주면 성공으로 보지 않는다", async () => {
    mockPostsTable({ update: { data: null, error: null } });

    const result = await savePost(
      { ok: false },
      buildFormData({ id: POST_ID }),
    );

    expect(result.ok).toBe(false);
    expect(result.message).toBe("수정할 글을 찾을 수 없습니다.");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("슬러그가 중복(23505)이면 slug 필드 오류를 반환한다", async () => {
    mockPostsTable({
      insert: { error: { code: "23505", message: "duplicate key value" } },
    });

    const result = await savePost({ ok: false }, buildFormData());

    expect(result).toEqual({
      ok: false,
      message: "입력값을 확인해 주세요.",
      fieldErrors: { slug: ["이미 사용 중인 슬러그입니다"] },
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("그 밖의 DB 오류는 일반 메시지만 반환하고 원문을 노출하지 않는다", async () => {
    mockPostsTable({
      insert: { error: { code: "XX000", message: "secret internal detail" } },
    });

    const result = await savePost({ ok: false }, buildFormData());

    expect(result).toEqual({
      ok: false,
      message: "글을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    });
    expect(JSON.stringify(result)).not.toContain("secret internal detail");
  });

  it("예기치 못한 예외는 일반 메시지로 바꾸고, Next 내부 신호는 다시 던진다", async () => {
    createClientMock.mockRejectedValueOnce(new Error("boom"));

    await expect(
      savePost({ ok: false }, buildFormData()),
    ).resolves.toMatchObject({
      ok: false,
      message: "글을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    });

    createClientMock.mockRejectedValueOnce(new Error("NEXT_PRERENDER_SIGNAL"));

    await expect(savePost({ ok: false }, buildFormData())).rejects.toThrow(
      "NEXT_PRERENDER_SIGNAL",
    );
  });

  it("신규 발행 글은 published_at을 채워 insert하고 목록으로 redirect한다", async () => {
    const { insert } = mockPostsTable({});

    await expect(savePost({ ok: false }, buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/admin/posts",
    );

    expect(insert).toHaveBeenCalledTimes(1);
    const payload = (insert.mock.calls[0] as unknown[])[0] as {
      slug: string;
      published: boolean;
      published_at: string | null;
    };
    expect(payload.slug).toBe("test-post");
    expect(payload.published).toBe(true);
    expect(payload.published_at).toEqual(expect.any(String));
    expect(updateTagMock).toHaveBeenCalledWith("posts");
    expect(updateTagMock).toHaveBeenCalledWith("post:test-post");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/posts");
  });

  it("신규 초안은 published_at을 null로 insert한다", async () => {
    const { insert } = mockPostsTable({});
    const formData = buildFormData();
    formData.delete("published");

    // 임시 저장은 목록이 아니라 방금 만든 글의 수정 화면으로 이동한다.
    await expect(savePost({ ok: false }, formData)).rejects.toThrow(
      `NEXT_REDIRECT:/admin/posts/${POST_ID}/edit`,
    );

    const payload = (insert.mock.calls[0] as unknown[])[0] as {
      published_at: string | null;
    };
    expect(payload.published_at).toBeNull();
  });

  it("수정하면 기존 published_at을 유지하고, 초안으로 바꿔도 지우지 않는다", async () => {
    const { update } = mockPostsTable({});
    const formData = buildFormData({ id: POST_ID });
    formData.delete("published");

    // 수정 화면의 임시 저장은 redirect 없이 ok 상태를 반환한다.
    await expect(savePost({ ok: false }, formData)).resolves.toEqual({
      ok: true,
      message: "임시 저장했습니다.",
    });

    expect(update).toHaveBeenCalledTimes(1);
    const payload = (update.mock.calls[0] as unknown[])[0] as {
      published: boolean;
      published_at: string | null;
    };
    expect(payload.published).toBe(false);
    expect(payload.published_at).toBe(EXISTING_PUBLISHED_AT);
    // 초안 전환도 목록과 상세 캐시를 비워 공개 글이 즉시 사라진다.
    expect(updateTagMock).toHaveBeenCalledWith("posts");
    expect(updateTagMock).toHaveBeenCalledWith("post:test-post");
  });

  it("슬러그를 바꾸면 이전·새 슬러그 태그를 모두 무효화한다", async () => {
    mockPostsTable({});

    await expect(
      savePost({ ok: false }, buildFormData({ id: POST_ID })),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/posts");

    expect(updateTagMock).toHaveBeenCalledWith("posts");
    expect(updateTagMock).toHaveBeenCalledWith("post:old-slug");
    expect(updateTagMock).toHaveBeenCalledWith("post:test-post");
  });

  it("저장에 실패하면 태그를 무효화하지 않는다", async () => {
    mockPostsTable({
      update: { data: null, error: { code: "XX000", message: "boom" } },
    });

    await savePost({ ok: false }, buildFormData({ id: POST_ID }));

    expect(updateTagMock).not.toHaveBeenCalled();
  });
});

describe("deletePost", () => {
  it("requireAdmin이 거부하면 이후 로직을 실행하지 않는다", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/auth/login"));

    await expect(deletePost(POST_ID)).rejects.toThrow(
      "NEXT_REDIRECT:/auth/login",
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("id가 uuid가 아니면 DB를 호출하지 않고 오류를 반환한다", async () => {
    const result = await deletePost("not-a-uuid");

    expect(result).toEqual({ ok: false, message: "잘못된 글 식별자입니다." });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("삭제에 성공하면 삭제된 글의 태그를 무효화하고 ok를 반환한다", async () => {
    mockPostsTable({});

    await expect(deletePost(POST_ID)).resolves.toEqual({ ok: true });
    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(updateTagMock).toHaveBeenCalledWith("posts");
    expect(updateTagMock).toHaveBeenCalledWith("post:deleted-post");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/posts");
  });

  it("DB 오류면 삭제 실패 메시지를 반환한다", async () => {
    mockPostsTable({
      delete: { data: null, error: { code: "XX000", message: "db detail" } },
    });

    const result = await deletePost(POST_ID);

    expect(result).toEqual({
      ok: false,
      message: "글을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("영향 행이 0이면(RLS 거부·이미 삭제) 실패로 처리한다", async () => {
    mockPostsTable({ delete: { data: [], error: null } });

    const result = await deletePost(POST_ID);

    expect(result.ok).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(updateTagMock).not.toHaveBeenCalled();
  });
});
