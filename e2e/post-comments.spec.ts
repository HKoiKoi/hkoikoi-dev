import { expect, test, type Page } from "@playwright/test";

import { siteConfig } from "../lib/site-config";
import {
  BASE_URL,
  cleanup,
  createPost,
  hasAdmin,
  login,
  uniqueName,
} from "./fixtures/admin";

const PREFIX = "e2e-comments-";

// 실제 giscus에 연결하면 첫 댓글에서 GitHub Discussion이 만들어지므로 giscus.app 요청은 모두 가로챈다.
const GISCUS_HOST = "https://giscus.app/**";
const configured = Object.values(siteConfig.giscus).every(Boolean);

// 진짜 client.js처럼 스크립트 옆에 iframe.giscus-frame을 만든다.
// iframe은 about:blank라 origin이 달라 실제 메시지를 받을 수 없으므로 postMessage 호출만 기록한다.
const FAKE_CLIENT_JS = `
  const script = document.currentScript;
  const frame = document.createElement("iframe");
  frame.className = "giscus-frame";
  frame.title = "giscus";
  script.parentElement.appendChild(frame);
  window.__giscusInitialTheme = script.dataset.theme;
  window.__giscusMessages = [];
  frame.contentWindow.postMessage = (message, origin) => {
    window.__giscusMessages.push({ message, origin });
  };
`;

async function mockGiscus(page: Page) {
  await page.route(GISCUS_HOST, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      headers: { "access-control-allow-origin": "*" },
      body: FAKE_CLIENT_JS,
    }),
  );
}

// 댓글이 화면 밖에 있도록 본문을 길게 만든다.
const LONG_CONTENT = Array.from(
  { length: 120 },
  (_, i) => `단락 ${i + 1}: 댓글 영역을 화면 아래로 밀어내는 본문입니다.`,
).join("\n\n");

test.describe.configure({ mode: "serial" });

test.describe("글 댓글(giscus)", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  test.skip(!configured, "giscus 설정이 비어 있음");

  const title = uniqueName(PREFIX, "post");
  const path = `/blog/${title}`;

  test.use({ baseURL: BASE_URL, colorScheme: "light" });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("발행 글 생성", async ({ page }) => {
    await login(page);
    await createPost(page, {
      title,
      slug: title,
      published: true,
      content: LONG_CONTENT,
    });
  });

  test("스크롤하기 전에는 giscus를 불러오지 않고 댓글 영역이 가까워지면 불러온다", async ({
    page,
  }) => {
    await mockGiscus(page);
    const requested: string[] = [];
    page.on("request", (req) => {
      if (req.url().startsWith("https://giscus.app/")) {
        requested.push(req.url());
      }
    });

    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    const heading = page.getByRole("heading", { name: "댓글" });
    await expect(heading).toBeAttached();

    expect(requested).toEqual([]);
    await expect(page.locator("iframe.giscus-frame")).toHaveCount(0);

    await heading.scrollIntoViewIfNeeded();

    await expect(page.locator("iframe.giscus-frame")).toHaveCount(1);
    expect(requested).toEqual(["https://giscus.app/client.js"]);
    // 글 id로 매핑하는 설정이 스크립트에 실린다.
    const script = page.locator('script[src="https://giscus.app/client.js"]');
    await expect(script).toHaveAttribute("data-mapping", "specific");
    await expect(script).toHaveAttribute("data-term", /^[0-9a-f-]{36}$/);
    await expect(script).toHaveAttribute("data-theme", "light");
  });

  test("테마를 바꾸면 iframe에 giscus.app으로만 setConfig 메시지를 보낸다", async ({
    page,
  }) => {
    await mockGiscus(page);
    await page.goto(path);
    await page.getByRole("heading", { name: "댓글" }).scrollIntoViewIfNeeded();
    await expect(page.locator("iframe.giscus-frame")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => (window as never as Record<string, unknown>).__giscusInitialTheme,
      ),
    ).toBe("light");

    await page.getByRole("button", { name: "테마 변경" }).click();
    await page.getByRole("menuitemradio", { name: "다크" }).click();

    await expect
      .poll(() =>
        page.evaluate(
          () => (window as never as Record<string, unknown[]>).__giscusMessages,
        ),
      )
      .toContainEqual({
        message: { giscus: { setConfig: { theme: "dark" } } },
        origin: "https://giscus.app",
      });
    // 테마만 바뀐 것이라 스크립트를 다시 불러오지 않는다.
    await expect(
      page.locator('script[src="https://giscus.app/client.js"]'),
    ).toHaveCount(1);
  });

  test("giscus.app 요청이 막히면 안내 문구를 보여 주고 본문은 그대로다", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await page.route(GISCUS_HOST, (route) => route.abort());

    await page.goto(path);
    await page.getByRole("heading", { name: "댓글" }).scrollIntoViewIfNeeded();

    await expect(page.getByRole("status")).toContainText(
      "댓글을 불러오지 못했습니다",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByText("단락 120:")).toBeVisible();
    await expect(page.locator("iframe.giscus-frame")).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
});
