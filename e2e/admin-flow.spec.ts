import { expect, test } from "@playwright/test";

import {
  cleanup,
  confirmDelete,
  createPost,
  fillEditor,
  hasAdmin,
  login,
  rowOf,
  uniqueName,
} from "./fixtures/admin";

const PREFIX = "e2e-flow-";

test.describe("관리자 여정", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("로그인 → 초안 → 수정 후 발행 → 공개 확인 → 삭제 → 로그아웃", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "journey");
    const notFound = page.getByRole("heading", {
      name: "페이지를 찾을 수 없습니다",
    });

    await test.step("로그인", async () => {
      await login(page);
      await expect(
        page.getByRole("heading", { level: 1, name: "글 관리" }),
      ).toBeVisible();
    });

    await test.step("새 글을 초안으로 저장하면 비공개다", async () => {
      await createPost(page, { title, slug: title, published: false });
      await expect(rowOf(page, title).getByText("초안")).toBeVisible();

      await page.goto("/blog");
      await expect(page.getByText(title)).toHaveCount(0);
      await page.goto(`/blog/${title}`);
      await expect(notFound).toBeVisible();
    });

    await test.step("수정해서 발행하면 공개된다", async () => {
      await page.goto("/admin/posts");
      await rowOf(page, title).getByRole("link", { name: "수정" }).click();
      await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]+\/edit$/);
      await fillEditor(page, { title });
      await page.getByRole("button", { name: "수정하기", exact: true }).click();
      await expect(page).toHaveURL(/\/admin\/posts$/);
      await expect(rowOf(page, title).getByText("발행")).toBeVisible();

      await page.goto("/blog");
      await expect(page.getByText(title).first()).toBeVisible();
      await page.goto(`/blog/${title}`);
      await expect(
        page.getByRole("heading", { level: 1, name: title }),
      ).toBeVisible();
    });

    await test.step("삭제하면 목록과 공개 페이지에서 사라진다", async () => {
      await page.goto("/admin/posts");
      await confirmDelete(page, title);
      await expect(rowOf(page, title)).toHaveCount(0);

      await page.goto("/blog");
      await expect(page.getByText(title)).toHaveCount(0);
      await page.goto(`/blog/${title}`);
      await expect(notFound).toBeVisible();
    });

    await test.step("로그아웃하면 메인으로 가고 관리자 영역이 막힌다", async () => {
      await page.goto("/admin/posts");
      await page.getByRole("button", { name: "로그아웃" }).click();
      await expect(page).toHaveURL(/\/$/);

      await page.goto("/admin/posts");
      await expect(page).toHaveURL(/\/auth\/login$/);
    });
  });
});
