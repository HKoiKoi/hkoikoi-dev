import { expect, test, type Browser, type Page } from "@playwright/test";

import {
  ADMIN_STATE,
  BASE_URL,
  cleanup,
  createPost,
  hasAdmin,
  login,
  uniqueName,
} from "./fixtures/admin";

const PREFIX = "e2e-views-";

// Playwright 기본 UA는 HeadlessChrome이라 봇으로 걸러진다. 방문자 컨텍스트는 일반 브라우저 UA를 쓴다.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

// 글 상세 헤더의 '조회수 N'은 요청 시점에 렌더되고, 집계 POST는 마운트 뒤에 나간다.
// 따라서 첫 방문 화면은 증가 전 값이고, 새로고침해야 증가한 값이 보인다.
function viewCountOf(page: Page) {
  return page.locator("article header").getByText(/조회수 [\d,]+/);
}

async function visit(page: Page, path: string) {
  const posted = page.waitForResponse(
    (res) => res.url().includes("/view") && res.request().method() === "POST",
  );
  await page.goto(path);
  const response = await posted;
  expect(response.status()).toBe(204);
  return response;
}

async function newVisitor(browser: Browser, userAgent?: string) {
  return browser.newContext({ baseURL: BASE_URL, userAgent });
}

test.describe.configure({ mode: "serial" });

test.describe("글 조회수 집계", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");

  const title = uniqueName(PREFIX, "post");
  const path = `/blog/${title}`;

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("발행 글 생성", async ({ page }) => {
    await login(page);
    await createPost(page, { title, slug: title, published: true });
  });

  test("새 방문자는 +1 되고 같은 컨텍스트에서 새로고침해도 늘지 않는다", async ({
    browser,
  }) => {
    const visitor = await newVisitor(browser, BROWSER_UA);
    try {
      const page = await visitor.newPage();

      const first = await visit(page, path);
      // 증가가 일어난 응답에는 24시간 쿠키가 실린다.
      expect((await first.allHeaders())["set-cookie"] ?? "").toMatch(
        /post_viewed_/,
      );

      await page.reload();
      await expect(viewCountOf(page)).toHaveText(/조회수 1(?!\d)/);

      // 쿠키가 있으므로 다시 열어도 그대로다.
      await visit(page, path);
      await page.reload();
      await expect(viewCountOf(page)).toHaveText(/조회수 1(?!\d)/);
    } finally {
      await visitor.close();
    }
  });

  test("다른 새 컨텍스트는 또 +1 된다", async ({ browser }) => {
    const visitor = await newVisitor(browser, BROWSER_UA);
    try {
      const page = await visitor.newPage();
      await visit(page, path);
      await page.reload();
      await expect(viewCountOf(page)).toHaveText(/조회수 2(?!\d)/);
    } finally {
      await visitor.close();
    }
  });

  test("봇 User-Agent는 집계하지 않는다", async ({ browser }) => {
    // userAgent를 지정하지 않으면 HeadlessChrome이라 봇으로 판정된다.
    const visitor = await newVisitor(browser);
    try {
      const page = await visitor.newPage();
      const response = await visit(page, path);
      expect((await response.allHeaders())["set-cookie"] ?? "").not.toMatch(
        /post_viewed_/,
      );
      await page.reload();
      await expect(viewCountOf(page)).toHaveText(/조회수 2(?!\d)/);
    } finally {
      await visitor.close();
    }
  });

  test("관리자 세션은 집계하지 않는다", async ({ browser }) => {
    const admin = await browser.newContext({
      baseURL: BASE_URL,
      userAgent: BROWSER_UA,
      storageState: ADMIN_STATE,
    });
    try {
      const page = await admin.newPage();
      const response = await visit(page, path);
      expect((await response.allHeaders())["set-cookie"] ?? "").not.toMatch(
        /post_viewed_/,
      );
      await page.reload();
      await expect(viewCountOf(page)).toHaveText(/조회수 2(?!\d)/);
    } finally {
      await admin.close();
    }
  });

  test("관리자 글 목록의 조회수 열에 같은 숫자가 보인다", async ({ page }) => {
    await login(page);
    const row = page.getByRole("row", { name: new RegExp(title) });
    await expect(row.getByRole("cell").nth(2)).toHaveText("2");
  });
});
