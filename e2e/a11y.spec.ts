import { expect, test } from "@playwright/test";

test.describe("접근성: 랜드마크와 현재 페이지", () => {
  test("공개 페이지에 banner·main·contentinfo와 이름 있는 nav가 있다", async ({
    page,
  }) => {
    await page.goto("/blog");

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "주요 메뉴" }),
    ).toBeVisible();
  });

  test("현재 경로의 메뉴만 aria-current=page를 갖는다", async ({ page }) => {
    await page.goto("/blog");

    const nav = page.getByRole("navigation", { name: "주요 메뉴" });
    await expect(nav.getByRole("link", { name: "블로그" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "논문" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("로그인 화면에 main이 있고 오류가 입력과 연결된다", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("main")).toHaveCount(1);

    await page.getByLabel("이메일").fill("nobody@example.com");
    await page.getByLabel("비밀번호").fill("wrong-password-123!");
    await page.getByRole("button", { name: "로그인", exact: true }).click();

    const alert = page
      .getByRole("alert")
      .filter({ hasText: "이메일 또는 비밀번호가 올바르지 않습니다." });
    await expect(alert).toBeVisible();
    await expect(page.getByLabel("이메일")).toHaveAttribute(
      "aria-describedby",
      "login-error",
    );
    await expect(page.getByLabel("비밀번호")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});

test.describe("접근성: 키보드 조작", () => {
  test("첫 Tab은 본문 바로가기이고 Enter로 본문에 포커스가 간다", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "본문 바로가기" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("헤더 메뉴를 Tab으로 순회하면 포커스 링이 보인다", async ({ page }) => {
    await page.goto("/");

    const logo = page
      .getByRole("banner")
      .getByRole("link", { name: "hkoikoi.dev" });
    await page.keyboard.press("Tab"); // 본문 바로가기
    await page.keyboard.press("Tab");
    await expect(logo).toBeFocused();
    // 포커스 링은 box-shadow(ring)로 그려진다
    await expect(logo).not.toHaveCSS("box-shadow", "none");

    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "이력", exact: true }),
    ).toBeFocused();
  });

  test("이력 드롭다운을 키보드로 열고 항목으로 이동한다", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "이력", exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "경력" })).toBeVisible();

    // 열리면 첫 항목(학력)에 포커스가 가므로 한 번 내리면 경력이다.
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/career$/);
  });

  test("테마 전환을 키보드만으로 할 수 있다", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "테마 변경" }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("menuitemradio", { name: "다크" }).focus();
    await page.keyboard.press("Enter");

    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("블로그 필터 링크와 해제 링크에 키보드로 접근한다", async ({ page }) => {
    await page.goto("/blog?category=none");

    const clear = page.getByRole("link", { name: "필터 해제" });
    await clear.focus();
    await expect(clear).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/blog$/);
  });
});
