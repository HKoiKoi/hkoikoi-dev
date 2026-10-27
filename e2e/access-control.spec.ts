import { expect, test } from "@playwright/test";

const LOGIN_ERROR = "이메일 또는 비밀번호가 올바르지 않습니다.";

test.describe("비로그인의 관리자 영역 접근 차단", () => {
  for (const path of ["/admin/posts", "/admin/posts/edit"]) {
    test(`${path} 에 접근하면 /auth/login 으로 이동한다`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(/\/auth\/login$/);
    });
  }
});

test.describe("로그인 실패 반복", () => {
  test("3회 연속 실패해도 매번 오류가 보이고 로그인 화면이 유지된다", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    for (let attempt = 1; attempt <= 3; attempt++) {
      await page.getByLabel("이메일").fill("e2e-invalid@example.com");
      await page.getByLabel("비밀번호").fill(`wrong-password-${attempt}`);
      await page.getByRole("button", { name: "로그인", exact: true }).click();

      // Next의 route announcer도 role="alert"라서 오류 문구로 좁힌다.
      await expect(
        page.getByRole("alert").filter({ hasText: LOGIN_ERROR }),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(
        page.getByRole("button", { name: "로그인", exact: true }),
      ).toBeEnabled();
    }
  });
});
