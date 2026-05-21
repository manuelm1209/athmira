import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8081";
const storageState =
  process.env.PLAYWRIGHT_STORAGE_STATE ?? "playwright/.auth/codex-user.json";
const shouldRefreshAuth = process.env.PLAYWRIGHT_REFRESH_AUTH === "1";

export default defineConfig({
  use: {
    baseURL,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        baseURL,
      },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState,
      },
      dependencies: shouldRefreshAuth ? ["setup"] : [],
    },
  ],
});
