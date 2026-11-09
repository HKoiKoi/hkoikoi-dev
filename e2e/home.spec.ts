import { expect, test } from "@playwright/test";

test("홈 페이지가 렌더링된다", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page).toHaveTitle(/hkoikoi\.dev/);

  // 스타터 킷 문구가 남아 있지 않아야 한다. getByText는 기본이 대소문자 무시 부분 일치라
  // 최신 글 제목·링크·태그(예: auto-deploy, #deployment)에 걸리므로 exact로 비교한다.
  await expect(page.getByText("Next steps", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Deploy", { exact: true })).toHaveCount(0);
});
