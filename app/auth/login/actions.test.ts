import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null, email: "" };

function formOf(fields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  createClientMock.mockResolvedValue({
    auth: { signInWithPassword: signInMock },
  });
  signInMock.mockResolvedValue({ error: null });
  // 실제 redirect처럼 예외를 던져 이후 코드가 실행되지 않게 한다.
  redirectMock.mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
});

describe("login", () => {
  it("이메일이 비어 있으면 검증 오류를 반환하고 Supabase를 호출하지 않음", async () => {
    const result = await login(
      initialState,
      formOf({ email: "", password: "pw" }),
    );

    expect(result).toEqual({
      error: "이메일과 비밀번호를 입력해주세요.",
      email: "",
    });
    expect(createClientMock).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("공백뿐인 이메일은 trim 후 비어 있는 것으로 처리", async () => {
    const result = await login(
      initialState,
      formOf({ email: "   ", password: "pw" }),
    );

    expect(result.error).toBe("이메일과 비밀번호를 입력해주세요.");
    expect(result.email).toBe("");
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("비밀번호가 비어 있으면 입력한 이메일을 유지한 채 오류 반환", async () => {
    const result = await login(
      initialState,
      formOf({ email: "a@b.com", password: "" }),
    );

    expect(result).toEqual({
      error: "이메일과 비밀번호를 입력해주세요.",
      email: "a@b.com",
    });
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("필드가 아예 없어도 검증 오류를 반환", async () => {
    const result = await login(initialState, new FormData());

    expect(result.error).toBe("이메일과 비밀번호를 입력해주세요.");
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("인증 실패 시 서버 원문 대신 일반 메시지를 반환", async () => {
    signInMock.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    const result = await login(
      initialState,
      formOf({ email: "a@b.com", password: "wrong" }),
    );

    expect(result).toEqual({
      error: "이메일 또는 비밀번호가 올바르지 않습니다.",
      email: "a@b.com",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("성공하면 trim한 이메일로 로그인하고 /admin/posts로 redirect", async () => {
    await expect(
      login(initialState, formOf({ email: " a@b.com ", password: "pw" })),
    ).rejects.toThrow("REDIRECT:/admin/posts");

    expect(signInMock).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "pw",
    });
  });
});
