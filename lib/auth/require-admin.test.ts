import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() => vi.fn());
const connectionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("next/server", () => ({ connection: connectionMock }));
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

import { requireAdmin } from "./require-admin";

function mockClaims(claims: object | null) {
  const getClaims = vi.fn().mockResolvedValue({ data: claims && { claims } });
  createClientMock.mockResolvedValue({ auth: { getClaims } });
}

beforeEach(() => {
  vi.clearAllMocks();
  // 실제 redirect/notFound처럼 예외를 던져 이후 코드가 실행되지 않게 한다.
  redirectMock.mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
  notFoundMock.mockImplementation(() => {
    throw new Error("NOT_FOUND");
  });
});

describe("requireAdmin", () => {
  it("세션 검사 전에 connection()으로 요청 시점까지 미룬다", async () => {
    const order: string[] = [];
    connectionMock.mockImplementation(async () => {
      order.push("connection");
    });
    createClientMock.mockImplementation(async () => {
      order.push("createClient");
      return {
        auth: {
          getClaims: async () => ({
            data: { claims: { app_metadata: { role: "admin" } } },
          }),
        },
      };
    });

    await requireAdmin();

    expect(order).toEqual(["connection", "createClient"]);
  });

  it("claims가 없으면 /auth/login으로 redirect", async () => {
    mockClaims(null);

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/auth/login");
    expect(redirectMock).toHaveBeenCalledWith("/auth/login");
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("로그인했지만 관리자가 아니면 notFound", async () => {
    mockClaims({ sub: "user-1", app_metadata: { role: "user" } });

    await expect(requireAdmin()).rejects.toThrow("NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("app_metadata.role이 admin이면 claims를 반환", async () => {
    const claims = { sub: "admin-1", app_metadata: { role: "admin" } };
    mockClaims(claims);

    await expect(requireAdmin()).resolves.toEqual(claims);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
