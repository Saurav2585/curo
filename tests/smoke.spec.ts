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

// ---------------------------------------------------------------- signup chooser
test("signup shows the two account-type journeys", async ({ page }, testInfo) => {
  await checkPage(page, "/sign-up", testInfo);
  await expect(page.getByText("Continue as a patient")).toBeVisible();
  await expect(page.getByText("Continue as a doctor or clinic")).toBeVisible();
});

test("provider application page is healthy", async ({ page }, testInfo) => {
  await checkPage(page, "/apply", testInfo);
});

// ---------------------------------------------------------------- patient journey
test("patient can sign up and reach an empty bookings page", async ({ page }, testInfo) => {
  const email = `test_${Date.now()}@curo.demo`;
  await page.goto("/sign-up");
  await page.getByText("Continue as a patient").click();
  await page.getByLabel("Full name").fill("Test Patient");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Testpass123");
  await page.getByLabel("Confirm password").fill("Testpass123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-up"), { timeout: 15_000 });
  await checkPage(page, "/bookings", testInfo);
  // Patient membership + billing + activity pages are reachable and healthy.
  await checkPage(page, "/account/membership", testInfo);
  await checkPage(page, "/account/billing", testInfo);
  await checkPage(page, "/account/activity", testInfo);
});

// ---------------------------------------------------------------- provider journey
test("a new provider applicant creates a draft and is gated out of the dashboard", async ({ page }) => {
  const email = `provider_${Date.now()}@curo.demo`;
  // Step 1: create the provider account + draft.
  await page.goto("/apply");
  await page.getByLabel("Full name").fill("Test Provider");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Provpass123");
  await page.getByLabel("Confirm password").fill("Provpass123");
  await page.getByRole("button", { name: /create account/i }).click();

  // Step 2: the resumable detail form appears (draft state).
  await expect(page.getByText("Complete your application")).toBeVisible({ timeout: 15_000 });

  // A draft provider cannot reach the dashboard.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/apply\/status/);
});

// ---------------------------------------------------------------- doctor journey
test.describe("doctor portal", () => {
  const DOCTOR_ROUTES = ["/dashboard", "/dashboard/appointments", "/dashboard/schedule"];

  const ALL_DOCTOR_ROUTES = [...DOCTOR_ROUTES, "/dashboard/availability", "/dashboard/reputation", "/dashboard/visibility", "/dashboard/activity", "/dashboard/billing"];

  test("doctor can sign in and every portal page is healthy", async ({ page }, testInfo) => {
    await signIn(page, DOCTOR.email, DOCTOR.password);
    // Role-aware redirect should land a doctor in the portal.
    await expect(page).toHaveURL(/\/dashboard/);
    for (const route of ALL_DOCTOR_ROUTES) {
      await checkPage(page, route, testInfo);
    }
  });
});

// ---------------------------------------------------------------- appointment lifecycle
test("workflow engine keeps its transition map self-consistent", async () => {
  // Pure engine invariant, no UI: terminal states have no outgoing transitions
  // and every listed transition points at a real state.
  const {
    ALL_WORKFLOW_STATES, allowedTransitions, isTerminal, canTransition,
  } = await import("../lib/workflow");
  for (const s of ALL_WORKFLOW_STATES) {
    for (const to of allowedTransitions(s)) {
      expect(ALL_WORKFLOW_STATES).toContain(to);
      expect(canTransition(s, to)).toBe(true);
    }
    if (isTerminal(s)) expect(allowedTransitions(s)).toHaveLength(0);
  }
  // A known illegal transition stays illegal.
  expect(canTransition("cancelled", "completed")).toBe(false);
});

// ---------------------------------------------------------------- notifications
test("notification bell renders for a signed-in doctor", async ({ page }) => {
  await signIn(page, DOCTOR.email, DOCTOR.password);
  await expect(page).toHaveURL(/\/dashboard/);
  const bell = page.getByRole("button", { name: /notifications/i });
  await expect(bell).toBeVisible();
  await bell.click();
  // Either a list or the clean empty state must appear.
  await expect(page.getByText(/Notifications|caught up/i).first()).toBeVisible();
});

// ---------------------------------------------------------------- reviews
test("review page is eligibility-gated for logged-out users", async ({ page }) => {
  // No session → writing a review must bounce to sign-in, never expose the form.
  await page.goto("/bookings/00000000-0000-0000-0000-000000000000/review");
  await expect(page).toHaveURL(/\/sign-in/);
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

test("logged-out admin console redirects to sign in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("logged-out audit log redirects to sign in", async ({ page }) => {
  await page.goto("/admin/audit");
  await expect(page).toHaveURL(/\/sign-in/);
});
