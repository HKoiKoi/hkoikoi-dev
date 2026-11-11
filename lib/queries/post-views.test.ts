import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/public", () => ({
  createPublicClient: createClientMock,
}));

import { getPostViewCount } from "./post-views";

type Result = { data: unknown; error: { message: string } | null };

function mockResult(result: Result) {
  const maybeSingle = vi.fn(() => Promise.resolve(result));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  createClientMock.mockReturnValue({ from });
  return { from, select, eq, maybeSingle };
}

describe("getPostViewCount", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    createClientMock.mockReset();
  });

  it("행이 있으면 view_count를 돌려준다", async () => {
    const mocks = mockResult({ data: { view_count: 42 }, error: null });

    await expect(getPostViewCount("post-1")).resolves.toBe(42);
    expect(mocks.from).toHaveBeenCalledWith("post_views");
    expect(mocks.select).toHaveBeenCalledWith("view_count");
    expect(mocks.eq).toHaveBeenCalledWith("post_id", "post-1");
  });

  it("행이 없으면 0을 돌려준다", async () => {
    mockResult({ data: null, error: null });

    await expect(getPostViewCount("post-1")).resolves.toBe(0);
  });

  it("오류면 null을 돌려주고 로그를 남긴다", async () => {
    mockResult({ data: null, error: { message: "boom" } });

    await expect(getPostViewCount("post-1")).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("예외가 나면 null을 돌려준다", async () => {
    createClientMock.mockImplementation(() => {
      throw new Error("network");
    });

    await expect(getPostViewCount("post-1")).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });
});
