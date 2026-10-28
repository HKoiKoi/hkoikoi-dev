import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOut, redirect } = vi.hoisted(() => ({
  signOut: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { signOut } })),
}));

vi.mock("next/navigation", () => ({ redirect }));

import { logout } from "@/app/admin/actions";

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOut.mockResolvedValue({ error: null });
  });

  it("signOut을 호출한 뒤 홈으로 리다이렉트한다", async () => {
    const order: string[] = [];
    signOut.mockImplementation(async () => order.push("signOut"));
    redirect.mockImplementation(() => order.push("redirect"));

    await logout();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/");
    expect(order).toEqual(["signOut", "redirect"]);
  });
});
