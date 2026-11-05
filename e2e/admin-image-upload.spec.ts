import { expect, test, type Page } from "@playwright/test";

import {
  cleanup,
  fillEditor,
  hasAdmin,
  login,
  uniqueName,
} from "./fixtures/admin";

// 테스트가 만든 글은 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-img-";

// 1x1 투명 PNG
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const PNG = Buffer.from(PNG_BASE64, "base64");

const OBJECT_URL_PATTERN = /\/storage\/v1\/object\/blog-images\//;
const IMAGE_MARKDOWN =
  /!\[[^\]]*\]\(https?:\/\/[^)]+\/blog-images\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png\)/;

// 업로드된 이미지는 스토리지에 남는다: 버킷에 select 정책이 없어 관리자 세션으로도 삭제할 수 없고
// SQL 삭제는 storage.protect_delete 트리거가 막는다. 고아 파일은 MVP 범위 밖이다(upload-image.ts 주석).

function countUploadRequests(page: Page) {
  const counter = { value: 0 };
  page.on("request", (request) => {
    if (request.method() === "POST" && OBJECT_URL_PATTERN.test(request.url())) {
      counter.value += 1;
    }
  });
  return counter;
}

function contentBox(page: Page) {
  return page.getByLabel("본문");
}

// 하이드레이션 전에 setInputFiles를 호출하면 change 이벤트가 유실돼 본문이 비어 있는 채로 남는다.
// input에 React props가 붙을 때까지(이벤트 핸들러 연결) 기다린다.
async function waitForEditorHydrated(page: Page) {
  await page.waitForFunction(() => {
    const input = document.querySelector('[data-testid="image-upload-input"]');
    return (
      input !== null &&
      Object.keys(input).some((key) => key.startsWith("__reactProps$"))
    );
  });
}

