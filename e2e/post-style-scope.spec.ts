import { expect, test } from "@playwright/test";

import {
  BASE_URL,
  cleanup,
  createPost,
  hasAdmin,
  login,
  uniqueName,
} from "./fixtures/admin";

const PREFIX = "e2e-scope-";

// 본문 <style>이 글 본문 래퍼 안에서만 적용되는지 공개 글 상세에서 확인한다.
// 공유 세션(login)만 쓰고 로그아웃하지 않으며, 이미지 업로드는 하지 않는다.
test.describe("본문 style 범위 한정", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("본문 규칙은 본문 요소에만 적용되고 사이트 클래스 규칙은 래퍼에 영향을 주지 않는다", async ({
    page,
    browser,
  }) => {
    const title = uniqueName(PREFIX, "box");
    await login(page);
    await createPost(page, {
      title,
      slug: title,
      published: true,
      content: [
        "<style>.post-box{color:red}.post-content{display:none}</style>",
        "",
        '<p class="post-box">빨간 글자</p>',
      ].join("\n"),
    });

    // 공개 화면은 비로그인 방문자로 확인한다.
    const visitor = await browser.newContext({ baseURL: BASE_URL });
    try {
      const publicPage = await visitor.newPage();
      await publicPage.goto(`/blog/${title}`);

      const wrapper = publicPage.locator("article .post-content");
      await expect(wrapper).toBeVisible();
      await expect(wrapper).toHaveClass(/post-scope-/);

      const box = wrapper.locator(".post-box");
      await expect(box).toBeVisible();
      await expect(box).toHaveCSS("color", "rgb(255, 0, 0)");
      await expect(wrapper).not.toHaveCSS("display", "none");
    } finally {
      await visitor.close();
    }
  });
});
