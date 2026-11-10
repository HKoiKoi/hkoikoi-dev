import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getRefsMock = vi.hoisted(() => vi.fn());
const listMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queries/admin-posts", () => ({
  getAdminPostReferences: getRefsMock,
}));
vi.mock("@/lib/storage/storage-adapter", () => ({
  listBlogImages: listMock,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { loadOrphanCandidates } from "./load-orphan-candidates";

const URL = "https://x.supabase.co";
const NOW = new Date("2026-06-01T00:00:00Z");
const OLD = "2026-01-01T00:00:00Z";

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL);
  createClientMock.mockResolvedValue({});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  errorSpy.mockRestore();
});

describe("loadOrphanCandidates", () => {
  it("참조 중이 아닌 오래된 객체만 후보로 돌려준다", async () => {
    getRefsMock.mockResolvedValue([
      {
        content: `![](${URL}/storage/v1/object/public/blog-images/2026/01/used.png)`,
        thumbnail_url: null,
      },
    ]);
    listMock.mockResolvedValue([
      { path: "2026/01/used.png", size: 1, createdAt: OLD },
      { path: "2026/01/orphan.png", size: 2, createdAt: OLD },
    ]);

    const result = await loadOrphanCandidates(NOW);

    expect(result).toEqual({
      ok: true,
      total: 2,
      candidates: [{ path: "2026/01/orphan.png", size: 2, createdAt: OLD }],
    });
  });

  it("참조 조회가 실패하면 목록을 읽지 않고 후보 없이 오류를 돌려준다", async () => {
    getRefsMock.mockResolvedValue(null);

    const result = await loadOrphanCandidates(NOW);

    expect(result.ok).toBe(false);
    expect(listMock).not.toHaveBeenCalled();
  });

  it("Storage 목록이 실패하면 후보 없이 오류를 돌려준다", async () => {
    getRefsMock.mockResolvedValue([]);
    listMock.mockRejectedValue(new Error("denied"));

    const result = await loadOrphanCandidates(NOW);

    expect(result.ok).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("Supabase URL이 없으면 오류를 돌려준다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const result = await loadOrphanCandidates(NOW);

    expect(result.ok).toBe(false);
    expect(getRefsMock).not.toHaveBeenCalled();
  });
});
