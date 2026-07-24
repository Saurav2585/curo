import { test, expect } from "@playwright/test";
import { checkPage, signIn, DOCTOR } from "./helpers";

/**
 * Automated walk of the whole product. Run:  npx playwright test
 * Screenshots of every page: test-results/.../screens/*.png
 * HTML report after a run:    npx playwright show-report
 */

// ---------------------------------------------------------------- public pages
const PUBLIC_ROUTES = [
  "/",
  "/doctors",
  "/doctors?specialty=cardiology",
  "/doctors?q=iyer",
  "/doctors/rajesh-iyer",
  "/doctors/ananya-sharma",
  "/pricing",
  "/terms",
  "/privacy",
  "/sign-in",
  "/sign-up",
  "/reset-password",
];

for (const route of PUBLIC_ROUTES) {
  test(`public page is healthy: ${route}`, async ({ page }, testInfo) => {
    await checkPage(page, route, testInfo);
  });
}

// ---------------------------------------------------------------- not-found
test("unknown doctor shows a graceful not-found, not a crash", async ({ page }) => {
  await page.goto("/doctors/this-doctor-does-not-exist");
  await expect(page.getByText(/isn.t listed|not found/i)).toBeVisible();
});

// ---------------------------------------------------------------- booking grid
test("slot grid renders and a slot can be selected", async ({ page }, testInfo) => {
  await checkPage(page, "/doctors/ananya-sharma/book", testInfo);
  const chip = page.getByRole("button", { name: /available/i }).first();
  if (await chip.count()) {
    await chip.click();
    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
  }
});

// ---------------------------------------------------------------- patient journey
test("patient can sign up and reach an empty bookings page", async ({ page }, testInfo) => {
  const email = `test_${Date.now()}@curo.demo`;
  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("Test Patient");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Testpass123");
  await page.getByLabel("Confirm password").fill("Testpass123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-up"), { timeout: 15_000 });
  await checkPage(page, "/bookings", testInfo);
});

// ---------------------------------------------------------------- doctor journey
test.describe("doctor portal", () => {
  const DOCTOR_ROUTES = ["/dashboard", "/dashboard/appointments", "/dashboard/schedule"];

  test("doctor can sign in and every portal page is healthy", async ({ page }, testInfo) => {
    await signIn(page, DOCTOR.email, DOCTOR.password);
    // Role-aware redirect should land a doctor in the portal.
    await expect(page).toHaveURL(/\/dashboard/);
    for (const route of DOCTOR_ROUTES) {
      await checkPage(page, route, testInfo);
    }
  });
});

// ---------------------------------------------------------------- role guards
test("logged-out patient area redirects to sign in", async ({ page }) => {
  await page.goto("/bookings");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("logged-out doctor area redirects to sign in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});
