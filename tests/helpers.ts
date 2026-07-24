import { expect, type Page, type TestInfo } from "@playwright/test";

/**
 * Visit a page and assert it is healthy:
 *  • no uncaught console errors
 *  • no failed network requests (404/500) for the document or its assets
 *  • no broken <img> (naturalWidth === 0 after load)
 *  • the page actually rendered something
 * Also saves a full-page screenshot for manual review.
 */
export async function checkPage(page: Page, path: string, testInfo: TestInfo) {
  const consoleErrors: string[] = [];
  const badResponses: string[] = [];

  const onConsole = (msg: import("@playwright/test").ConsoleMessage) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const onResponse = (res: import("@playwright/test").Response) => {
    const url = res.url();
    // Ignore third-party analytics/font noise; focus on our own origin + assets.
    if (res.status() >= 400 && !url.includes("randomuser.me")) {
      badResponses.push(`${res.status()} ${url}`);
    }
  };

  page.on("console", onConsole);
  page.on("response", onResponse);

  const response = await page.goto(path, { waitUntil: "networkidle" });
  expect(response, `No response for ${path}`).toBeTruthy();
  expect(response!.status(), `${path} returned ${response!.status()}`).toBeLessThan(400);

  // Something rendered
  await expect(page.locator("body")).not.toBeEmpty();

  // Broken images
  const brokenImages = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.src)
  );

  // Screenshot for the human
  const safeName = path.replace(/[^\w]+/g, "_").replace(/^_|_$/g, "") || "home";
  await page.screenshot({
    path: testInfo.outputPath(`screens/${safeName}.png`),
    fullPage: true,
  });

  page.off("console", onConsole);
  page.off("response", onResponse);

  expect(consoleErrors, `Console errors on ${path}:\n${consoleErrors.join("\n")}`).toEqual([]);
  expect(badResponses, `Failed requests on ${path}:\n${badResponses.join("\n")}`).toEqual([]);
  expect(brokenImages, `Broken images on ${path}:\n${brokenImages.join("\n")}`).toEqual([]);
}

export const DOCTOR = {
  email: "doctor@curo.demo",
  password: "CuroDemo123",
};

/** Sign in through the real UI. */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 15_000 });
}
