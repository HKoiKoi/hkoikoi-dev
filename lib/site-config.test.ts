import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { isActivePath, isGroupActive } from "@/lib/is-active-path";
import { isNavGroup, navItems, siteConfig } from "@/lib/site-config";

const leaves = navItems.flatMap((item) =>
  isNavGroup(item) ? item.children : [item],
);
const hrefs = leaves.map((leaf) => leaf.href);

describe("siteConfig", () => {
  it("사이트 이름이 비어 있지 않다", () => {
    expect(siteConfig.name.trim()).not.toBe("");
  });
});

describe("navItems", () => {
  it("href가 슬래시로 시작하고 중복되지 않는다", () => {
    expect(hrefs.every((href) => href.startsWith("/"))).toBe(true);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("label이 비어 있지 않고 그룹은 자식이 하나 이상이다", () => {
    expect(leaves.every((leaf) => leaf.label.trim() !== "")).toBe(true);
    for (const item of navItems) {
      expect(item.label.trim()).not.toBe("");
      if (isNavGroup(item)) expect(item.children.length).toBeGreaterThan(0);
    }
  });

  it("모든 href가 app/(site) 라우트 폴더와 대응한다", () => {
    for (const href of hrefs) {
      const dir = join(process.cwd(), "app", "(site)", href);
      expect(existsSync(join(dir, "page.tsx")), href).toBe(true);
    }
  });

  it("isActivePath로 각 href는 자기 자신만 활성이다", () => {
    for (const href of hrefs) {
      const active = hrefs.filter((other) => isActivePath(href, other));
      expect(active).toEqual([href]);
    }
  });

  it("하위 경로에서는 해당 그룹만 활성이다", () => {
    const groups = navItems.filter(isNavGroup);
    for (const group of groups) {
      const child = group.children[0].href;
      expect(isGroupActive(`${child}/sub`, group)).toBe(true);
      for (const other of groups.filter((g) => g !== group)) {
        expect(isGroupActive(`${child}/sub`, other)).toBe(false);
      }
    }
  });
});
