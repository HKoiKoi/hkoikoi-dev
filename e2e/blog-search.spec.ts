import { expect, test, type Browser, type Page } from "@playwright/test";

import {
  BASE_URL,
  cleanup,
  createPost,
  hasAdmin,
  login,
} from "./fixtures/admin";

// 테스트가 만든 글은 모두 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-search-";
const STAMP = Date.now().toString(36);
const TAG = `e2e-st-${STAMP}`;
// 초안 전용 키워드. 발행 글·다른 스펙과 겹치지 않도록 실행마다 고유하게 만든다.
const DRAFT_KEYWORD = `초안전용${STAMP}`;

const PUBLISHED = {
  title: `${PREFIX}캐시무효화-정리-${STAMP}`,
  tags: [TAG],
  published: true,
};
const DRAFT = {
  title: `${PREFIX}${DRAFT_KEYWORD}`,
  published: false,
};

function postLink(page: Page) {
  return page.getByRole("link", { name: PUBLISHED.title });
}

function searchInput(page: Page) {
  return page.getByRole("searchbox", { name: "블로그 검색" });
}

// 검색 버튼 대신 Enter로 제출한다(JS 없는 GET 폼이라 같은 동작).
async function search(page: Page, value: string) {
  await searchInput(page).fill(value);
  await searchInput(page).press("Enter");
  await expect(page).toHaveURL(/\/blog\?/);
}

async function expectNoErrorScreen(page: Page) {
  await expect(
    page.getByRole("heading", { level: 1, name: "블로그" }),
  ).toBeVisible();
}

async function seedPosts(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await login(page);
    await createPost(page, PUBLISHED);
    await createPost(page, DRAFT);
  } finally {
    await context.close();
  }
}

test.describe("블로그 키워드 검색", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 같은 DB를 공유하고 뒤 테스트가 앞 테스트의 시드 글을 쓰므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    await seedPosts(browser);
  });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("검색어를 입력해 제출하면 ?q=로 이동해 글이 보이고, 초기화하면 전체 목록으로 돌아간다", async ({
    page,
  }) => {
    await page.goto("/blog");
    await search(page, "캐시");

    await expect(page).toHaveURL(/\/blog\?q=%EC%BA%90%EC%8B%9C/);
    await expect(postLink(page)).toBeVisible();
    await expect(page.getByText(/검색 결과\s*\d+개/)).toBeVisible();

    // 입력만 해 둔 값이 있어도 초기화 링크는 모든 조건을 풀고 /blog로 간다.
    await searchInput(page).fill("다른 입력");
    await page.getByRole("link", { name: "초기화" }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(searchInput(page)).toHaveValue("");
    await expect(page.getByText(/검색 결과\s*\d+개/)).toHaveCount(0);
  });

  test("1자 검색어는 검색하지 않고 두 글자 이상 입력하라는 안내를 보여 준다", async ({
    page,
  }) => {
    await page.goto("/blog");
    await search(page, "캐");

    await expect(
      page.getByText("검색어는 두 글자 이상 입력해 주세요."),
    ).toBeVisible();
    await expect(searchInput(page)).toHaveValue("캐");
    await expectNoErrorScreen(page);
    // 검색하지 않으므로 결과 수 안내가 없다.
    await expect(page.getByText(/검색 결과\s*\d+개/)).toHaveCount(0);
  });

  test("검색어와 태그는 AND로 결합된다", async ({ page }) => {
    await page.goto(`/blog?q=캐시&tag=${TAG}`);
    await expect(postLink(page)).toBeVisible();

    // 이 글에 없는 태그와 결합하면 0건이다.
    await page.goto(`/blog?q=캐시&tag=e2e-st-none-${STAMP}`);
    await expect(page.getByText("검색 결과가 없습니다")).toBeVisible();
    await expect(postLink(page)).toHaveCount(0);
  });

  test("초안에만 있는 키워드는 결과에 나오지 않고 0건 안내를 보여 준다", async ({
    page,
  }) => {
    await page.goto("/blog");
    await search(page, DRAFT_KEYWORD);

    await expect(page.getByText("검색 결과가 없습니다")).toBeVisible();
    await expect(page.getByRole("link", { name: DRAFT.title })).toHaveCount(0);
  });

  for (const value of ["%", "_", "a,b)", "' or 1=1 --"]) {
    test(`특수문자 검색어 ${JSON.stringify(value)}는 오류 없이 문자 그대로 검색한다`, async ({
      page,
    }) => {
      await page.goto("/blog");
      await search(page, value);

      await expectNoErrorScreen(page);
      // 문자 그대로 찾으므로 시드 글(제목에 해당 문자 없음)은 나오지 않는다.
      await expect(postLink(page)).toHaveCount(0);
      await expect(searchInput(page)).toHaveValue(value);
    });
  }

  test("51자 이상 검색어는 50자로 잘라 검색한다", async ({ page }) => {
    const response = await page.goto(`/blog?q=${"가".repeat(51)}`);

    expect(response?.status()).toBeLessThan(400);
    await expectNoErrorScreen(page);
    await expect(searchInput(page)).toHaveValue("가".repeat(50));
  });

  test("NFD로 분해된 한글 검색어도 NFC와 같은 결과를 보여 준다", async ({
    page,
  }) => {
    const nfd = encodeURIComponent("캐시".normalize("NFD"));
    await page.goto(`/blog?q=${nfd}`);

    await expect(postLink(page)).toBeVisible();
    await expect(searchInput(page)).toHaveValue("캐시");
  });

  test("검색 결과 페이지는 noindex이고 canonical에 검색어가 없다", async ({
    page,
  }) => {
    await page.goto("/blog?q=캐시");
    await expect(postLink(page)).toBeVisible();

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).not.toContain("q=");
  });
});
