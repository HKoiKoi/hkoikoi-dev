import { expect, test } from "@playwright/test";

import {
  cleanup,
  fillEditor,
  hasAdmin,
  login,
  uniqueName,
} from "./fixtures/admin";

// 테스트가 만든 글은 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-storage-";

// 1x1 투명 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

const IMAGE_PATH = /\d{4}\/\d{2}\/[0-9a-f-]{36}\.png/;

test.describe("비로그인의 스토리지 관리 접근", () => {
  test("/admin/storage 에 접근하면 /auth/login 으로 이동한다", async ({
    page,
  }) => {
    await page.goto("/admin/storage");

    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});

// 운영 DB·스토리지를 쓰는 테스트라 이미지를 실제로 삭제하는 시나리오는 두지 않는다.
// 선택 삭제는 후보가 있을 때 선택·확인 대화상자까지만 확인하고 취소한다.
// 실제 삭제와 경합 재검사는 수동으로 확인한다(ROADMAP Task 029 결과).
test.describe("관리자 스토리지 관리", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  test.describe.configure({ mode: "serial" });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("목록 또는 빈 상태가 표시된다", async ({ page }) => {
    await login(page);
    await page.goto("/admin/storage");

    await expect(
      page.getByRole("heading", { name: "스토리지", level: 1 }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("table", { name: "미사용 이미지 후보 목록" })
        .or(page.getByText("삭제할 수 있는 미사용 이미지가 없습니다.")),
    ).toBeVisible();
    // 조회 실패 경고는 role=alert지만 Next 라우트 안내자도 alert라서 문구로 확인한다.
    await expect(
      page.getByText("안전을 위해 목록을 표시하지 않습니다."),
    ).toHaveCount(0);
  });

  test("글이 참조하는 방금 올린 이미지는 후보에 나오지 않는다", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin/posts/new");
    // 하이드레이션 전 파일 지정은 change 이벤트가 유실되므로 입력 반영을 먼저 확인한다.
    const title = uniqueName(PREFIX, "ref");
    await page.getByLabel("제목").fill(title);
    await expect(page.getByLabel("제목")).toHaveValue(title);

    await page.getByTestId("image-upload-input").setInputFiles({
      name: "sample.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    const content = page.getByLabel("본문");
    await expect(content).toHaveValue(IMAGE_PATH);
    const path = IMAGE_PATH.exec(await content.inputValue())![0];

    await fillEditor(page, {
      title,
      slug: title,
      content: await content.inputValue(),
    });
    await page.getByRole("button", { name: "임시 저장", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]+\/edit$/);

    await page.goto("/admin/storage");
    await expect(
      page.getByRole("heading", { name: "스토리지", level: 1 }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("table", { name: "미사용 이미지 후보 목록" })
        .or(page.getByText("삭제할 수 있는 미사용 이미지가 없습니다.")),
    ).toBeVisible();
    // 초안이 참조하고 유예 기간 안이므로 어느 쪽으로도 후보가 될 수 없다.
    await expect(page.getByText(path)).toHaveCount(0);
  });

  test("후보가 있으면 선택하고 확인 대화상자까지 열 수 있다 (삭제하지 않음)", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin/storage");
    const table = page.getByRole("table", { name: "미사용 이미지 후보 목록" });
    await expect(
      table.or(page.getByText("삭제할 수 있는 미사용 이미지가 없습니다.")),
    ).toBeVisible();
    test.skip((await table.count()) === 0, "후보 이미지가 없음");

    const deleteButton = page.getByRole("button", { name: "선택 삭제" });
    await expect(deleteButton).toBeDisabled();

    await table.getByRole("checkbox", { name: /선택$/ }).nth(1).check();
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("되돌릴 수 없습니다")).toBeVisible();
    await dialog.getByRole("button", { name: "취소" }).click();
    await expect(dialog).toHaveCount(0);
  });
});
