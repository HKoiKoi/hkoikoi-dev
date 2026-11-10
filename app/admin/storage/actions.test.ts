import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.hoisted(() => vi.fn());
const getRefsMock = vi.hoisted(() => vi.fn());
const listMock = vi.hoisted(() => vi.fn());
const removeMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/queries/admin-posts", () => ({
  getAdminPostReferences: getRefsMock,
}));
vi.mock("@/lib/storage/storage-adapter", () => ({
  listBlogImages: listMock,
  removeBlogImages: removeMock,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({})),
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { deleteOrphans } from "./actions";

const URL = "https://x.supabase.co";
const uuid = (n: number) =>
  `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const p = (n: number) => `2026/01/${uuid(n)}.png`;
const OLD = "2020-01-01T00:00:00Z";
const obj = (path: string, createdAt = OLD) => ({ path, size: 1, createdAt });
const refTo = (path: string) => ({
  content: `![](${URL}/storage/v1/object/public/blog-images/${path})`,
  thumbnail_url: null,
});

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL);
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  getRefsMock.mockResolvedValue([]);
  removeMock.mockImplementation((_c: unknown, paths: string[]) =>
    Promise.resolve(paths.length),
  );
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  errorSpy.mockRestore();
});

describe("deleteOrphans", () => {
  it("비관리자는 requireAdmin에서 막혀 아무것도 하지 않는다", async () => {
    requireAdminMock.mockRejectedValueOnce(new Error("NEXT_NOT_FOUND"));

    await expect(deleteOrphans([p(1)])).rejects.toThrow();
    expect(listMock).not.toHaveBeenCalled();
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("형식 위반·빈 배열·상한 초과는 거부한다", async () => {
    for (const bad of [
      [],
      ["../etc/passwd"],
      ["2026/01/a.png"],
      Array.from({ length: 101 }, (_, i) => p(i)),
    ]) {
      const result = await deleteOrphans(bad);
      expect(result.ok).toBe(false);
    }
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("고아 경로를 삭제하고 revalidatePath를 호출한다", async () => {
    listMock.mockResolvedValue([obj(p(1)), obj(p(2))]);

    const result = await deleteOrphans([p(1), p(2)]);

    expect(removeMock).toHaveBeenCalledWith({}, [p(1), p(2)]);
    expect(result).toMatchObject({ ok: true, deleted: 2, failed: 0 });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/storage");
  });

  it("참조 중인 경로는 건너뛴다", async () => {
    listMock.mockResolvedValue([obj(p(1)), obj(p(2))]);
    getRefsMock.mockResolvedValue([refTo(p(1))]);

    const result = await deleteOrphans([p(1), p(2)]);

    expect(removeMock).toHaveBeenCalledWith({}, [p(2)]);
    expect(result).toMatchObject({ deleted: 1, skippedReferenced: 1 });
  });

  it("유예 기간 이내 경로는 건너뛰고, 버킷에 없는 경로는 삭제하지 않는다", async () => {
    listMock.mockResolvedValue([obj(p(1), new Date().toISOString())]);

    const result = await deleteOrphans([p(1), p(2)]);

    expect(removeMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      deleted: 0,
      skippedGrace: 1,
      skippedMissing: 1,
    });
  });

  it("삭제 직전 재검사: 그 사이 글에 삽입된 이미지는 지우지 않는다", async () => {
    listMock.mockResolvedValue([obj(p(1))]);
    getRefsMock.mockResolvedValueOnce([]).mockResolvedValueOnce([refTo(p(1))]);

    // 첫 확인 시점에는 고아였지만, 두 번째 호출 시점에는 글이 참조한다.
    await deleteOrphans([p(1)]);
    removeMock.mockClear();
    const result = await deleteOrphans([p(1)]);

    expect(removeMock).not.toHaveBeenCalled();
    expect(result.skippedReferenced).toBe(1);
  });

  it("참조 조회가 실패하면 아무것도 삭제하지 않는다", async () => {
    getRefsMock.mockResolvedValue(null);

    const result = await deleteOrphans([p(1)]);

    expect(result.ok).toBe(false);
    expect(listMock).not.toHaveBeenCalled();
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("목록 조회가 실패하면 아무것도 삭제하지 않는다", async () => {
    listMock.mockRejectedValue(new Error("denied"));

    const result = await deleteOrphans([p(1)]);

    expect(result.ok).toBe(false);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("remove가 일부만 지우면 실패 수를 요약한다", async () => {
    listMock.mockResolvedValue([obj(p(1)), obj(p(2))]);
    removeMock.mockResolvedValue(1);

    const result = await deleteOrphans([p(1), p(2)]);

    expect(result).toMatchObject({ ok: false, deleted: 1, failed: 1 });
  });

  it("remove가 던지면 전부 실패로 센다", async () => {
    listMock.mockResolvedValue([obj(p(1))]);
    removeMock.mockRejectedValue(new Error("boom"));

    const result = await deleteOrphans([p(1)]);

    expect(result).toMatchObject({ ok: false, deleted: 0, failed: 1 });
  });
});
