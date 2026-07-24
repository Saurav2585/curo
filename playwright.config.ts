import { defineConfig, devices } from "@playwright/test";

/**
 * Runs the smoke suite against a local dev server. Playwright starts `npm run
 * dev` for you and waits for it, so you only ever run one command:
 *
 *   npx playwright test
 *
 * Screenshots for every visited page land in `test-results/screens/`.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
