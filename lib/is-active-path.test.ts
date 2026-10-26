import { describe, expect, it } from "vitest";
import { isActivePath, isGroupActive } from "@/lib/is-active-path";
import type { NavGroup } from "@/lib/site-config";

describe("isActivePath", () => {
  it("루트는 정확 일치만 활성이다", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/blog", "/")).toBe(false);
  });

  it("하위 경로까지 활성으로 본다", () => {
    expect(isActivePath("/blog", "/blog")).toBe(true);
    expect(isActivePath("/blog/post-1", "/blog")).toBe(true);
    expect(isActivePath("/blogger", "/blog")).toBe(false);
  });
});

describe("isGroupActive", () => {
  const group: NavGroup = {
    label: "이력",
    children: [
      { label: "학력", href: "/education" },
      { label: "경력", href: "/career" },
    ],
  };

  it("자식 중 하나라도 활성이면 true", () => {
    expect(isGroupActive("/career", group)).toBe(true);
    expect(isGroupActive("/education/detail", group)).toBe(true);
  });

  it("어느 자식도 활성이 아니면 false", () => {
    expect(isGroupActive("/", group)).toBe(false);
    expect(isGroupActive("/projects", group)).toBe(false);
  });
});
