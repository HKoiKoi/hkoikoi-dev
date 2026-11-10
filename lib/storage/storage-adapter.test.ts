import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { listBlogImages, removeBlogImages } from "./storage-adapter";

type Item = {
  name: string;
  id: string | null;
  created_at?: string | null;
  metadata?: { size?: number } | null;
};
type ListResult = {
  data: Item[] | null;
  error: { message: string } | null;
};

const folder = (name: string): Item => ({ name, id: null });
const file = (name: string, size = 10): Item => ({
  name,
  id: `id-${name}`,
  created_at: "2026-01-01T00:00:00Z",
  metadata: { size },
});

// prefix·offset별 응답을 돌려주는 가짜 클라이언트
function createClient(
  pages: Record<string, ListResult>,
  remove?: ReturnType<typeof vi.fn>,
) {
  const list = vi.fn((prefix: string, opts: { offset: number }) =>
    Promise.resolve(
      pages[`${prefix}|${opts.offset}`] ?? { data: [], error: null },
    ),
  );
  const client = {
    storage: { from: vi.fn(() => ({ list, remove })) },
  } as unknown as SupabaseClient<Database>;
  return { client, list };
}

describe("listBlogImages", () => {
  it("연/월 폴더를 순회해 파일만 모으고 size·createdAt을 채운다", async () => {
    const { client } = createClient({
      "|0": { data: [folder("2026")], error: null },
      "2026|0": { data: [folder("01")], error: null },
      "2026/01|0": { data: [file("a.png", 5)], error: null },
    });

    await expect(listBlogImages(client)).resolves.toEqual([
      { path: "2026/01/a.png", size: 5, createdAt: "2026-01-01T00:00:00Z" },
    ]);
  });

  it("한 페이지가 가득 차면 offset을 올려 다음 페이지를 읽는다", async () => {
    const full = Array.from({ length: 100 }, (_, i) => file(`f${i}.png`));
    const { client, list } = createClient({
      "|0": { data: [folder("2026")], error: null },
      "2026|0": { data: [folder("01")], error: null },
      "2026/01|0": { data: full, error: null },
      "2026/01|100": { data: [file("last.png")], error: null },
    });

    const result = await listBlogImages(client);

    expect(result).toHaveLength(101);
    expect(list).toHaveBeenCalledWith("2026/01", { limit: 100, offset: 100 });
  });

  it("list 오류는 빈 결과로 삼키지 않고 던진다", async () => {
    const { client } = createClient({
      "|0": { data: null, error: { message: "denied" } },
    });

    await expect(listBlogImages(client)).rejects.toThrow("denied");
  });
});

describe("removeBlogImages", () => {
  it("빈 배열이면 호출 없이 0을 돌려준다", async () => {
    const remove = vi.fn();
    const { client } = createClient({}, remove);

    await expect(removeBlogImages(client, [])).resolves.toBe(0);
    expect(remove).not.toHaveBeenCalled();
  });

  it("remove 결과 길이를 삭제 수로 돌려준다", async () => {
    const remove = vi.fn(() =>
      Promise.resolve({ data: [{ name: "a" }], error: null }),
    );
    const { client } = createClient({}, remove);

    await expect(removeBlogImages(client, ["a", "b"])).resolves.toBe(1);
    expect(remove).toHaveBeenCalledWith(["a", "b"]);
  });

  it("remove 오류는 던진다", async () => {
    const remove = vi.fn(() =>
      Promise.resolve({ data: null, error: { message: "boom" } }),
    );
    const { client } = createClient({}, remove);

    await expect(removeBlogImages(client, ["a"])).rejects.toThrow("boom");
  });
});
