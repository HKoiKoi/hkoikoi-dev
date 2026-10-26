import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/education",
  "/career",
  "/certifications",
  "/volunteer",
  "/languages",
  "/activities",
  "/projects",
  "/publications",
  "/blog",
];

test.describe("공개 경로", () => {
  for (const path of publicRoutes) {
    test(`${path} 가 리다이렉트 없이 로드되고 h1이 보인다`, async ({
      page,
    }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      expect(new URL(page.url()).pathname).toBe(path);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }

  test("한글 슬러그가 디코딩되어 h1에 표시된다", async ({ page }) => {
    const response = await page.goto(
      "/blog/" + encodeURIComponent("첫-번째-글"),
    );

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "첫-번째-글",
    );
  });
});

test.describe("관리자 경로 보호", () => {
  // proxy는 NEXT_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY가 없으면 세션 검사를 건너뛴다.
  // dev 서버는 .env를 직접 읽어 Playwright 프로세스에서는 유무를 알 수 없으므로,
  // 실제 응답으로 검사 여부를 판별해 건너뛴다(CI에서는 건너뛰지 않고 실패시킨다).
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
    const redirected = new URL(page.url()).pathname === "/auth/login";
    test.skip(
      !redirected && !process.env.CI,
      "Supabase 환경변수가 없어 proxy 세션 검사가 건너뛰어짐",
    );
  });

  for (const path of ["/admin", "/admin/posts", "/admin/posts/edit"]) {
    test(`비로그인 ${path} 는 /auth/login 으로 이동한다`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(/\/auth\/login$/);
    });
  }

  test("/administrator 는 보호되지 않아 not-found가 표시된다", async ({
    page,
  }) => {
    const response = await page.goto("/administrator");

    expect(response?.status()).toBe(404);
    await expect(page.getByText("페이지를 찾을 수 없습니다")).toBeVisible();
  });
});

test("존재하지 않는 경로는 404 not-found 문구를 보여준다", async ({ page }) => {
  const response = await page.goto("/does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByText("페이지를 찾을 수 없습니다")).toBeVisible();
});
