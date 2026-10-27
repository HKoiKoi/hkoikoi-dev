import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;

// 로컬 E2E 관리자 자격 증명(E2E_ADMIN_*)을 .env에서 읽는다. 파일이 없으면 건너뛴다.
try {
  process.loadEnvFile(".env");
} catch {}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
