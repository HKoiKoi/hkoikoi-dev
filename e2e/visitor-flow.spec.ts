import { expect, test } from "@playwright/test";

import {
  BASE_URL,
  cleanup,
  createPost,
  hasAdmin,
  login,
  uniqueName,
} from "./fixtures/admin";

const PREFIX = "e2e-visitor-";

test("메인 → 섹션 카드 → 이력 → 헤더로 프로젝트·논문·블로그 → 로고로 메인", async ({
  page,
}) => {
  const h1 = page.getByRole("heading", { level: 1 });
  const nav = page.getByRole("navigation", { name: "주요 메뉴" });

  await page.goto("/");
  await expect(h1).toHaveText("고이코이");

  await page
    .getByRole("region", { name: "바로가기" })
    .getByRole("link", { name: "학력" })
    .click();
  await expect(page).toHaveURL(/\/education$/);
  await expect(h1).toHaveText("학력");

  await nav.getByRole("link", { name: "프로젝트" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(h1).toHaveText("프로젝트");

  await nav.getByRole("link", { name: "논문" }).click();
  await expect(page).toHaveURL(/\/publications$/);
  await expect(h1).toHaveText("논문");

  await nav.getByRole("link", { name: "블로그" }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(h1).toHaveText("블로그");

  await page
    .getByRole("banner")
    .getByRole("link", { name: "hkoikoi.dev" })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(h1).toHaveText("고이코이");
});

test.describe("블로그 글 여정", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 한 번 만든 글을 여러 시나리오가 공유하므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  const slug = uniqueName(PREFIX, "한글글");
  const category = uniqueName(PREFIX, "cat");
  const tag = uniqueName(PREFIX, "tag");
  const detailPath = `/blog/${encodeURIComponent(slug)}`;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    try {
      await login(page);
      await createPost(page, {
        title: slug,
        slug,
        category,
        tags: [tag],
        published: true,
      });
    } finally {
      await context.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("목록 → 태그 필터 → 상세 → 뒤로 가기에도 필터가 유지된다", async ({
    page,
  }) => {
    await page.goto("/blog");
    await page
      .getByRole("link", { name: `#${tag}`, exact: true })
      .first()
      .click();

    await expect(page).toHaveURL(
      (url) => url.pathname === "/blog" && url.searchParams.get("tag") === tag,
    );
    await expect(page.getByText("현재 필터")).toBeVisible();
    await expect(page.getByText(`태그: #${tag}`)).toBeVisible();

    await page.getByRole("link", { name: slug, exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === detailPath);
    await expect(
      page.getByRole("heading", { level: 1, name: slug }),
    ).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/blog" && url.searchParams.get("tag") === tag,
    );
    await expect(page.getByText(`태그: #${tag}`)).toBeVisible();
    await expect(
      page.getByRole("link", { name: slug, exact: true }),
    ).toBeVisible();
  });

  test("상세 → 카테고리 필터 → 로고로 메인", async ({ page }) => {
    await page.goto(detailPath);
    await page
      .getByRole("article")
      .getByRole("link", { name: category, exact: true })
      .click();

    await expect(page).toHaveURL(
      (url) =>
        url.pathname === "/blog" &&
        url.searchParams.get("category") === category,
    );
    await expect(page.getByText(`카테고리: ${category}`)).toBeVisible();
    await expect(
      page.getByRole("link", { name: slug, exact: true }),
    ).toBeVisible();

    await page
      .getByRole("banner")
      .getByRole("link", { name: "hkoikoi.dev" })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "고이코이",
    );
  });
});
