import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Dashboard (Home Page)
 */
test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/Claude Code Monitoring/);
  });

  test("should display quick stats cards", async ({ page }) => {
    // Check for stats cards
    const statsCards = page.locator(".grid").first();
    await expect(statsCards).toBeVisible();
  });

  test("should have navigation links", async ({ page }) => {
    // Desktop navigation
    const nav = page.locator("nav");
    await expect(nav.first()).toBeVisible();
  });

  test("should navigate to agents page", async ({ page }) => {
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL(/\/agents/);
    await expect(page.locator("h1")).toContainText("Agent");
  });

  test("should navigate to tasks page", async ({ page }) => {
    await page.click('a[href="/tasks"]');
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.locator("h1")).toContainText("Task");
  });

  test("should navigate to alerts page", async ({ page }) => {
    await page.click('a[href="/alerts"]');
    await expect(page).toHaveURL(/\/alerts/);
    await expect(page.locator("h1")).toContainText("Alert");
  });
});

test.describe("Dashboard - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should show hamburger menu on mobile", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.locator("button[aria-label*='navigation']").or(
      page.locator("button").filter({ hasText: /menu/i })
    );
    await expect(hamburger).toBeVisible();
  });

  test("should open mobile menu when hamburger clicked", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.locator("button").filter({ hasText: /menu/i }).first();
    await hamburger.click();

    // Check that mobile menu is open
    const mobileMenu = page.locator(".fixed").filter({ hasText: /Navigation/i });
    await expect(mobileMenu).toBeVisible();
  });
});
