import { expect, test, type Browser, type Page } from "@playwright/test";

import {
  BASE_URL,
  cleanup,
  createPost,
  hasAdmin,
  login,
  rowOf,
  uniqueName,
} from "./fixtures/admin";

// 테스트가 만든 글은 모두 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-nav-";

interface Seed {
  title: string;
  slug: string;
}

async function openEdit(page: Page, title: string) {
  await page.goto("/admin/posts");
  await rowOf(page, title).getByRole("link", { name: "수정" }).click();
  await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]+\/edit$/);
}

function pager(page: Page) {
  return page.getByRole("navigation", { name: "이전·다음 글" });
}

function prevLink(page: Page) {
  return pager(page).getByRole("link", { name: /이전 글/ });
}

function nextLink(page: Page) {
  return pager(page).getByRole("link", { name: /다음 글/ });
}

function hrefOf(seed: Seed) {
  return `/blog/${encodeURIComponent(seed.slug)}`;
}

test.describe("이전·다음 글 내비게이션", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 같은 DB를 공유하고 앞 테스트가 만든 글을 뒤 테스트가 고치므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  // 발행 시각은 저장 시점으로 정해지므로 oldest → middle → newest 순으로 발행한다.
  // middle의 슬러그가 아닌 oldest의 슬러그를 한글로 해서 한글 슬러그 링크도 확인한다.
  let oldest: Seed;
  let middle: Seed;
  let newest: Seed;

  // middle 상세에서 이전이 oldest, 다음이 newest인지 본다(테스트가 보는 인접 관계 그대로).
  // 다른 스펙이 병렬로 발행한 글이 시드 사이에 끼면 이 관계가 깨지므로 그때는 다시 만든다.
  // 목록 1페이지에는 의존하지 않는다(다른 글이 많으면 시드가 밀려난다).
  async function seedsAreConsecutive(page: Page) {
    await page.goto(hrefOf(middle));
    try {
      await expect(prevLink(page)).toHaveAttribute("href", hrefOf(oldest), {
        timeout: 3_000,
      });
      await expect(nextLink(page)).toHaveAttribute("href", hrefOf(newest), {
        timeout: 3_000,
      });
      return true;
    } catch {
      return false;
    }
  }

  async function seedPosts(browser: Browser) {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    try {
      await login(page);
      for (let attempt = 1; attempt <= 5; attempt++) {
        const make = (label: string, slug?: string): Seed => {
          const title = uniqueName(PREFIX, label);
          return { title, slug: slug ?? title };
        };
        const stamp = Date.now().toString(36);
        oldest = make("oldest", `${PREFIX}한글-${stamp}`);
        middle = make("middle");
        newest = make("newest");
        for (const seed of [oldest, middle, newest]) {
          await createPost(page, { ...seed, published: true });
        }
        if (await seedsAreConsecutive(page)) return;
        await cleanup(browser, PREFIX);
      }
      throw new Error("시드 글이 연달아 놓이지 않았다(다른 발행과 겹침)");
    } finally {
      await context.close();
    }
  }

  test.beforeAll(async ({ browser }) => {
    // 글 3개 발행을 겹침 때마다 반복하므로 병렬 부하에서는 기본 30초를 넘길 수 있다.
    test.setTimeout(120_000);
    await seedPosts(browser);
  });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("가운데 글: 이전은 더 오래된 글, 다음은 더 최근 글이고 클릭하면 이동한다", async ({
    page,
  }) => {
    await page.goto(hrefOf(middle));

    await expect(prevLink(page)).toContainText(oldest.title);
    await expect(prevLink(page)).toHaveAttribute("href", hrefOf(oldest));
    await expect(nextLink(page)).toContainText(newest.title);
    await expect(nextLink(page)).toHaveAttribute("href", hrefOf(newest));

    await nextLink(page).click();
    await expect(page).toHaveURL(new RegExp(`${hrefOf(newest)}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: newest.title }),
    ).toBeVisible();
  });

  test("한글 슬러그를 가진 인접 글 링크를 클릭하면 상세가 열린다", async ({
    page,
  }) => {
    await page.goto(hrefOf(middle));

    await prevLink(page).click();
    await expect(page).toHaveURL(new RegExp(`${hrefOf(oldest)}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: oldest.title }),
    ).toBeVisible();
  });

  test("가장 최근·가장 오래된 시드 글의 바깥쪽 링크는 시드 글이 아니다", async ({
    page,
  }) => {
    await page.goto(hrefOf(newest));
    await expect(pager(page)).toBeVisible();
    await expect(prevLink(page)).toContainText(middle.title);
    // 병렬로 도는 다른 스펙이 이 사이에 글을 발행하면 더 최근 글이 생길 수 있어
    // 다음 글이 없음을 단정하지 않고, 있다면 시드 글이 아님만 확인한다.
    const next = nextLink(page);
    if ((await next.count()) > 0) {
      await expect(next).not.toContainText(PREFIX);
    }

    // DB에 실제 글이 있으면 시드 글 중 가장 오래된 글도 더 오래된 실제 글을 이전으로 갖는다.
    // 그래서 이전 글이 없음을 단정하지 않고, 있다면 시드 글이 아님만 확인한다.
    await page.goto(hrefOf(oldest));
    await expect(nextLink(page)).toContainText(middle.title);
    const prev = prevLink(page);
    if ((await prev.count()) > 0) {
      await expect(prev).not.toContainText(PREFIX);
      expect(await prev.getAttribute("href")).not.toContain(PREFIX);
    }
  });

  test("인접 글 제목을 수정하면 방문자 상세에 새 제목이 보인다", async ({
    page,
    browser,
  }) => {
    // 쿠키 없는 컨텍스트에서 캐시를 먼저 데운다.
    const visitorContext = await browser.newContext({ baseURL: BASE_URL });
    const visitor = await visitorContext.newPage();
    try {
      await visitor.goto(hrefOf(newest));
      await expect(prevLink(visitor)).toContainText(middle.title);

      await login(page);
      const renamed = `${middle.title}-renamed`;
      await openEdit(page, middle.title);
      await page.getByLabel("제목").fill(renamed);
      await page.getByRole("button", { name: "수정하기", exact: true }).click();
      await expect(page).toHaveURL(/\/admin\/posts$/);
      middle = { ...middle, title: renamed };

      await visitor.reload();
      await expect(prevLink(visitor)).toContainText(renamed);
    } finally {
      await visitorContext.close();
    }
  });

  test("인접 글을 초안으로 바꾸면 초안을 건너뛰고 그다음 발행 글을 보여 준다", async ({
    page,
    browser,
  }) => {
    const visitorContext = await browser.newContext({ baseURL: BASE_URL });
    const visitor = await visitorContext.newPage();
    try {
      await visitor.goto(hrefOf(newest));
      await expect(prevLink(visitor)).toContainText(middle.title);

      await login(page);
      await openEdit(page, middle.title);
      await page
        .getByRole("button", { name: "임시 저장", exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveText("임시 저장했습니다.");

      await visitor.reload();
      await expect(prevLink(visitor)).toContainText(oldest.title);
      await expect(prevLink(visitor)).toHaveAttribute("href", hrefOf(oldest));

      await visitor.goto(hrefOf(oldest));
      await expect(nextLink(visitor)).toContainText(newest.title);
    } finally {
      await visitorContext.close();
    }
  });
});
