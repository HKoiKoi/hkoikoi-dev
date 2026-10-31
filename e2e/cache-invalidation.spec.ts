import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import {
  BASE_URL,
  cleanup,
  confirmDelete,
  createPost,
  hasAdmin,
  login,
  rowOf,
  uniqueName,
} from "./fixtures/admin";

// 테스트가 만든 글은 모두 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-cache-";

const NOT_FOUND = "페이지를 찾을 수 없습니다";

async function openEdit(page: Page, title: string) {
  await page.goto("/admin/posts");
  await rowOf(page, title).getByRole("link", { name: "수정" }).click();
  await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]+\/edit$/);
}

async function expectNotFound(visitor: Page, slug: string) {
  await visitor.goto(`/blog/${slug}`);
  await expect(visitor.getByText(NOT_FOUND)).toBeVisible();
}

test.describe("공개 캐시 무효화", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 같은 DB와 목록을 공유하므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  let visitorContext: BrowserContext;
  let visitor: Page;

  test.beforeEach(async ({ page, browser }) => {
    await login(page);
    // 로그인 쿠키가 없는 별도 컨텍스트로 캐시된 공개 화면을 본다.
    visitorContext = await browser.newContext({ baseURL: BASE_URL });
    visitor = await visitorContext.newPage();
  });

  test.afterEach(async () => {
    await visitorContext.close();
  });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("제목 수정 → 방문자의 /blog와 상세에 즉시 새 제목", async ({ page }) => {
    const title = uniqueName(PREFIX, "title");
    const renamed = `${title}-renamed`;
    await createPost(page, { title, slug: title, published: true });

    // 캐시를 데운다.
    await visitor.goto("/blog");
    await expect(visitor.getByText(title).first()).toBeVisible();
    await visitor.goto(`/blog/${title}`);
    await expect(
      visitor.getByRole("heading", { name: title }).first(),
    ).toBeVisible();

    await openEdit(page, title);
    await page.getByLabel("제목").fill(renamed);
    await page.getByRole("button", { name: "수정하기", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);

    await visitor.goto("/blog");
    await expect(visitor.getByText(renamed).first()).toBeVisible();
    await visitor.goto(`/blog/${title}`);
    await expect(
      visitor.getByRole("heading", { name: renamed }).first(),
    ).toBeVisible();
  });

  test("삭제 → 방문자 목록에서 사라지고 상세는 not-found", async ({ page }) => {
    const title = uniqueName(PREFIX, "delete");
    await createPost(page, { title, slug: title, published: true });

    await visitor.goto("/blog");
    await expect(visitor.getByText(title).first()).toBeVisible();
    await visitor.goto(`/blog/${title}`);
    await expect(
      visitor.getByRole("heading", { name: title }).first(),
    ).toBeVisible();

    await confirmDelete(page, title);

    await visitor.goto("/blog");
    await expect(visitor.getByText(title)).toHaveCount(0);
    await expectNotFound(visitor, title);
  });

  test("발행 → 초안 전환 → 방문자 상세는 즉시 not-found", async ({ page }) => {
    const title = uniqueName(PREFIX, "unpublish");
    await createPost(page, { title, slug: title, published: true });

    await visitor.goto(`/blog/${title}`);
    await expect(
      visitor.getByRole("heading", { name: title }).first(),
    ).toBeVisible();

    await openEdit(page, title);
    await page.getByRole("button", { name: "임시 저장", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("임시 저장했습니다.");

    await expectNotFound(visitor, title);
    await visitor.goto("/blog");
    await expect(visitor.getByText(title)).toHaveCount(0);
  });

  test("슬러그 변경 → 이전 슬러그는 not-found, 새 슬러그는 정상", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "slug");
    const newSlug = `${title}-new`;
    await createPost(page, { title, slug: title, published: true });

    await visitor.goto(`/blog/${title}`);
    await expect(
      visitor.getByRole("heading", { name: title }).first(),
    ).toBeVisible();

    await openEdit(page, title);
    await page.getByLabel("URL").fill(newSlug);
    await page.getByRole("button", { name: "수정하기", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);

    await expectNotFound(visitor, title);
    await visitor.goto(`/blog/${newSlug}`);
    await expect(
      visitor.getByRole("heading", { name: title }).first(),
    ).toBeVisible();
  });
});
