import {
  expect,
  request as playwrightRequest,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import {
  BASE_URL,
  confirmDelete,
  hasAdmin,
  login,
  rowOf,
  uniqueName,
} from "./fixtures/admin";

// 이 스펙이 만든 항목은 모두 이 접두로 시작하고, afterAll에서 접두로 찾아 지운다.
const PREFIX = "e2e-resume-";

const LIST_PATHS = [
  "/admin/resume/career",
  "/admin/projects",
  "/admin/publications",
];

// 필수 필드는 라벨에 "*"가 붙어 접근성 이름이 달라지므로 라벨 앞부분으로 찾는다("부제목"과 구분).
function field(page: Page, label: string) {
  return page.getByLabel(new RegExp(`^${label}`));
}

async function saveForm(page: Page) {
  await page.getByRole("button", { name: "저장", exact: true }).click();
}

async function createResumeEntry(
  page: Page,
  title: string,
  extra: { link?: string } = {},
) {
  await page.goto("/admin/resume/career/new");
  await field(page, "제목").fill(title);
  if (extra.link !== undefined) {
    await field(page, "링크").fill(extra.link);
  }
  await saveForm(page);
  await expect(page).toHaveURL(/\/admin\/resume\/career$/);
  await expect(rowOf(page, title)).toBeVisible();
}

async function createProject(page: Page, name: string, featured = false) {
  await page.goto("/admin/projects/new");
  await field(page, "프로젝트 이름").fill(name);
  if (featured) await page.getByLabel("홈에 대표 프로젝트로 표시").check();
  await saveForm(page);
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await expect(rowOf(page, name)).toBeVisible();
}

// 관리자 목록의 행 제목(보조 정보 포함) 순서
async function adminTitles(page: Page) {
  // 목록은 Suspense 안에서 스트리밍되므로 표가 그려진 뒤에 읽는다(빈 배열을 "항목 없음"으로 오해하지 않게).
  await expect(page.getByRole("table")).toBeVisible();
  return page.getByRole("rowheader").allTextContents();
}

function indexOfTitle(titles: string[], title: string) {
  return titles.findIndex((text) => text.includes(title));
}

// 이동 중에는 모든 버튼이 비활성화되므로 버튼 상태가 아니라 목록의 실제 순서가 바뀔 때까지 기다린다.
async function moveUp(page: Page, title: string) {
  const before = indexOfTitle(await adminTitles(page), title);
  await page.getByRole("button", { name: `${title} 위로 이동` }).click();
  await expect
    .poll(async () => indexOfTitle(await adminTitles(page), title))
    .toBe(before - 1);
}

// 공개 화면 제목(h2) 순서. 방문자 컨텍스트의 /career 이력 카드가 h2다.
async function careerTitles(visitor: Page) {
  await visitor.goto("/career");
  // 이력 목록은 Suspense 안에서 스트리밍되므로 항목 또는 빈 안내가 나온 뒤에 읽는다.
  await expect(
    visitor
      .getByRole("heading", { level: 2 })
      .first()
      .or(visitor.getByText("아직 등록된 항목이 없습니다")),
  ).toBeVisible();
  return visitor.getByRole("heading", { level: 2 }).allTextContents();
}

// 접두가 같은 항목을 UI로 모두 지운다. 테스트 실패로 남은 항목도 함께 정리한다.
async function cleanupResume(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await login(page);
    for (const path of LIST_PATHS) {
      await page.goto(path);
      await expect(
        page.getByRole("table").or(page.getByText(/등록된 .*없습니다\./)),
      ).toBeVisible();
      const rows = page.getByRole("row").filter({ hasText: PREFIX });
      while ((await rows.count()) > 0) {
        const title = (await rows.first().getByRole("rowheader").innerText())
          .split("\n")[0]
          .trim();
        await confirmDelete(page, title);
        await expect(rowOf(page, title)).toHaveCount(0);
      }
    }
  } finally {
    await context.close();
  }
}

