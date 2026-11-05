import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn(() => ({ from: vi.fn() })));

vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

import { createPublicClient } from "./public";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  createClientMock.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createPublicClient", () => {
  it("환경변수와 세션 없는 auth 옵션으로 클라이언트를 만든다", () => {
    createPublicClient();

    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "sb_publishable_test",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  });

  it("호출마다 새 클라이언트를 만든다", () => {
    const a = createPublicClient();
    const b = createPublicClient();

    expect(createClientMock).toHaveBeenCalledTimes(2);
    expect(a).not.toBe(b);
  });
});
