import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "";

async function submitLogin(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
}

test.describe("관리자 접근 제한 (비로그인)", () => {
  test("비로그인 상태로 /admin/posts 에 접근하면 /auth/login 으로 이동한다", async ({
    page,
  }) => {
    await page.goto("/admin/posts");

    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});

test.describe("관리자 인증", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "관리자 자격 증명 없음",
  );

  test("로그인하면 /admin/posts 로 이동하고 푸터에 관리 링크가 보인다", async ({
    page,
  }) => {
    await submitLogin(page, adminEmail, adminPassword);

    await expect(page).toHaveURL(/\/admin\/posts$/);

    await page.goto("/");
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "관리" }),
    ).toBeVisible();
  });

  test("로그아웃하면 /로 이동하고 관리 링크가 사라지며 /admin/posts 는 로그인으로 보낸다", async ({
    page,
  }) => {
    await submitLogin(page, adminEmail, adminPassword);
    await expect(page).toHaveURL(/\/admin\/posts$/);

    await page.getByRole("button", { name: "로그아웃" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "관리" }),
    ).toHaveCount(0);

    await page.goto("/admin/posts");
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test("잘못된 비밀번호면 오류 메시지가 보이고 이메일 입력값이 유지된다", async ({
    page,
  }) => {
    await submitLogin(page, adminEmail, `${adminPassword}-wrong`);

    // Next의 route announcer도 role="alert"라서 오류 문구로 좁힌다.
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "이메일 또는 비밀번호가 올바르지 않습니다." }),
    ).toBeVisible();
    await expect(page.getByLabel("이메일")).toHaveValue(adminEmail);
    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});
