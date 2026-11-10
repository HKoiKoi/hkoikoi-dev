import { expect, test, type Page } from "@playwright/test";

import {
  cleanup,
  createPost,
  fillEditor,
  hasAdmin,
  login,
  rowOf,
  uniqueName,
} from "./fixtures/admin";

// 테스트가 만든 글은 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-auto-";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const OBJECT_URL_PATTERN = /\/storage\/v1\/object\/blog-images\//;
const EDIT_URL = /\/admin\/posts\/[0-9a-f-]+\/edit$/;
const SAVED = /자동 저장됨 \d{2}:\d{2}/;

// 하이드레이션 전에 입력하면 이벤트가 유실되므로 본문 textarea에 React props가 붙을 때까지 기다린다.
async function waitForEditorHydrated(page: Page) {
  await page.waitForFunction(() => {
    const el = document.getElementById("post-content");
    return (
      el !== null &&
      Object.keys(el).some((key) => key.startsWith("__reactProps$"))
    );
  });
}

// 새 글을 임시 저장해 수정 화면에 머문 상태로 만든다.
async function createDraftAndStay(page: Page, label: string, content: string) {
  const title = uniqueName(PREFIX, label);
  await page.goto("/admin/posts/new");
  await waitForEditorHydrated(page);
  await fillEditor(page, { title, slug: title, content });
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(page).toHaveURL(EDIT_URL);
  // 클라이언트 전환 뒤에는 이전 라우트(새 글)의 숨겨진 편집기가 DOM에 남아 같은 id가 둘이 된다.
  // 전체 로드로 한 화면만 남긴다.
  const url = page.url();
  await page.goto(url);
  await waitForEditorHydrated(page);
  return { title, url };
}

// 자동 저장·수동 저장이 쓰는 Server Action POST만 센다.
function countServerActions(page: Page) {
  const counter = { value: 0 };
  page.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"]) {
      counter.value += 1;
    }
  });
  return counter;
}

function isServerAction(request: { method(): string; headers(): object }) {
  return (
    request.method() === "POST" &&
    Boolean((request.headers() as Record<string, string>)["next-action"])
  );
}

