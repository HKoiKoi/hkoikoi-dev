import { describe, expect, it } from "vitest";

import { isNavCurrent } from "./nav";

describe("isNavCurrent", () => {
  it("글 관리는 목록·수정에서 활성이고 새 글에서는 아니다", () => {
    expect(isNavCurrent("/admin/posts", "/admin/posts")).toBe(true);
    expect(isNavCurrent("/admin/posts", "/admin/posts/abc/edit")).toBe(true);
    expect(isNavCurrent("/admin/posts", "/admin/posts/new")).toBe(false);
    expect(isNavCurrent("/admin/posts/new", "/admin/posts/new")).toBe(true);
  });

  it("이력은 모든 섹션과 하위 경로에서 활성이다", () => {
    const href = "/admin/resume/education";
    expect(isNavCurrent(href, "/admin/resume/education")).toBe(true);
    expect(isNavCurrent(href, "/admin/resume/career")).toBe(true);
    expect(isNavCurrent(href, "/admin/resume/career/new")).toBe(true);
    expect(isNavCurrent(href, "/admin/resume/career/abc/edit")).toBe(true);
    expect(isNavCurrent(href, "/admin/projects")).toBe(false);
  });

  it("프로젝트·논문·스토리지는 접두 경로에서 활성이다", () => {
    expect(isNavCurrent("/admin/projects", "/admin/projects/new")).toBe(true);
    expect(
      isNavCurrent("/admin/publications", "/admin/publications/x/edit"),
    ).toBe(true);
    expect(isNavCurrent("/admin/storage", "/admin/storage")).toBe(true);
  });

  it("접두만 같은 다른 경로는 활성이 아니다", () => {
    expect(isNavCurrent("/admin/projects", "/admin/projects-old")).toBe(false);
    expect(isNavCurrent("/admin/posts", "/admin/postsx")).toBe(false);
  });
});
