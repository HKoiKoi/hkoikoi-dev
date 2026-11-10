import { expect, test, type Page } from "@playwright/test";

import {
  cleanup,
  confirmDelete,
  createPost,
  hasAdmin,
  login,
  rowOf,
  uniqueName,
} from "./fixtures/admin";

// 테스트가 만든 글은 모두 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-seo-";

// 스트리밍으로 같은 태그가 두 번 나올 수 있어 첫 번째가 아니라 전체 값을 모아 본다.
async function robotsContents(page: Page) {
  return page
    .locator('meta[name="robots"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("content") ?? ""));
}

test.describe("SEO (공개, 시크릿 불필요)", () => {
  test("robots.txt는 /admin·/auth를 막고 sitemap 절대 URL을 알린다", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /auth");
    expect(body).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
  });

  test("sitemap.xml에 고정 페이지 10개가 절대 URL로 있다", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => new URL(m[1]).pathname,
    );
    for (const path of [
      "/",
      "/education",
      "/career",
      "/certifications",
      "/languages",
      "/volunteer",
      "/activities",
      "/projects",
      "/publications",
      "/blog",
    ]) {
      expect(locs).toContain(path);
    }
  });

  test("/feed.xml은 200과 application/rss+xml로 응답하는 RSS 2.0이다", async ({
    request,
  }) => {
    const res = await request.get("/feed.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/rss+xml");
    const body = await res.text();
    expect(body).toContain('<rss version="2.0"');
    expect(body).toMatch(/<atom:link [^>]*href="https?:\/\/[^"]+\/feed\.xml"/);
  });

  test("홈 head에 RSS 자동 발견 링크가 있다", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('link[rel="alternate"][type="application/rss+xml"]').first(),
    ).toHaveAttribute("href", /\/feed\.xml$/);
  });

  for (const path of ["/auth/login", "/auth/error"]) {
    test(`${path}는 noindex, nofollow다`, async ({ page }) => {
      await page.goto(path);
      expect(await robotsContents(page)).toContain("noindex, nofollow");
    });
  }

  test("없는 글은 noindex다(soft 404: 상태 코드는 200)", async ({ page }) => {
    const res = await page.goto(`/blog/${encodeURIComponent("없는-글")}`);
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
    ).toBeVisible();
    expect((await robotsContents(page)).join(",")).toContain("noindex");
  });
});

test.describe("SEO (발행 글, 관리자 계정 필요)", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 같은 DB와 목록을 공유하므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("발행 글: title·description·기본 og:image, sitemap에는 있고 초안은 없다", async ({
    page,
    request,
  }) => {
    await login(page);
    const published = uniqueName(PREFIX, "pub");
    const draft = uniqueName(PREFIX, "draft");
    const excerpt = "SEO 메타데이터 확인용 소개글";
    await createPost(page, {
      title: published,
      slug: published,
      excerpt,
      published: true,
    });
    await createPost(page, { title: draft, slug: draft, published: false });

    await page.context().clearCookies();
    await page.goto(`/blog/${published}`);
    await expect(
      page.getByRole("heading", { name: published }).first(),
    ).toBeVisible();
    await expect(page).toHaveTitle(`${published} | hkoikoi.dev`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      excerpt,
    );
    // 썸네일이 없으면 기본 OG 이미지(파일 기반 이미지는 상속되지 않아 명시한다)를 쓴다.
    await expect(
      page.locator('meta[property="og:image"]').first(),
    ).toHaveAttribute("content", /^https?:\/\/.+\/opengraph-image\.png/);
    // 발행 글은 색인 가능해야 한다.
    expect((await robotsContents(page)).join(",")).not.toContain("noindex");

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`/blog/${encodeURIComponent(published)}`);
    expect(sitemap).not.toContain(encodeURIComponent(draft));
  });

  test("한글 슬러그 글: sitemap loc이 퍼센트 인코딩되고 그 URL로 열린다", async ({
    page,
    request,
  }) => {
    await login(page);
    const title = uniqueName(PREFIX, "한글");
    await createPost(page, { title, slug: title, published: true });

    const encoded = encodeURIComponent(title);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const loc = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1])
      .find((url) => url.endsWith(`/blog/${encoded}`));
    expect(loc).toBeTruthy();
    expect(loc).not.toMatch(/[^\x00-\x7F]/);

    await page.context().clearCookies();
    await page.goto(new URL(loc!).pathname);
    await expect(
      page.getByRole("heading", { name: title }).first(),
    ).toBeVisible();
  });

  test("feed.xml: 발행 글은 포함·초안은 제외, 한글 슬러그 link로 열리고 삭제 직후 빠진다", async ({
    page,
    request,
  }) => {
    await login(page);
    const published = uniqueName(PREFIX, "피드");
    const draft = uniqueName(PREFIX, "feeddraft");
    await createPost(page, {
      title: published,
      slug: published,
      excerpt: "피드 확인용 소개글",
      published: true,
    });
    await createPost(page, { title: draft, slug: draft, published: false });

    const feed = await (await request.get("/feed.xml")).text();
    expect(feed).toContain(published);
    expect(feed).not.toContain(draft);
    const link = [...feed.matchAll(/<link>([^<]+)<\/link>/g)]
      .map((m) => m[1])
      .find((url) => url.endsWith(`/blog/${encodeURIComponent(published)}`));
    expect(link).toBeTruthy();
    expect(link).not.toMatch(/[^\x00-\x7F]/);

    // 공개 방문자로 item link 경로를 연다.
    const visitor = await page.context().browser()!.newContext();
    const visitorPage = await visitor.newPage();
    await visitorPage.goto(new URL(link!, "http://localhost:3000").pathname);
    await expect(
      visitorPage.getByRole("heading", { name: published }).first(),
    ).toBeVisible();
    await visitor.close();

    await page.goto("/admin/posts");
    await confirmDelete(page, published);
    await expect(rowOf(page, published)).toHaveCount(0);

    const after = await (await request.get("/feed.xml")).text();
    expect(after).not.toContain(published);
  });
});
