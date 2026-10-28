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

test.describe("퍼센트 인코딩 경로로 관리자 영역 우회 시도", () => {
  // /%61dmin은 /admin의 인코딩 표기다. 어떤 경우에도 관리자 화면(200)이 열리면 안 된다.
  // 아래 경로는 /admin 라우트로 디코딩되지 않아 404이고, 5xx는 실패로 처리된다.
  for (const path of [
    "/%61dmin/posts",
    "/%41dmin/posts",
    "/admin%2Fposts",
    "/%2561dmin/posts",
  ]) {
    test(`${path} 는 404를 반환하고 관리자 화면을 렌더링하지 않는다`, async ({
      request,
    }) => {
      const response = await request.get(path, { maxRedirects: 0 });

      expect(response.status()).toBe(404);
    });
  }

  // /admin/%70osts는 디코딩되면 /admin/posts라서 proxy가 비로그인을 로그인으로 보낸다.
  test("/admin/%70osts 는 307로 /auth/login 에 리다이렉트된다", async ({
    request,
  }) => {
    const response = await request.get("/admin/%70osts", { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toMatch(/\/auth\/login$/);
  });
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
