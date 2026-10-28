import { describe, expect, it } from "vitest";
import { isAdminPath } from "@/lib/auth/is-admin-path";

describe("isAdminPath", () => {
  it("/admin 자체는 보호 대상", () => {
    expect(isAdminPath("/admin")).toBe(true);
  });

  it("/admin 하위 경로는 보호 대상", () => {
    expect(isAdminPath("/admin/posts")).toBe(true);
    expect(isAdminPath("/admin/posts/new")).toBe(true);
    expect(isAdminPath("/admin/posts/abc/edit")).toBe(true);
    expect(isAdminPath("/admin/")).toBe(true);
  });

  it("/administrator처럼 접두만 같은 경로는 비보호", () => {
    expect(isAdminPath("/administrator")).toBe(false);
    expect(isAdminPath("/administrator/posts")).toBe(false);
    expect(isAdminPath("/admin-panel")).toBe(false);
  });

  it("공개·인증 경로는 비보호", () => {
    expect(isAdminPath("/")).toBe(false);
    expect(isAdminPath("/blog/admin")).toBe(false);
    expect(isAdminPath("/auth/login")).toBe(false);
  });

  it("대소문자가 다른 경로는 비보호(Next 라우팅은 대소문자 구분)", () => {
    expect(isAdminPath("/Admin")).toBe(false);
  });
});
