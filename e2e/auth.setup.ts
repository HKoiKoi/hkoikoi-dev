import { test as setup } from "@playwright/test";

import { ADMIN_STATE, hasAdmin, loginWithForm } from "./fixtures/admin";

// 전체 실행에서 관리자 로그인을 이 한 번으로 줄이고, 세션 쿠키를 파일로 저장해 다른 테스트가 쓴다.
setup("관리자 로그인 세션을 저장한다", async ({ page }) => {
  setup.skip(!hasAdmin, "관리자 자격 증명 없음");

  await loginWithForm(page);
  await page.context().storageState({ path: ADMIN_STATE });
});
