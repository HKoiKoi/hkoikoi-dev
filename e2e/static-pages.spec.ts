import { expect, test } from "@playwright/test";

test.describe("메인 페이지", () => {
  test("연락처 링크와 섹션이 표시된다", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "이메일" })).toHaveAttribute(
      "href",
      "mailto:koikoilove99@gmail.com",
    );
    const github = page.getByRole("link", { name: /GitHub/ }).first();
    await expect(github).toHaveAttribute("href", "https://github.com/hkoikoi");
    await expect(github).toHaveAttribute("target", "_blank");

    await expect(
      page.getByRole("region", { name: "바로가기" }).getByRole("link"),
    ).toHaveCount(9);
    await expect(
      page.getByRole("region", { name: "최신 글" }).getByRole("listitem"),
    ).not.toHaveCount(0);
  });

  test("바로가기 카드로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("region", { name: "바로가기" })
      .getByRole("link", { name: "학력" })
      .click();

    await expect(page).toHaveURL(/\/education$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("학력");
  });
});

test.describe("이력·논문 페이지", () => {
  test("논문은 연도 내림차순으로 표시된다", async ({ page }) => {
    await page.goto("/publications");

    const years = await page.locator("main li p:last-child").allTextContents();
    const parsed = years.map((text) => Number(text.split("·").pop()));
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed).toEqual([...parsed].sort((a, b) => b - a));
  });

  test("프로젝트 외부 링크는 새 탭으로 열린다", async ({ page }) => {
    await page.goto("/projects");

    const link = page.getByRole("link", { name: /GitHub/ }).first();
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noreferrer/);
  });

  test("어학은 언어·시험 점수·취득일 형식으로 표시된다", async ({ page }) => {
    await page.goto("/languages");

    await expect(page.getByText("영어")).toBeVisible();
    await expect(page.getByText("TOEIC 900")).toBeVisible();
    await expect(page.getByText("2021.05")).toBeVisible();
  });
});
