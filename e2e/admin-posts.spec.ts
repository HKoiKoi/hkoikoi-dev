import { expect, test, type Page } from "@playwright/test";

import {
  cleanup,
  confirmDelete,
  createPost,
  fillEditor,
  hasAdmin,
  login,
  rowOf,
  uniqueName,
} from "./fixtures/admin";

// 테스트가 만든 글은 모두 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-posts-";

test.describe("관리자 글 관리", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 같은 DB와 목록을 공유하므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("발행 저장 → 목록에 '발행' 배지 → /blog에 노출", async ({ page }) => {
    const title = uniqueName(PREFIX, "publish");
    await createPost(page, { title, slug: title, published: true });

    await expect(rowOf(page, title).getByText("발행")).toBeVisible();

    await page.goto("/blog");
    await expect(page.getByText(title).first()).toBeVisible();
  });

  test("초안 저장 → '초안' 배지 → /blog 미노출, 상세 URL은 not-found", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "draft");
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
    const title = uniqueName(PREFIX, "edit");
    const renamed = `${title}-renamed`;
    await createPost(page, { title, slug: title, published: true });

    await page.goto(`/blog/${title}`);
    const dateBefore = await page.locator("time").first().innerText();

    await page.goto("/admin/posts");
    await rowOf(page, title).getByRole("link", { name: "수정" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]+\/edit$/);
    await expect(page.getByLabel("제목")).toHaveValue(title);
    await page.getByLabel("제목").fill(renamed);
    await page.getByRole("button", { name: "수정하기", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);

    await expect(rowOf(page, renamed)).toBeVisible();
    // 수정 모드에서는 슬러그 자동 제안이 꺼져 있어 URL은 그대로다.
    await page.goto(`/blog/${title}`);
    await expect(
      page.getByRole("heading", { name: renamed }).first(),
    ).toBeVisible();
    await expect(page.locator("time").first()).toHaveText(dateBefore);
  });

  test("새 글 임시 저장 → 목록으로 가지 않고 방금 만든 글의 수정 화면에 머문다", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "draft-new");
    await page.goto("/admin/posts/new");
    await fillEditor(page, { title, slug: title, content: "임시 본문" });
    await page.getByRole("button", { name: "임시 저장", exact: true }).click();

    await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]+\/edit$/);
    await expect(page.getByLabel("제목")).toHaveValue(title);
    await expect(page.getByLabel("본문")).toHaveValue("임시 본문");
    // 같은 글을 다시 저장해도 새 글이 또 생기지 않고 수정으로 처리된다.
    await page.getByRole("button", { name: "임시 저장", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("임시 저장했습니다.");

    await page.goto("/admin/posts");
    await expect(rowOf(page, title)).toHaveCount(1);
    await expect(rowOf(page, title).getByText("초안")).toBeVisible();
  });

  test("수정 화면 임시 저장 → 그 자리에 머물고 입력값이 유지되며 초안이 된다", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "draft-edit");
    await createPost(page, { title, slug: title, published: true });

    await page.goto("/admin/posts");
    await rowOf(page, title).getByRole("link", { name: "수정" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]+\/edit$/);
    const editUrl = page.url();

    await page.getByLabel("본문").fill("수정한 임시 본문");
    await page.getByRole("button", { name: "임시 저장", exact: true }).click();

    await expect(page.getByRole("status")).toHaveText("임시 저장했습니다.");
    await expect(page).toHaveURL(editUrl);
    await expect(page.getByLabel("본문")).toHaveValue("수정한 임시 본문");

    await page.goto("/admin/posts");
    await expect(rowOf(page, title).getByText("초안")).toBeVisible();
    await page.goto(`/blog/${title}`);
    await expect(page.getByText("페이지를 찾을 수 없습니다")).toBeVisible();
  });

  test("삭제 확인 → 목록과 /blog에서 사라진다", async ({ page }) => {
    const title = uniqueName(PREFIX, "delete");
    await createPost(page, { title, slug: title, published: true });

    await confirmDelete(page, title);

    await expect(rowOf(page, title)).toHaveCount(0);
    await page.goto("/blog");
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test("삭제 취소 → 글이 유지된다", async ({ page }) => {
    const title = uniqueName(PREFIX, "cancel");
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
    const title = uniqueName(PREFIX, "dup");
    await createPost(page, { title, slug: title, published: false });

    await page.goto("/admin/posts/new");
    await fillEditor(page, {
      title: `${title}-second`,
      slug: title,
      excerpt: "유지되어야 하는 소개글",
      content: "유지되어야 하는 본문",
    });
    await page.getByRole("button", { name: "발행하기", exact: true }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "이미 사용 중인 슬러그입니다" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/posts\/new$/);
    await expect(page.getByLabel("제목")).toHaveValue(`${title}-second`);
    await expect(page.getByLabel("소개글")).toHaveValue(
      "유지되어야 하는 소개글",
    );
    await expect(page.getByLabel("본문")).toHaveValue("유지되어야 하는 본문");
  });

  test("제목 비움·소개글 151자 → 필드별 서버 검증 오류", async ({ page }) => {
    await page.goto("/admin/posts/new");
    await fillEditor(page, {
      title: "",
      slug: uniqueName(PREFIX, "invalid"),
      excerpt: "가".repeat(151),
    });
    await page.getByRole("button", { name: "발행하기", exact: true }).click();

    await expect(page).toHaveURL(/\/admin\/posts\/new$/);
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
  // 제목이 비었거나 다른 필드 하나가 검증에 걸리면 저장되지 않으므로 DB에 쓰지 않는다.
  // 제목이 유효한 경우에는 아래 케이스가 정확히 한 필드만 틀리게 만든다.
  const errorCases = [
    {
      name: "제목",
      id: "post-title",
      title: "",
      setup: async () => {},
    },
    {
      name: "URL",
      id: "post-slug",
      slug: "잘못된 슬러그!!",
      setup: async () => {},
    },
    {
      name: "카테고리",
      id: "post-category",
      setup: async (page: Page) => {
        await page.getByLabel("카테고리").fill("가".repeat(51));
      },
    },
    {
      name: "태그",
      id: "post-tags",
      setup: async (page: Page) => {
        await page
          .getByLabel("태그", { exact: true })
          .fill(Array.from({ length: 11 }, (_, i) => `t${i}`).join(", "));
      },
    },
    {
      name: "소개글",
      id: "post-excerpt",
      setup: async (page: Page) => {
        await page.getByLabel("소개글").fill("가".repeat(151));
      },
    },
    {
      name: "본문",
      id: "post-content",
      setup: async (page: Page) => {
        await page.getByLabel("본문").fill("a".repeat(100001));
      },
    },
    {
      name: "썸네일",
      id: "post-thumbnail",
      // 제목을 비워 두어 주입이 실패해도 저장되지 않게 한다. 그래서 첫 오류 입력은 제목이다.
      title: "",
      target: (page: Page) =>
        page.getByRole("button", { name: "썸네일 업로드" }),
      focus: (page: Page) => page.locator("#post-title"),
      setup: async (page: Page) => {
        // 업로드 없이 허용되지 않는 주소를 제출 시점의 FormData에 직접 넣는다.
        // hidden input 값은 React 재렌더로 되돌려질 수 있어 formdata 이벤트를 쓴다.
        await page.locator("form[novalidate]").evaluate((form) => {
          form.addEventListener("formdata", (event) => {
            (event as FormDataEvent).formData.set(
              "thumbnail_url",
              "https://example.com/x.png",
            );
          });
        });
      },
    },
  ];

  for (const c of errorCases) {
    test(`${c.name} 오류 → aria-describedby가 오류 요소를 가리키고 포커스가 그 입력으로 간다`, async ({
      page,
    }) => {
      const slug = uniqueName(PREFIX, "focus");
      await page.goto("/admin/posts/new");
      await fillEditor(page, {
        title: c.title ?? slug,
        slug: c.slug ?? slug,
      });
      await c.setup(page);
      await page.getByRole("button", { name: "발행하기", exact: true }).click();

      const errorId = `${c.id}-error`;
      await expect(page.locator(`#${errorId}`)).toBeVisible();
      await expect(page).toHaveURL(/\/admin\/posts\/new$/);
      const field = c.target ? c.target(page) : page.locator(`#${c.id}`);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(field).toHaveAttribute(
        "aria-describedby",
        new RegExp(`(^|\\s)${errorId}$`),
      );
      await expect(c.focus ? c.focus(page) : field).toBeFocused();
    });
  }

  test("빈 폼을 Enter로 제출하면 첫 오류 입력인 제목에 포커스가 간다", async ({
    page,
  }) => {
    await page.goto("/admin/posts/new");
    await page.getByLabel("제목").press("Enter");

    await expect(page.locator("#post-title-error")).toBeVisible();
    await expect(page.locator("#post-slug-error")).toBeVisible();
    await expect(page.getByLabel("제목")).toBeFocused();
  });
});