test.describe("관리자 편집기 자동 저장", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 같은 DB를 공유하므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    // 저장하지 않은 변경이 있을 때의 beforeunload 확인은 이탈로 처리한다.
    page.on("dialog", (dialog) => void dialog.accept());
    await login(page);
  });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("기존 초안에서 본문 입력 후 대기 → 자동 저장됨 표시, 새로고침 뒤에도 유지", async ({
    page,
  }) => {
    await createDraftAndStay(page, "draft", "처음 본문");

    await page.getByLabel("본문").fill("자동 저장된 본문");
    await expect(page.getByText(SAVED)).toBeVisible({ timeout: 8000 });

    await page.reload();
    await waitForEditorHydrated(page);
    await expect(page.getByLabel("본문")).toHaveValue("자동 저장된 본문");
    await expect(page.getByText("저장하지 않은 변경이 있습니다.")).toHaveCount(
      0,
    );
  });

  test("새 글 입력 후 새로고침 → 복원 배너, 복원하면 입력값이 돌아오고 DB 행은 생기지 않는다", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "new");
    const requests = countServerActions(page);
    await page.goto("/admin/posts/new");
    await waitForEditorHydrated(page);
    await fillEditor(page, { title, slug: title, content: "복원할 본문" });
    await expect(page.getByText("로컬에 보관됨")).toBeVisible({
      timeout: 8000,
    });

    await page.reload();
    await waitForEditorHydrated(page);
    await expect(
      page.getByText("저장하지 않은 변경이 있습니다."),
    ).toBeVisible();
    await expect(page.getByLabel("제목")).toHaveValue("");

    await page.getByRole("button", { name: "복원", exact: true }).click();
    await expect(page.getByLabel("제목")).toHaveValue(title);
    await expect(page.getByLabel("본문")).toHaveValue("복원할 본문");
    await expect(page.getByText("저장하지 않은 변경이 있습니다.")).toHaveCount(
      0,
    );

    // 새 글은 서버로 보내지 않는다.
    expect(requests.value).toBe(0);
    await page.goto("/admin/posts");
    await expect(rowOf(page, title)).toHaveCount(0);
  });

  test("복원 배너에서 버리기 → 입력은 비어 있고 배너가 사라진다", async ({
    page,
  }) => {
    await page.goto("/admin/posts/new");
    await waitForEditorHydrated(page);
    await page.getByLabel("본문").fill("버릴 본문");
    await expect(page.getByText("로컬에 보관됨")).toBeVisible({
      timeout: 8000,
    });

    await page.reload();
    await waitForEditorHydrated(page);
    await page.getByRole("button", { name: "버리기", exact: true }).click();
    await expect(page.getByText("저장하지 않은 변경이 있습니다.")).toHaveCount(
      0,
    );
    await expect(page.getByLabel("본문")).toHaveValue("");

    await page.reload();
    await waitForEditorHydrated(page);
    await expect(page.getByText("저장하지 않은 변경이 있습니다.")).toHaveCount(
      0,
    );
  });

  test("발행 글 본문 수정 후 대기 → 서버 저장 없이 로컬에 보관, 공개 내용·발행 상태 그대로", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "published");
    await createPost(page, {
      title,
      slug: title,
      content: "공개 원문",
      published: true,
    });
    await page.goto("/admin/posts");
    await rowOf(page, title).getByRole("link", { name: "수정" }).click();
    await expect(page).toHaveURL(EDIT_URL);
    await waitForEditorHydrated(page);

    const requests = countServerActions(page);
    await page.getByLabel("본문").fill("로컬에만 있는 수정");
    await expect(page.getByText("로컬에 보관됨")).toBeVisible({
      timeout: 8000,
    });
    // 저장 지연(2초)보다 충분히 기다린 뒤에도 서버 호출이 없어야 한다.
    await page.waitForTimeout(3000);
    expect(requests.value).toBe(0);

    await page.goto(`/blog/${title}`);
    await expect(page.getByText("공개 원문")).toBeVisible();
    await expect(page.getByText("로컬에만 있는 수정")).toHaveCount(0);
    await page.goto("/admin/posts");
    await expect(rowOf(page, title).getByText("초안")).toHaveCount(0);
  });

  test("저장 요청이 실패 → 저장 실패 표시와 입력 유지, 다음 입력에서 재시도", async ({
    page,
  }) => {
    const { url } = await createDraftAndStay(page, "fail", "처음 본문");

    await page.route(url, (route) =>
      isServerAction(route.request()) ? route.abort() : route.continue(),
    );
    await page.getByLabel("본문").fill("실패할 본문");
    await expect(page.getByText("저장 실패")).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel("본문")).toHaveValue("실패할 본문");

    await page.unroute(url);
    await page.getByLabel("본문").fill("재시도한 본문");
    await expect(page.getByText(SAVED)).toBeVisible({ timeout: 8000 });

    await page.reload();
    await waitForEditorHydrated(page);
    await expect(page.getByLabel("본문")).toHaveValue("재시도한 본문");
  });

  test("이미지 업로드 진행 중에는 자동 저장 보류, 끝난 뒤 저장되고 자리표시 텍스트는 저장되지 않는다", async ({
    page,
  }) => {
    await createDraftAndStay(page, "upload", "처음 본문");
    const requests = countServerActions(page);

    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    // 요청을 붙잡았다가 중단한다(스토리지에 객체를 남기지 않는다).
    await page.route(OBJECT_URL_PATTERN, async (route) => {
      await held;
      await route.abort();
    });

    await page.getByLabel("본문").fill("업로드 전 본문");
    await page.getByTestId("image-upload-input").setInputFiles({
      name: "slow.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expect(page.getByText(/이미지 업로드 중/)).toBeVisible();

    await page.waitForTimeout(3000);
    expect(requests.value).toBe(0);
    await expect(page.getByText(SAVED)).toHaveCount(0);

    release();
    await expect(page.getByText(/이미지 업로드 중/)).toHaveCount(0);
    await expect(page.getByText(SAVED)).toBeVisible({ timeout: 8000 });

    await page.reload();
    await waitForEditorHydrated(page);
    await expect(page.getByLabel("본문")).toHaveValue("업로드 전 본문");
    await expect(page.getByLabel("본문")).not.toHaveValue(/업로드 중/);
  });

  test("두 탭에서 같은 초안을 편집 → 늦게 저장한 탭에 충돌 알림, 먼저 저장한 내용은 덮어쓰지 않는다", async ({
    page,
    context,
  }) => {
    const { url } = await createDraftAndStay(page, "conflict", "처음 본문");

    const other = await context.newPage();
    other.on("dialog", (dialog) => void dialog.accept());
    await other.goto(url);
    await waitForEditorHydrated(other);

    await page.getByLabel("본문").fill("먼저 저장한 본문");
    await expect(page.getByText(SAVED)).toBeVisible({ timeout: 8000 });

    await other.getByLabel("본문").fill("늦게 저장한 본문");
    await expect(
      other.getByText("다른 곳에서 수정되어 자동 저장을 멈췄습니다"),
    ).toBeVisible({ timeout: 8000 });
    await other.close();

    await page.reload();
    await waitForEditorHydrated(page);
    await expect(page.getByLabel("본문")).toHaveValue("먼저 저장한 본문");
  });
});
