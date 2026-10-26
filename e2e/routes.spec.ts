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
      await expect(page.locator("main")).toHaveCount(1);
      await expect(
        page.getByRole("banner").getByRole("link", { name: "hkoikoi.dev" }),
      ).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
    });
  }

  test("한글 슬러그 글이 디코딩되어 상세에 표시된다", async ({ page }) => {
    const response = await page.goto(
      "/blog/" + encodeURIComponent("nextjs-16-시작하기"),
    );

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Next.js 16 시작하기",
    );
  });

  test("초안과 없는 슬러그는 not-found가 표시된다", async ({ page }) => {
    for (const slug of ["초안-글", "없는-글"]) {
      await page.goto("/blog/" + encodeURIComponent(slug));

      await expect(page.getByText("아직 발행하지 않은 초안")).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
      ).toBeVisible();
    }
  });
});

test("로그인 페이지에는 헤더 메뉴와 푸터가 없다", async ({ page }) => {
  await page.goto("/auth/login");

  await expect(page.getByRole("navigation", { name: "주요 메뉴" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
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
