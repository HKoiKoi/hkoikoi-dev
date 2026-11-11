// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const createPublicClientMock = vi.hoisted(() => vi.fn());
const isAdminMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const getClaimsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/supabase/public", () => ({
  createPublicClient: createPublicClientMock,
}));
vi.mock("@/lib/auth/is-admin", () => ({ isAdmin: isAdminMock }));

import { POST } from "./route";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function call(
  id = ID,
  init: { ua?: string | null; cookie?: string } = {},
): Promise<Response> {
  const headers = new Headers();
  if (init.ua !== null) headers.set("user-agent", init.ua ?? BROWSER_UA);
  if (init.cookie) headers.set("cookie", init.cookie);
  const request = new NextRequest(`http://localhost/api/posts/${id}/view`, {
    method: "POST",
    headers,
  });
  return POST(request, {
    params: Promise.resolve({ id }),
  } as RouteContext<"/api/posts/[id]/view">);
}

beforeEach(() => {
  vi.clearAllMocks();
  getClaimsMock.mockResolvedValue({ data: null });
  createClientMock.mockResolvedValue({ auth: { getClaims: getClaimsMock } });
  createPublicClientMock.mockReturnValue({ rpc: rpcMock });
  isAdminMock.mockReturnValue(false);
  rpcMock.mockResolvedValue({ data: true, error: null });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/posts/[id]/view", () => {
  it("uuid 형식이 아닌 id는 400이고 아무것도 호출하지 않는다", async () => {
    const res = await call("not-a-uuid");

    expect(res.status).toBe(400);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("이미 본 쿠키가 있으면 204, RPC 미호출", async () => {
    const res = await call(ID, { cookie: `post_viewed_${ID}=1` });

    expect(res.status).toBe(204);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("봇 User-Agent는 204, RPC 미호출", async () => {
    const res = await call(ID, { ua: "Googlebot/2.1" });

    expect(res.status).toBe(204);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("User-Agent가 없으면 봇으로 보아 RPC를 호출하지 않는다", async () => {
    const res = await call(ID, { ua: null });

    expect(res.status).toBe(204);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("관리자 세션은 204, RPC 미호출", async () => {
    const claims = { app_metadata: { role: "admin" } };
    getClaimsMock.mockResolvedValue({ data: { claims } });
    isAdminMock.mockReturnValue(true);

    const res = await call();

    expect(isAdminMock).toHaveBeenCalledWith(claims);
    expect(res.status).toBe(204);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("RPC가 false(발행 글 아님)면 204이고 쿠키를 만들지 않는다", async () => {
    rpcMock.mockResolvedValue({ data: false, error: null });

    const res = await call();

    expect(rpcMock).toHaveBeenCalledWith("increment_post_view", {
      p_post_id: ID,
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("RPC가 true면 204와 24시간 httpOnly 쿠키를 설정한다", async () => {
    const res = await call();

    expect(rpcMock).toHaveBeenCalledWith("increment_post_view", {
      p_post_id: ID,
    });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`post_viewed_${ID}=1`);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);
    expect(setCookie).toMatch(/Max-Age=86400/i);
    expect(setCookie).toMatch(/Path=\//i);
  });

  it("RPC 오류는 던지지 않고 console.error 후 204, 쿠키 없음", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });

    const res = await call();

    expect(res.status).toBe(204);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("예외가 나도 204이고 쿠키를 만들지 않는다", async () => {
    createClientMock.mockRejectedValue(new Error("env 없음"));

    const res = await call();

    expect(res.status).toBe(204);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
