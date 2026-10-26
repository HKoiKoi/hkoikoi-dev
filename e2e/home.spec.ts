import { expect, test } from "@playwright/test";

test("홈 페이지가 렌더링된다", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page).toHaveTitle(/hkoikoi\.dev/);

  // 스타터 킷 문구가 남아 있지 않아야 한다
  await expect(page.getByText("Next steps")).toHaveCount(0);
  await expect(page.getByText("Deploy")).toHaveCount(0);
});