test.describe("관리자 이미지 업로드", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 같은 DB와 스토리지를 공유하므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/admin/posts/new");
    await waitForEditorHydrated(page);
  });

  test.afterAll(async ({ browser }) => {
    await cleanup(browser, PREFIX);
  });

  test("이미지 버튼으로 PNG 선택 → 커서 위치에 삽입, 미리보기에 이미지", async ({
    page,
  }) => {
    const box = contentBox(page);
    await box.fill("앞뒤");
    // 커서를 '앞'과 '뒤' 사이에 둔다.
    // macOS에서는 Home 키가 캐럿을 옮기지 않으므로 선택 영역을 직접 지정한다.
    await box.focus();
    await box.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(1, 1));

    await page.getByTestId("image-upload-input").setInputFiles({
      name: "sample.png",
      mimeType: "image/png",
      buffer: PNG,
    });

    await expect(box).toHaveValue(new RegExp(`^앞${IMAGE_MARKDOWN.source}뒤$`));
    await expect(box).not.toHaveValue(/업로드 중/);
    await expect(
      page.getByRole("region", { name: "미리보기" }).locator("img"),
    ).toBeVisible();
  });

  test("썸네일 업로드 후 발행 저장 → /blog 카드에 썸네일 표시", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "thumb");
    await fillEditor(page, { title, slug: title });
    await page.getByTestId("thumbnail-input").setInputFiles({
      name: "thumb.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expect(page.getByAltText("썸네일 미리보기")).toBeVisible();

    await page.getByRole("button", { name: "발행하기", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);

    await page.goto("/blog");
    const card = page.locator('[data-slot="card"]').filter({ hasText: title });
    await expect(card.locator('img[src*="blog-images"]')).toBeVisible();
  });

  test("썸네일 제거 → 미리보기가 사라진다", async ({ page }) => {
    // 하이드레이션 전에 파일을 지정하면 change 이벤트가 유실되므로, 입력이 반영되는 것을 먼저 확인한다.
    await page.getByLabel("제목").fill("e2e-img-hydrated");
    await expect(page.getByLabel("제목")).toHaveValue("e2e-img-hydrated");
    await page.getByTestId("thumbnail-input").setInputFiles({
      name: "thumb.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expect(page.getByAltText("썸네일 미리보기")).toBeVisible();

    await page.getByRole("button", { name: "제거" }).click();
    await expect(page.getByAltText("썸네일 미리보기")).toHaveCount(0);
    await expect(page.locator('input[name="thumbnail_url"]')).toHaveValue("");
  });

  for (const file of [
    {
      name: "icon.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg/>"),
    },
    {
      name: "doc.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    },
  ]) {
    test(`${file.name} 선택 → 형식 오류, 업로드 요청 0건, 본문 불변`, async ({
      page,
    }) => {
      const requests = countUploadRequests(page);
      const box = contentBox(page);
      await box.fill("본문 유지");

      await page.getByTestId("image-upload-input").setInputFiles(file);

      await expect(page.locator('ul[role="alert"]')).toContainText(
        "jpeg/png/webp/gif만 가능합니다",
      );
      await expect(box).toHaveValue("본문 유지");
      expect(requests.value).toBe(0);
    });
  }

  test("6MB 이미지 선택 → 크기 오류, 업로드 요청 0건, 본문 불변", async ({
    page,
  }) => {
    const requests = countUploadRequests(page);
    const box = contentBox(page);
    await box.fill("본문 유지");

    await page.getByTestId("image-upload-input").setInputFiles({
      name: "big.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(6 * 1024 * 1024),
    });

    await expect(page.locator('ul[role="alert"]')).toContainText(
      "5MB 이하만 가능합니다",
    );
    await expect(box).toHaveValue("본문 유지");
    expect(requests.value).toBe(0);
  });

  test("클립보드 이미지 붙여넣기 → 본문에 삽입, 텍스트 붙여넣기는 가로채지 않음", async ({
    page,
  }) => {
    const box = contentBox(page);
    await box.click();

    const prevented = await page.evaluate(
      async ({ base64 }) => {
        const textarea = document.getElementById(
          "post-content",
        ) as HTMLTextAreaElement;
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const image = new DataTransfer();
        image.items.add(new File([bytes], "pasted.png", { type: "image/png" }));
        const imageEvent = new ClipboardEvent("paste", {
          clipboardData: image,
          bubbles: true,
          cancelable: true,
        });
        textarea.dispatchEvent(imageEvent);

        const text = new DataTransfer();
        text.setData("text/plain", "plain");
        const textEvent = new ClipboardEvent("paste", {
          clipboardData: text,
          bubbles: true,
          cancelable: true,
        });
        textarea.dispatchEvent(textEvent);
        return {
          image: imageEvent.defaultPrevented,
          text: textEvent.defaultPrevented,
        };
      },
      { base64: PNG_BASE64 },
    );

    expect(prevented).toEqual({ image: true, text: false });
    await expect(box).toHaveValue(IMAGE_MARKDOWN);
  });

  test("여러 파일 선택 → 순차 업로드되어 모두 삽입, 자리표시 잔존 없음", async ({
    page,
  }) => {
    const box = contentBox(page);
    const file = (name: string) => ({
      name,
      mimeType: "image/png",
      buffer: PNG,
    });

    await page
      .getByTestId("image-upload-input")
      .setInputFiles([file("first.png"), file("second.png")]);

    await expect(box).toHaveValue(/!\[first\]\(.+\)[\s\S]*!\[second\]\(.+\)/);
    await expect(box).not.toHaveValue(/업로드 중/);
  });

  test("업로드 요청이 실패 → 자리표시 제거, 오류 표시, 나머지 본문 불변", async ({
    page,
  }) => {
    await page.route(OBJECT_URL_PATTERN, (route) => route.abort());
    const box = contentBox(page);
    await box.fill("본문 유지");

    await page.getByTestId("image-upload-input").setInputFiles({
      name: "fail.png",
      mimeType: "image/png",
      buffer: PNG,
    });

    await expect(page.locator('ul[role="alert"]')).toContainText(
      "fail.png: 이미지 업로드에 실패했습니다.",
    );
    await expect(box).toHaveValue("본문 유지");
  });

  test("업로드 중에는 저장 버튼이 비활성화되고 끝나면 복구된다", async ({
    page,
  }) => {
    // 요청을 붙잡아 두었다가 중단한다(스토리지에 객체를 남기지 않는다).
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(OBJECT_URL_PATTERN, async (route) => {
      await held;
      await route.abort();
    });
    const draft = page.getByRole("button", { name: "임시 저장", exact: true });
    const publish = page.getByRole("button", { name: "발행하기", exact: true });
    await contentBox(page).fill("본문");

    await page.getByTestId("image-upload-input").setInputFiles({
      name: "slow.png",
      mimeType: "image/png",
      buffer: PNG,
    });

    await expect(page.getByText(/이미지 업로드 중/)).toBeVisible();
    await expect(draft).toBeDisabled();
    await expect(publish).toBeDisabled();

    release();
    await expect(page.getByText(/이미지 업로드 중/)).toHaveCount(0);
    await expect(draft).toBeEnabled();
    await expect(publish).toBeEnabled();
  });

  test("375px 폭: 가로 넘침 없이 작성 탭에서 이미지 버튼·썸네일 UI가 보인다", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.reload();

    await expect(
      page.getByRole("button", { name: "이미지 추가" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "썸네일 업로드" }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // 미리보기 탭으로 갔다가 돌아와도 업로드 UI가 유지된다.
    await page.getByRole("tab", { name: "미리보기" }).click();
    await page.getByRole("tab", { name: "작성" }).click();
    await expect(
      page.getByRole("button", { name: "이미지 추가" }),
    ).toBeVisible();
  });

  test("파일 드래그앤드롭 → 본문에 삽입", async ({ page }) => {
    const box = contentBox(page);

    await page.evaluate(
      ({ base64 }) => {
        const textarea = document.getElementById(
          "post-content",
        ) as HTMLTextAreaElement;
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const transfer = new DataTransfer();
        transfer.items.add(
          new File([bytes], "dropped.png", { type: "image/png" }),
        );
        textarea.dispatchEvent(
          new DragEvent("drop", {
            dataTransfer: transfer,
            bubbles: true,
            cancelable: true,
          }),
        );
      },
      { base64: PNG_BASE64 },
    );

    await expect(box).toHaveValue(IMAGE_MARKDOWN);
  });
});
