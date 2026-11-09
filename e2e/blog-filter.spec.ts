import { expect, test, type Browser, type Page } from "@playwright/test";

import {
  BASE_URL,
  cleanup,
  confirmDelete,
  createPost,
  hasAdmin,
  login,
  rowOf,
} from "./fixtures/admin";

// 테스트가 만든 글은 모두 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-flt-";

// 다른 스펙·이전 실행과 겹치지 않도록 태그·카테고리를 실행마다 고유하게 만든다.
const STAMP = Date.now().toString(36);
const TAG_SHARED = `e2e-ft-shared-${STAMP}`;
const TAG_ONLY_A = `e2e-ft-a-${STAMP}`;
const TAG_ONLY_C = `e2e-ft-c-${STAMP}`;
const TAG_NEW = `e2e-ft-new-${STAMP}`;
const CAT_ONE = `e2e-fc-one-${STAMP}`;
const CAT_TWO = `e2e-fc-two-${STAMP}`;

interface Seed {
  title: string;
  category: string;
  tags: string[];
}

// A: CAT_ONE + [shared, a], B: CAT_TWO + [shared], C: CAT_ONE + [c]
const SEEDS: Seed[] = [
  {
    title: `${PREFIX}a-${STAMP}`,
    category: CAT_ONE,
    tags: [TAG_SHARED, TAG_ONLY_A],
  },
  { title: `${PREFIX}b-${STAMP}`, category: CAT_TWO, tags: [TAG_SHARED] },
  { title: `${PREFIX}c-${STAMP}`, category: CAT_ONE, tags: [TAG_ONLY_C] },
];
const [POST_A, POST_B, POST_C] = SEEDS;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function filterNav(page: Page) {
  return page.getByRole("navigation", { name: "글 탐색" });
}

// 칩의 접근성 이름은 "<이름>글 N개" 꼴이다(글 수는 sr-only).
function chip(page: Page, name: string, count?: number) {
  const suffix = count === undefined ? "\\d+" : String(count);
  return filterNav(page).getByRole("link", {
    name: new RegExp(`^#?${escapeRegExp(name)}\\s*글 ${suffix}개$`),
  });
}

// 글 수가 적은 태그는 '전체 태그' 접힘 안에 있으므로, 안 보이면 먼저 펼친다.
async function tagChip(page: Page, name: string, count?: number) {
  const link = chip(page, name, count);
  if (!(await link.isVisible())) {
    await filterNav(page)
      .getByText(/^전체 태그/)
      .click();
  }
  await expect(link).toBeVisible();
  return link;
}

function postLink(page: Page, seed: Seed) {
  return page.getByRole("link", { name: seed.title });
}

async function seedPosts(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await login(page);
    for (const seed of SEEDS) {
      await createPost(page, { ...seed, published: true });
    }
  } finally {
    await context.close();
  }
}

