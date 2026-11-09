import { expect, test, type Browser, type Page } from "@playwright/test";

import {
  BASE_URL,
  cleanup,
  createPost,
  hasAdmin,
  login,
} from "./fixtures/admin";

// 테스트가 만든 글은 모두 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-pg-";

// 다른 스펙·이전 실행과 겹치지 않도록 카테고리·태그를 실행마다 고유하게 만든다.
// 카테고리로 걸러 보면 시드 글만 남아 총 글 수를 정확히 알 수 있다(운영 글 수와 무관).
const STAMP = Date.now().toString(36);
const CATEGORY = `e2e-pg-cat-${STAMP}`;
const TAG = `e2e-pg-tag-${STAMP}`;

// 11건이면 데스크톱(10개)은 2페이지(10+1), 모바일(6개)도 2페이지(6+5)다.
const SEED_COUNT = 11;
const DESKTOP_SIZE = 10;
const MOBILE_SIZE = 6;

const title = (index: number) =>
  `${PREFIX}${String(index).padStart(2, "0")}-${STAMP}`;
const SEED_TITLES = Array.from({ length: SEED_COUNT }, (_, i) => title(i + 1));
const EXTRA_TITLE = `${PREFIX}extra-${STAMP}`;

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pagerNav(page: Page) {
  return page.getByRole("navigation", { name: "페이지" });
}

// 목록의 시드 글 링크를 중복 없이 모은다. 카드 하나에 같은 주소의 링크가 여러 개일 수 있다.
async function seedHrefs(page: Page) {
  // 카드가 그려진 뒤에 센다(Suspense가 풀리기 전에는 스켈레톤만 있다).
  await expect(
    page.locator(`a[href^="/blog/${PREFIX}"]`).first(),
  ).toBeVisible();
  return page
    .locator(`a[href^="/blog/${PREFIX}"]`)
    .evaluateAll((links) => [
      ...new Set(links.map((link) => link.getAttribute("href") ?? "")),
    ]);
}

function categoryUrl(extra = "") {
  return `/blog?category=${encodeURIComponent(CATEGORY)}${extra}`;
}

async function seedPosts(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await login(page);
    // 발행 시각이 글마다 달라야 정렬이 정해지므로 하나씩 순서대로 만든다.
    for (const seedTitle of SEED_TITLES) {
      await createPost(page, {
        title: seedTitle,
        category: CATEGORY,
        tags: [TAG],
        published: true,
      });
    }
  } finally {
    await context.close();
  }
}

