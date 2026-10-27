import { expect, test, type Browser, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "";
const BASE_URL = "http://localhost:3000";
// 테스트가 만든 글은 모두 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-";

async function login(page: Page) {
  await page.goto("/auth/login");
  await page.getByLabel("이메일").fill(adminEmail);
  await page.getByLabel("비밀번호").fill(adminPassword);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/posts$/);
}

function uniqueName(label: string) {
  return `${PREFIX}${label}-${Date.now().toString(36)}`;
}

interface PostFields {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  published?: boolean;
}

async function fillEditor(page: Page, fields: PostFields) {
  await page.getByLabel("제목").fill(fields.title);
  if (fields.slug !== undefined) await page.getByLabel("URL").fill(fields.slug);
  if (fields.excerpt !== undefined) {
    await page.getByLabel("소개글").fill(fields.excerpt);
  }
  await page.getByLabel("본문").fill(fields.content ?? "e2e 본문");
  const checkbox = page.getByRole("checkbox", { name: "발행" });
  if (fields.published !== undefined) {
    if ((await checkbox.isChecked()) !== fields.published) {
      await checkbox.click();
    }
  }
}

async function createPost(page: Page, fields: PostFields) {
  await page.goto("/admin/posts/edit");
  await fillEditor(page, fields);
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/posts$/);
}

function rowOf(page: Page, title: string) {
  return page.getByRole("row").filter({ hasText: title });
}

async function confirmDelete(page: Page, title: string) {
  await page.getByRole("button", { name: `${title} 삭제` }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "삭제", exact: true })
    .click();
}

// 접두가 같은 글을 UI로 모두 지운다. 테스트 실패로 남은 글도 함께 정리한다.
async function cleanup(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await login(page);
    // Suspense가 풀려 목록(표 또는 빈 안내)이 그려진 뒤에 개수를 센다.
    await expect(
      page.getByRole("table").or(page.getByText("작성된 글이 없습니다.")),
    ).toBeVisible();
    const rows = page.getByRole("row").filter({ hasText: PREFIX });
    while ((await rows.count()) > 0) {
      const title = (
        await rows.first().getByRole("rowheader").innerText()
      ).trim();
      await confirmDelete(page, title);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(rowOf(page, title)).toHaveCount(0);
    }
  } finally {
    await context.close();
  }
}

test.describe("관리자 글 관리", () => {
  test.skip(!adminEmail || !adminPassword, "관리자 자격 증명 없음");
  // 같은 DB와 목록을 공유하므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser);
  });

  test("발행 저장 → 목록에 '발행' 배지 → /blog에 노출", async ({ page }) => {
    const title = uniqueName("publish");
    await createPost(page, { title, slug: title, published: true });

    await expect(rowOf(page, title).getByText("발행")).toBeVisible();

    await page.goto("/blog");
    await expect(page.getByText(title).first()).toBeVisible();
  });

  test("초안 저장 → '초안' 배지 → /blog 미노출, 상세 URL은 not-found", async ({
    page,
  }) => {
    const title = uniqueName("draft");
    await createPost(page, { title, slug: title, published: false });

    await expect(rowOf(page, title).getByText("초안")).toBeVisible();

    await page.goto("/blog");
    await expect(page.getByText(title)).toHaveCount(0);

    await page.goto(`/blog/${title}`);
    await expect(
      page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
    ).toBeVisible();
  });

  test("수정하면 제목이 바뀌고 발행일은 유지된다", async ({ page }) => {
    const title = uniqueName("edit");
    const renamed = `${title}-renamed`;
    await createPost(page, { title, slug: title, published: true });

    await page.goto(`/blog/${title}`);
    const dateBefore = await page.locator("time").first().innerText();

    await page.goto("/admin/posts");
    await rowOf(page, title).getByRole("link", { name: "수정" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/edit\?id=/);
    await expect(page.getByLabel("제목")).toHaveValue(title);
    await page.getByLabel("제목").fill(renamed);
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);

    await expect(rowOf(page, renamed)).toBeVisible();
    // 수정 모드에서는 슬러그 자동 제안이 꺼져 있어 URL은 그대로다.
    await page.goto(`/blog/${title}`);
    await expect(
      page.getByRole("heading", { name: renamed }).first(),
    ).toBeVisible();
    await expect(page.locator("time").first()).toHaveText(dateBefore);
  });

  test("삭제 확인 → 목록과 /blog에서 사라진다", async ({ page }) => {
    const title = uniqueName("delete");
    await createPost(page, { title, slug: title, published: true });

    await confirmDelete(page, title);

    await expect(rowOf(page, title)).toHaveCount(0);
    await page.goto("/blog");
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test("삭제 취소 → 글이 유지된다", async ({ page }) => {
    const title = uniqueName("cancel");
    await createPost(page, { title, slug: title, published: false });

    await page.getByRole("button", { name: `${title} 삭제` }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "취소", exact: true })
      .click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(rowOf(page, title)).toBeVisible();
  });

  test("중복 슬러그 → 슬러그 필드 오류가 보이고 다른 입력값은 유지된다", async ({
    page,
  }) => {
    const title = uniqueName("dup");
    await createPost(page, { title, slug: title, published: false });

    await page.goto("/admin/posts/edit");
    await fillEditor(page, {
      title: `${title}-second`,
      slug: title,
      excerpt: "유지되어야 하는 소개글",
      content: "유지되어야 하는 본문",
    });
    await page.getByRole("button", { name: "저장", exact: true }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "이미 사용 중인 슬러그입니다" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/posts\/edit$/);
    await expect(page.getByLabel("제목")).toHaveValue(`${title}-second`);
    await expect(page.getByLabel("소개글")).toHaveValue(
      "유지되어야 하는 소개글",
    );
    await expect(page.getByLabel("본문")).toHaveValue("유지되어야 하는 본문");
  });

  test("제목 비움·소개글 151자 → 필드별 서버 검증 오류", async ({ page }) => {
    await page.goto("/admin/posts/edit");
    await fillEditor(page, {
      title: "",
      slug: uniqueName("invalid"),
      excerpt: "가".repeat(151),
    });
    await page.getByRole("button", { name: "저장", exact: true }).click();

    await expect(page).toHaveURL(/\/admin\/posts\/edit$/);
    await expect(page.getByLabel("제목")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel("소개글")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.locator("#post-title-error")).toBeVisible();
    await expect(page.locator("#post-excerpt-error")).toBeVisible();
  });
});