test.describe("블로그 태그·카테고리 필터", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 같은 DB를 공유하고 뒤 테스트가 앞 테스트의 시드 글을 쓰므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    await seedPosts(browser);
  });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("태그 칩을 누르면 ?tag=로 이동해 해당 글만 보이고 칩에 aria-current가 붙는다", async ({
    page,
  }) => {
    await page.goto("/blog");

    // 글 수가 칩에 함께 표시된다(shared는 A·B 두 글).
    const shared = await tagChip(page, TAG_SHARED, 2);
    await expect(shared).not.toHaveAttribute("aria-current", "true");
    await shared.click();

    await expect(page).toHaveURL(new RegExp(`/blog\\?tag=${TAG_SHARED}$`));
    await expect(postLink(page, POST_A)).toBeVisible();
    await expect(postLink(page, POST_B)).toBeVisible();
    await expect(postLink(page, POST_C)).toHaveCount(0);
    await expect(chip(page, TAG_SHARED)).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("태그 선택 상태에서 카테고리 칩은 AND로 좁히고, 선택 칩을 다시 누르면 그 조건만 해제된다", async ({
    page,
  }) => {
    await page.goto(`/blog?tag=${TAG_SHARED}`);

    await chip(page, CAT_ONE).click();
    await expect(page).toHaveURL(
      new RegExp(`/blog\\?category=${CAT_ONE}&tag=${TAG_SHARED}$`),
    );
    await expect(postLink(page, POST_A)).toBeVisible();
    await expect(postLink(page, POST_B)).toHaveCount(0);
    await expect(postLink(page, POST_C)).toHaveCount(0);
    await expect(chip(page, CAT_ONE)).toHaveAttribute("aria-current", "true");
    await expect(chip(page, TAG_SHARED)).toHaveAttribute(
      "aria-current",
      "true",
    );

    // 선택된 카테고리 칩을 다시 누르면 카테고리만 해제되고 태그는 유지된다.
    await chip(page, CAT_ONE).click();
    await expect(page).toHaveURL(new RegExp(`/blog\\?tag=${TAG_SHARED}$`));
    await expect(postLink(page, POST_A)).toBeVisible();
    await expect(postLink(page, POST_B)).toBeVisible();
    await expect(chip(page, CAT_ONE)).not.toHaveAttribute(
      "aria-current",
      "true",
    );

    // 남은 태그 칩을 다시 누르면 필터가 모두 풀린다.
    await chip(page, TAG_SHARED).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(postLink(page, POST_C)).toBeVisible();
  });

  test("카테고리와 태그가 맞지 않는 조합은 빈 목록 안내를 보여 준다", async ({
    page,
  }) => {
    await page.goto(`/blog?category=${CAT_TWO}&tag=${TAG_ONLY_A}`);

    await expect(page.getByText("조건에 맞는 글이 없습니다")).toBeVisible();
    await expect(page.getByRole("link", { name: "필터 해제" })).toBeVisible();
  });

  test("51자 태그 값은 오류 화면 없이 무시하고 전체 목록을 보여 준다", async ({
    page,
  }) => {
    const response = await page.goto(`/blog?tag=${"a".repeat(51)}`);

    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { level: 1, name: "블로그" }),
    ).toBeVisible();
    // 필터가 무시되므로 전체 목록이 보이고 현재 필터 표시와 빈 목록 안내는 없다.
    // 목록이 페이지로 나뉘어 병렬 스펙이 발행한 새 글에 시드 글이 2페이지로 밀릴 수 있으므로
    // 특정 시드 글 대신 글 카드가 있다는 것만 확인한다.
    await expect(
      page.locator('a[href^="/blog/"]:not([href^="/blog?"])').first(),
    ).toBeVisible();
    await expect(page.getByText("조건에 맞는 글이 없습니다")).toHaveCount(0);
    await expect(page.getByText("현재 필터")).toHaveCount(0);
  });

  test("새 태그로 발행하면 비로그인 /blog에 바로 보이고, 삭제하면 사라진다", async ({
    page,
    browser,
  }) => {
    const visitorContext = await browser.newContext({ baseURL: BASE_URL });
    const visitor = await visitorContext.newPage();
    const fresh: Seed = {
      title: `${PREFIX}new-${STAMP}`,
      category: CAT_ONE,
      tags: [TAG_NEW],
    };
    try {
      // 쿠키 없는 컨텍스트에서 캐시를 먼저 데운다.
      await visitor.goto("/blog");
      await expect(chip(visitor, TAG_NEW)).toHaveCount(0);

      await login(page);
      await createPost(page, { ...fresh, published: true });

      await visitor.reload();
      await expect(await tagChip(visitor, TAG_NEW, 1)).toBeVisible();

      await page.goto("/admin/posts");
      await confirmDelete(page, fresh.title);
      await expect(rowOf(page, fresh.title)).toHaveCount(0);

      // 글 수가 0이 된 태그는 목록에서 사라진다.
      await visitor.reload();
      // 목록이 다 그려진 뒤에 칩이 없음을 확인한다. 목록이 페이지로 나뉘어 병렬 스펙의 새 글에
      // 시드 글이 2페이지로 밀릴 수 있으므로 특정 시드 글 대신 필터 목록이 그려졌는지 기다린다.
      await expect(await tagChip(visitor, TAG_SHARED)).toBeVisible();
      await expect(chip(visitor, TAG_NEW)).toHaveCount(0);
    } finally {
      await visitorContext.close();
    }
  });
});