test.describe("블로그 목록 페이지네이션", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 같은 DB를 공유하고 뒤 테스트가 앞 테스트의 시드 글을 쓰며, 마지막 테스트는 글을 더한다.
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    await seedPosts(browser);
  });

  test.afterAll(async ({ browser }) => {
    test.setTimeout(180_000);
    await cleanup(browser, PREFIX);
  });

  test("데스크톱: 1페이지에 10건이 최신순으로 보이고 '다음'을 누르면 2페이지에 나머지 1건이 보인다", async ({
    page,
  }) => {
    await page.goto(categoryUrl());

    const first = await seedHrefs(page);
    expect(first).toHaveLength(DESKTOP_SIZE);
    // 최신 글(마지막에 만든 글)이 1페이지에, 가장 오래된 글은 2페이지에 있다.
    await expect(
      page.getByRole("link", { name: new RegExp(escapeRegExp(title(11))) }),
    ).not.toHaveCount(0);

    const nav = pagerNav(page);
    await expect(nav.getByRole("link", { name: "1페이지" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: /^\d+페이지$/ })).toHaveCount(2);
    // 첫 페이지에서 '이전'은 링크가 아니다.
    await expect(nav.getByRole("link", { name: "이전 페이지" })).toHaveCount(0);

    await nav.getByRole("link", { name: "다음 페이지" }).click();
    await expect(page).toHaveURL(new RegExp(`page=2$`));

    const second = await seedHrefs(page);
    expect(second).toHaveLength(SEED_COUNT - DESKTOP_SIZE);
    // 두 페이지가 겹치지 않고 합치면 시드 글 전체다.
    expect(second.filter((href) => first.includes(href))).toEqual([]);
    expect(first.length + second.length).toBe(SEED_COUNT);
    await expect(
      pagerNav(page).getByRole("link", { name: "2페이지" }),
    ).toHaveAttribute("aria-current", "page");
    // 마지막 페이지에서 '다음'은 링크가 아니다.
    await expect(
      pagerNav(page).getByRole("link", { name: "다음 페이지" }),
    ).toHaveCount(0);
  });

  test("모바일(iPhone User-Agent): 1페이지에 6건, 2페이지에 5건이 보이고 'n / 전체'가 표시된다", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      userAgent: IPHONE_UA,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    try {
      await page.goto(categoryUrl());
      const first = await seedHrefs(page);
      expect(first).toHaveLength(MOBILE_SIZE);
      await expect(pagerNav(page)).toContainText("2페이지 중 1페이지");
      // 좁은 화면에서는 번호 목록을 숨기고 이전/다음과 현재·전체만 보여 준다.
      await expect(
        pagerNav(page).getByRole("link", { name: "1페이지" }),
      ).toBeHidden();

      await pagerNav(page).getByRole("link", { name: "다음 페이지" }).click();
      await expect(page).toHaveURL(/page=2$/);
      const second = await seedHrefs(page);
      expect(second).toHaveLength(SEED_COUNT - MOBILE_SIZE);
      expect(second.filter((href) => first.includes(href))).toEqual([]);
      await expect(pagerNav(page)).toContainText("2페이지 중 2페이지");

      // 가로로 넘치지 않는다.
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
    } finally {
      await context.close();
    }
  });

  test("필터를 바꾸면 page가 사라져 1페이지로 돌아간다", async ({ page }) => {
    await page.goto(categoryUrl("&page=2"));
    await expect(page).toHaveURL(/page=2$/);
    expect(await seedHrefs(page)).toHaveLength(SEED_COUNT - DESKTOP_SIZE);

    // 태그 칩은 글 수가 적으면 '전체 태그' 접힘 안에 있다.
    const nav = page.getByRole("navigation", { name: "글 탐색" });
    const tagChip = nav.getByRole("link", {
      name: new RegExp(`^#${escapeRegExp(TAG)}\\s*글 ${SEED_COUNT}개$`),
    });
    if (!(await tagChip.isVisible())) {
      await nav.getByText(/^전체 태그/).click();
    }
    await tagChip.click();

    await expect(page).toHaveURL(new RegExp(`tag=${escapeRegExp(TAG)}$`));
    expect(page.url()).not.toContain("page=");
    expect(await seedHrefs(page)).toHaveLength(DESKTOP_SIZE);
    await expect(
      pagerNav(page).getByRole("link", { name: "1페이지" }),
    ).toHaveAttribute("aria-current", "page");
  });

  for (const value of ["abc", "0", "-1"]) {
    test(`잘못된 page(${value})는 1페이지와 같은 결과다`, async ({ page }) => {
      const response = await page.goto(categoryUrl(`&page=${value}`));
      expect(response?.status()).toBeLessThan(400);

      expect(await seedHrefs(page)).toHaveLength(DESKTOP_SIZE);
      await expect(
        pagerNav(page).getByRole("link", { name: "1페이지" }),
      ).toHaveAttribute("aria-current", "page");
    });
  }

  test("마지막 페이지를 넘은 page는 오류 없이 안내와 첫/마지막 페이지 링크를 보여 준다", async ({
    page,
  }) => {
    const response = await page.goto(categoryUrl("&page=999"));
    // notFound()를 쓰지 않으므로 상태 코드는 200이다.
    expect(response?.status()).toBe(200);

    await expect(page.getByText("없는 페이지입니다")).toBeVisible();
    await expect(
      page.getByText("글 목록은 2페이지까지 있습니다."),
    ).toBeVisible();
    await expect(pagerNav(page)).toHaveCount(0);

    const firstLink = page.getByRole("link", { name: "첫 페이지로" });
    const lastLink = page.getByRole("link", { name: "마지막 페이지로" });
    await expect(firstLink).toHaveAttribute("href", categoryUrl());
    await expect(lastLink).toHaveAttribute("href", categoryUrl("&page=2"));

    await lastLink.click();
    await expect(page).toHaveURL(/page=2$/);
    expect(await seedHrefs(page)).toHaveLength(SEED_COUNT - DESKTOP_SIZE);
  });

  test("2페이지를 보는 중 새 글이 발행되면 경계 글이 2페이지로 밀리고 중복이 없다", async ({
    page,
    browser,
  }) => {
    await page.goto(categoryUrl("&page=2"));
    const beforePage2 = await seedHrefs(page);
    expect(beforePage2).toHaveLength(SEED_COUNT - DESKTOP_SIZE);

    // 1페이지의 가장 오래된 글(경계 글)을 기억한다. 새 글이 들어오면 이 글이 2페이지로 밀린다.
    await page.goto(categoryUrl());
    const beforePage1 = await seedHrefs(page);
    expect(beforePage1).toHaveLength(DESKTOP_SIZE);
    const boundaryTitle = title(2);
    await expect(
      page.getByRole("link", { name: new RegExp(escapeRegExp(boundaryTitle)) }),
    ).not.toHaveCount(0);

    // 관리자가 같은 카테고리에 새 글을 발행한다.
    const adminContext = await browser.newContext({ baseURL: BASE_URL });
    const adminPage = await adminContext.newPage();
    try {
      await login(adminPage);
      await createPost(adminPage, {
        title: EXTRA_TITLE,
        category: CATEGORY,
        tags: [TAG],
        published: true,
      });
    } finally {
      await adminContext.close();
    }

    // 새로고침하면 새 글이 1페이지 맨 앞에 오고 경계 글이 2페이지로 밀린다.
    await page.goto(categoryUrl());
    const afterPage1 = await seedHrefs(page);
    await page.goto(categoryUrl("&page=2"));
    const afterPage2 = await seedHrefs(page);

    expect(afterPage1).toHaveLength(DESKTOP_SIZE);
    expect(afterPage2).toHaveLength(SEED_COUNT + 1 - DESKTOP_SIZE);
    // 두 페이지가 겹치지 않고 합치면 12건이다.
    expect(afterPage2.filter((href) => afterPage1.includes(href))).toEqual([]);
    expect(new Set([...afterPage1, ...afterPage2]).size).toBe(SEED_COUNT + 1);
    // 이전에 1페이지 마지막이던 글이 이제 2페이지에 있다.
    const movedHref = beforePage1.filter((href) => !afterPage1.includes(href));
    expect(movedHref).toHaveLength(1);
    expect(afterPage2).toContain(movedHref[0]);
  });
});
