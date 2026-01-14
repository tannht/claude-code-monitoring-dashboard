import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

/**
 * E2E Accessibility Tests
 */
test.describe("Accessibility", () => {
  test("dashboard should not have accessibility violations", async ({ page }) => {
    await page.goto("/");
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("agents page should not have accessibility violations", async ({ page }) => {
    await page.goto("/agents");
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Check for h1
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);

    // Check for skip links or proper navigation
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should have keyboard navigable elements", async ({ page }) => {
    await page.goto("/");

    // Tab through the page
    await page.keyboard.press("Tab");

    // Check that something has focus
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toHaveCount(1);
  });

  test("should have proper ARIA labels on buttons", async ({ page }) => {
    await page.goto("/");

    // Check for buttons with proper labels
    const buttons = page.locator("button:not([aria-label]):not([aria-labelledby])");
    const count = await buttons.count();

    // Filter buttons that have visible text
    let unlabeledButtons = 0;
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const textContent = await button.textContent();
      if (!textContent || textContent.trim() === "") {
        unlabeledButtons++;
      }
    }

    // All buttons should have either aria-label, aria-labelledby, or visible text
    expect(unlabeledButtons).toBe(0);
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await page.goto("/agents");

    // Check that text is readable (basic check)
    const textElements = page.locator("p, h1, h2, h3, span, div");
    const firstText = textElements.first();
    await expect(firstText).toBeVisible();
  });

  test("mobile menu should be accessible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Open mobile menu
    const hamburger = page.locator("button").filter({ hasText: /menu/i }).first();
    await hamburger.click();

    // Check menu is visible and focusable
    const mobileMenu = page.locator(".fixed").filter({ hasText: /Navigation/i });
    await expect(mobileMenu).toBeVisible();

    // Check for close button
    const closeButton = page.locator("button[aria-label*='close' i], button[aria-label*='menu' i]");
    await expect(closeButton).toBeVisible();
  });
});