test.describe("관리자 이력·프로젝트·논문 편집", () => {
  test.skip(!hasAdmin, "관리자 자격 증명 없음");
  // 같은 DB와 목록을 공유하므로 순서대로 실행한다.
  test.describe.configure({ mode: "serial" });

  let visitorContext: BrowserContext;
  let visitor: Page;

  test.beforeEach(async ({ page, browser }) => {
    await login(page);
    // 로그인 쿠키가 없는 별도 컨텍스트로 캐시된 공개 화면을 본다.
    visitorContext = await browser.newContext({ baseURL: BASE_URL });
    visitor = await visitorContext.newPage();
  });

  test.afterEach(async () => {
    await visitorContext.close();
  });

  test.afterAll(async ({ browser }) => {
    await cleanupResume(browser);
  });

  test("경력 항목 추가 → 방문자 /career 새로고침에 즉시 표시", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "add");

    // 캐시를 데운다.
    expect(await careerTitles(visitor)).not.toContain(title);

    await createResumeEntry(page, title);

    await visitor.reload();
    await expect(
      visitor.getByRole("heading", { level: 2, name: title }),
    ).toBeVisible();
  });

  test("위로 이동 → 공개 순서에 반영", async ({ page }) => {
    const first = uniqueName(PREFIX, "order-a");
    const second = uniqueName(PREFIX, "order-b");
    await createResumeEntry(page, first);
    await createResumeEntry(page, second);

    const before = await careerTitles(visitor);
    expect(before.indexOf(first)).toBeGreaterThanOrEqual(0);
    expect(before.indexOf(first)).toBeLessThan(before.indexOf(second));

    // 끝 항목은 아래로 이동할 수 없다.
    await page.goto("/admin/resume/career");
    await expect(
      page.getByRole("button", { name: `${second} 아래로 이동` }),
    ).toBeDisabled();
    await moveUp(page, second);
    const adminAfter = await adminTitles(page);
    expect(indexOfTitle(adminAfter, second)).toBeLessThan(
      indexOfTitle(adminAfter, first),
    );

    await visitor.reload();
    await expect(
      visitor.getByRole("heading", { level: 2, name: second }),
    ).toBeVisible();
    const after = await visitor
      .getByRole("heading", { level: 2 })
      .allTextContents();
    expect(after.indexOf(second)).toBeLessThan(after.indexOf(first));
  });

  test("프로젝트 대표 지정 → 홈 대표 프로젝트에 반영", async ({ page }) => {
    const name = uniqueName(PREFIX, "project");
    await createProject(page, name, true);

    // 대표 프로젝트가 이미 3개라 맨 아래에 붙은 새 프로젝트는 홈에 나오지 않는다.
    await visitor.goto("/");
    await expect(
      visitor.getByRole("heading", { name: "대표 프로젝트" }),
    ).toBeVisible();
    await expect(visitor.getByText(name)).toHaveCount(0);

    // 맨 위로 올리면 대표 프로젝트 우선 순서에서 앞으로 와 홈에 나온다.
    await page.goto("/admin/projects");
    while (indexOfTitle(await adminTitles(page), name) > 0) {
      await moveUp(page, name);
    }

    await visitor.reload();
    await expect(visitor.getByText(name)).toBeVisible();
    // 같은 이름이 /projects에도 보인다.
    await visitor.goto("/projects");
    await expect(visitor.getByText(name)).toBeVisible();
  });

  test("빈 제목·javascript: 링크 → 필드 오류, 저장되지 않고 입력값 유지", async ({
    page,
  }) => {
    await page.goto("/admin/resume/career/new");

    await saveForm(page);
    await expect(
      page.getByRole("alert").filter({ hasText: "제목: 필수 항목입니다." }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/resume\/career\/new$/);

    const title = uniqueName(PREFIX, "invalid");
    await field(page, "제목").fill(title);
    await field(page, "링크").fill("javascript:alert(1)");
    await saveForm(page);
    await expect(
      page.getByRole("alert").filter({ hasText: "https://" }),
    ).toBeVisible();
    // 입력값이 유지되고, 접근성 연결(aria-invalid)이 걸린다.
    await expect(field(page, "제목")).toHaveValue(title);
    await expect(field(page, "링크")).toHaveValue("javascript:alert(1)");
    await expect(field(page, "링크")).toHaveAttribute("aria-invalid", "true");

    // 저장되지 않았다.
    await page.goto("/admin/resume/career");
    await expect(page.getByRole("table")).toBeVisible();
    await expect(rowOf(page, title)).toHaveCount(0);
  });

  test("숨김 토글 → 공개에서 사라지고 관리자 목록에는 남음, 다시 공개하면 복귀", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "hide");
    await createResumeEntry(page, title);

    await visitor.goto("/career");
    await expect(
      visitor.getByRole("heading", { level: 2, name: title }),
    ).toBeVisible();

    await page.getByRole("button", { name: `${title} 숨기기` }).click();
    await expect(
      rowOf(page, title).getByText("숨김", { exact: true }),
    ).toBeVisible();

    await visitor.reload();
    await expect(visitor.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      visitor.getByRole("heading", { level: 2, name: title }),
    ).toHaveCount(0);
    // 관리자 목록에는 그대로 있고 수정 화면도 열린다.
    await page.reload();
    await expect(rowOf(page, title)).toBeVisible();

    await page.getByRole("button", { name: `${title} 공개하기` }).click();
    await expect(
      rowOf(page, title).getByText("공개", { exact: true }),
    ).toBeVisible();
    await visitor.reload();
    await expect(
      visitor.getByRole("heading", { level: 2, name: title }),
    ).toBeVisible();
  });

  test("섹션의 모든 항목을 숨기면 공개 화면에 빈 안내, 복구 후 다시 표시", async ({
    page,
  }) => {
    // 운영 데이터와 같은 DB다. 어학 섹션의 공개 항목을 잠깐 숨기고 반드시 되돌린다.
    await page.goto("/admin/resume/languages");
    await expect(page.getByRole("table")).toBeVisible();
    const hideButtons = page.getByRole("button", { name: /숨기기$/ });
    const hidden: string[] = [];
    try {
      while ((await hideButtons.count()) > 0) {
        const label = (await hideButtons.first().getAttribute("aria-label"))!;
        hidden.push(label.replace(/ 숨기기$/, ""));
        await hideButtons.first().click();
        await expect(
          page.getByRole("button", {
            name: label.replace("숨기기", "공개하기"),
          }),
        ).toBeVisible();
      }

      await visitor.goto("/languages");
      await expect(
        visitor.getByText("아직 등록된 항목이 없습니다"),
      ).toBeVisible();
    } finally {
      for (const title of hidden) {
        const show = page.getByRole("button", { name: `${title} 공개하기` });
        if (await show.isVisible()) {
          await show.click();
          await expect(
            page.getByRole("button", { name: `${title} 숨기기` }),
          ).toBeVisible();
        }
      }
    }

    await visitor.reload();
    await expect(visitor.getByText("아직 등록된 항목이 없습니다")).toHaveCount(
      0,
    );
    await expect(
      visitor.getByRole("heading", { level: 2 }).first(),
    ).toBeVisible();
  });

  test("논문: 필드 오류와 추가 → 방문자 /publications에 표시, 이동 버튼 없음", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "paper");

    await page.goto("/admin/publications/new");
    await field(page, "제목").fill(title);
    await field(page, "연도").fill("20a4");
    await saveForm(page);
    await expect(
      page.getByRole("alert").filter({ hasText: "연도" }),
    ).toBeVisible();
    await expect(field(page, "제목")).toHaveValue(title);

    await field(page, "연도").fill("2024");
    await saveForm(page);
    await expect(page).toHaveURL(/\/admin\/publications$/);
    await expect(rowOf(page, title)).toBeVisible();
    await expect(page.getByRole("button", { name: /위로 이동/ })).toHaveCount(
      0,
    );

    await visitor.goto("/publications");
    await expect(visitor.getByText(title)).toBeVisible();
  });

  test("비로그인으로 Server Action을 재전송해도 리다이렉트되고 DB는 바뀌지 않는다", async ({
    page,
  }) => {
    const title = uniqueName(PREFIX, "replay");
    await createResumeEntry(page, title);

    // 관리자 화면에서 숨김 토글 액션을 한 번 호출하며 액션 ID를 가로챈다.
    const toggled = page.waitForRequest(
      (req) =>
        req.method() === "POST" && req.headers()["next-action"] !== undefined,
    );
    await page.getByRole("button", { name: `${title} 숨기기` }).click();
    const actionId = (await toggled).headers()["next-action"];
    await expect(
      rowOf(page, title).getByText("숨김", { exact: true }),
    ).toBeVisible();
    // 다시 공개로 돌려 둔다. 이제 공개 상태에서 재전송으로 숨겨지는지 본다.
    await page.getByRole("button", { name: `${title} 공개하기` }).click();
    await expect(
      rowOf(page, title).getByText("공개", { exact: true }),
    ).toBeVisible();

    const href = await rowOf(page, title)
      .getByRole("link", { name: /수정$/ })
      .getAttribute("href");
    const id = href!.match(/\/([0-9a-f-]{36})\/edit$/)![1];

    // 쿠키 없는 컨텍스트로 같은 액션을 보낸다. /admin 경로는 proxy가, 그 밖의 경로는
    // 액션 안의 requireAdmin()이 막는다. 어느 쪽이든 쓰기는 일어나지 않아야 한다.
    const anonymous = await playwrightRequest.newContext({ baseURL: BASE_URL });
    try {
      for (const path of ["/admin/resume/career", "/"]) {
        const response = await anonymous.post(path, {
          headers: {
            "Next-Action": actionId,
            "Content-Type": "text/plain;charset=UTF-8",
            Accept: "text/x-component",
          },
          data: JSON.stringify([id, false]),
          maxRedirects: 0,
        });
        // 성공 응답(200 + 액션 결과)이 아니라 로그인으로의 리다이렉트거나 오류여야 한다.
        const location = response.headers()["location"] ?? "";
        const redirected =
          (response.status() >= 300 && response.status() < 400) ||
          response.headers()["x-action-redirect"] !== undefined;
        if (redirected) {
          expect(
            location + (response.headers()["x-action-redirect"] ?? ""),
          ).toContain("/auth/login");
        }
      }
    } finally {
      await anonymous.dispose();
    }

    // DB가 바뀌지 않았다: 여전히 공개 상태다.
    await visitor.goto("/career");
    await expect(
      visitor.getByRole("heading", { level: 2, name: title }),
    ).toBeVisible();
    await page.reload();
    await expect(
      rowOf(page, title).getByText("공개", { exact: true }),
    ).toBeVisible();
  });
});
