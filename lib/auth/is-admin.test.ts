import { describe, expect, it } from "vitest";
import { isAdmin } from "@/lib/auth/is-admin";

describe("isAdmin", () => {
  it("claims가 null/undefined면 false", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("role이 없으면 false", () => {
    expect(isAdmin({})).toBe(false);
    expect(isAdmin({ app_metadata: {} })).toBe(false);
  });

  it("user_metadata.role=admin은 false", () => {
    const claims = {
      app_metadata: { provider: "email" },
      user_metadata: { role: "admin" },
    };
    expect(isAdmin(claims)).toBe(false);
  });

  it("app_metadata.role=admin이면 true", () => {
    expect(isAdmin({ app_metadata: { role: "admin" } })).toBe(true);
  });

  it("다른 role이면 false", () => {
    expect(isAdmin({ app_metadata: { role: "user" } })).toBe(false);
  });
});
