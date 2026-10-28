import { expect, type Browser, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "";
export const hasAdmin = Boolean(adminEmail && adminPassword);
export const BASE_URL = "http://localhost:3000";

export async function login(page: Page) {
  await page.goto("/auth/login");
  await page.getByLabel("이메일").fill(adminEmail);
  await page.getByLabel("비밀번호").fill(adminPassword);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/posts$/);
}

export function uniqueName(prefix: string, label: string) {
  return `${prefix}${label}-${Date.now().toString(36)}`;
}

export interface PostFields {
  title: string;
  slug?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  content?: string;
  published?: boolean;
}

export async function fillEditor(page: Page, fields: PostFields) {
  await page.getByLabel("제목").fill(fields.title);
  if (fields.slug !== undefined) await page.getByLabel("URL").fill(fields.slug);
  if (fields.excerpt !== undefined) {
    await page.getByLabel("소개글").fill(fields.excerpt);
  }
  if (fields.category !== undefined) {
    await page.getByLabel("카테고리").fill(fields.category);
  }
  if (fields.tags !== undefined) {
    await page.getByLabel("태그", { exact: true }).fill(fields.tags.join(", "));
  }
  await page.getByLabel("본문").fill(fields.content ?? "e2e 본문");
}

export async function createPost(page: Page, fields: PostFields) {
  await page.goto("/admin/posts/new");
  await fillEditor(page, fields);
  // 발행 여부는 어느 버튼으로 저장하느냐로 정해진다. 기본값은 초안이다.
  const button = fields.published ? "발행하기" : "임시 저장";
  await page.getByRole("button", { name: button, exact: true }).click();
  if (fields.published) {
    await expect(page).toHaveURL(/\/admin\/posts$/);
  } else {
    // 임시 저장은 방금 만든 글의 수정 화면에 머문다. 목록 검증을 위해 직접 이동한다.
    await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]+\/edit$/);
    await page.goto("/admin/posts");
  }
}

export function rowOf(page: Page, title: string) {
  return page.getByRole("row").filter({ hasText: title });
}

export async function confirmDelete(page: Page, title: string) {
  await page.getByRole("button", { name: `${title} 삭제` }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "삭제", exact: true })
    .click();
  // 모달이 열려 있는 동안은 뒤쪽 표가 aria-hidden이라 row 단언이 액션 완료 전에 통과한다.
  // Server Action이 끝나야 닫히므로 닫힘을 기다려 삭제 완료를 보장한다.
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

// 접두가 같은 글을 UI로 모두 지운다. 테스트 실패로 남은 글도 함께 정리한다.
export async function cleanup(browser: Browser, prefix: string) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await login(page);
    // Suspense가 풀려 목록(표 또는 빈 안내)이 그려진 뒤에 개수를 센다.
    await expect(
      page.getByRole("table").or(page.getByText("작성된 글이 없습니다.")),
    ).toBeVisible();
    const rows = page.getByRole("row").filter({ hasText: prefix });
    while ((await rows.count()) > 0) {
      const title = (
        await rows.first().getByRole("rowheader").innerText()
      ).trim();
      await confirmDelete(page, title);
      await expect(rowOf(page, title)).toHaveCount(0);
    }
  } finally {
    await context.close();
  }
}
