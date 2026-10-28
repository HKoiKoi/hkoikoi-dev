import { expect, test, type Page } from "@playwright/test";

import { hasAdmin, login } from "./fixtures/admin";

// 글을 저장하지 않고 편집기 화면만 확인하므로 DB 정리는 필요 없다.
// 미리보기는 Shadow DOM 안에 렌더링되며 Playwright locator는 기본적으로 shadow DOM을 관통한다.
const preview = (page: Page) => page.getByRole("region", { name: "미리보기" });

test.describe("편집기 미리보기", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/admin/posts/new");
  });

  test("# 제목을 입력하면 미리보기에 h1이 나온다", async ({ page }) => {
    await page.getByLabel("본문").fill("# 미리보기 제목");
    await expect(
      preview(page).getByRole("heading", { level: 1, name: "미리보기 제목" }),
    ).toBeVisible();
  });

  test("수식과 코드 블록이 .katex·.hljs로 렌더링된다", async ({ page }) => {
    await page
      .getByLabel("본문")
      .fill("수식 $E=mc^2$\n\n```ts\nconst a: number = 1;\n```");
    await expect(preview(page).locator(".katex").first()).toBeVisible();
    await expect(preview(page).locator(".hljs").first()).toBeVisible();
  });

  test("본문 <style>이 편집기 UI에 영향을 주지 않는다", async ({ page }) => {
    const before = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    await page
      .getByLabel("본문")
      .fill("<style>button{display:none} body{background:red}</style>\n\n본문");
    await expect(preview(page).getByText("본문")).toBeVisible();

    await expect(
      page.getByRole("button", { name: "저장하기", exact: true }),
    ).toBeVisible();
    const after = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(after).toBe(before);
  });

  test("$ 단독 입력에도 오류 화면이 나오지 않는다", async ({ page }) => {
    await page.getByLabel("본문").fill("$");
    await expect(page.getByLabel("본문")).toHaveValue("$");
    await expect(page.getByText("미리보기를 표시할 수 없습니다")).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "저장하기", exact: true }),
    ).toBeVisible();
  });

  test("375px에서 탭을 오가도 입력이 유지된다", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.getByLabel("본문").fill("# 모바일 입력");

    await page.getByRole("tab", { name: "미리보기" }).click();
    await expect(
      preview(page).getByRole("heading", { level: 1, name: "모바일 입력" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "작성" }).click();
    await expect(page.getByLabel("본문")).toHaveValue("# 모바일 입력");
  });
});
