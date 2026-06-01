import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: process.env.PLAYWRIGHT_TRACE === "1" ? "retain-on-failure" : "off",
    video: process.env.PLAYWRIGHT_VIDEO === "1" ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
  },
  expect: {
    timeout: 10_000,
  },
  projects: [
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  ...(process.env.PLAYWRIGHT_EXTERNAL_SERVER === "1"
    ? {}
    : {
        webServer: {
          command: "npm run dev -- --webpack --hostname 127.0.0.1 --port 3000",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            NEXT_PUBLIC_ENV: "local",
            NODE_ENV: "development",
          },
        },
      }),
});
