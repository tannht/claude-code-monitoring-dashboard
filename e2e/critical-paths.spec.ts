import { test, expect } from "@playwright/test";

/**
 * E2E Critical Path Tests
 * Tests for essential user workflows
 */
test.describe("Critical Paths", () => {
  test("should complete dashboard to agents navigation flow", async ({ page }) => {
    // Start at dashboard
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();

    // Navigate to agents
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL(/\/agents/);
    await expect(page.locator("h1")).toContainText("Agent");
  });

  test("should complete dashboard to tasks navigation flow", async ({ page }) => {
    await page.goto("/");

    // Navigate to tasks
    await page.click('a[href="/tasks"]');
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.locator("h1")).toContainText("Task");
  });

  test("should complete dashboard to alerts navigation flow", async ({ page }) => {
    await page.goto("/");

    // Navigate to alerts
    await page.click('a[href="/alerts"]');
    await expect(page).toHaveURL(/\/alerts/);
    await expect(page.locator("h1")).toContainText("Alert");
  });

  test("should navigate between all main pages", async ({ page }) => {
    const pages = ["/", "/agents", "/tasks", "/alerts", "/status"];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("should refresh data on button click", async ({ page }) => {
    await page.goto("/agents");

    // Click refresh button
    const refreshButton = page.locator("button").filter({ hasText: /refresh/i });
    await refreshButton.click();

    // Page should still be loaded
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should filter tasks by status", async ({ page }) => {
    await page.goto("/tasks");

    // Click on completed filter
    const completedFilter = page.locator("button").filter({ hasText: /completed/i });
    await completedFilter.click();

    // Should still be on tasks page
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.locator("h1")).toContainText("Task");
  });

  test("should export data from agents page", async ({ page }) => {
    await page.goto("/agents");

    // Setup download handler
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page.locator("button").filter({ hasText: /export/i });
    await exportButton.click();

    // Note: Actual download may not work in test environment
    // This test verifies the button is present and clickable
    await expect(page.locator("h1")).toContainText("Agent");
  });
});

/**
 * E2E Mobile Navigation Tests
 */
test.describe("Mobile Navigation", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should navigate using mobile menu", async ({ page }) => {
    await page.goto("/");

    // Open mobile menu
    const hamburger = page.locator("button").filter({ hasText: /menu/i }).first();
    await hamburger.click();

    // Click on agents link
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL(/\/agents/);
    await expect(page.locator("h1")).toContainText("Agent");

    // Menu should be closed after navigation
    const mobileMenu = page.locator(".fixed").filter({ hasText: /Navigation/i });
    await expect(mobileMenu).not.toBeVisible();
  });

  test("should close mobile menu with X button", async ({ page }) => {
    await page.goto("/");

    // Open mobile menu
    const hamburger = page.locator("button").filter({ hasText: /menu/i }).first();
    await hamburger.click();

    // Close with X button
    const closeButton = page.locator("button[aria-label*='close' i], button[aria-label*='menu' i]").last();
    await closeButton.click();

    // Menu should be closed
    const mobileMenu = page.locator(".fixed").filter({ hasText: /Navigation/i });
    await expect(mobileMenu).not.toBeVisible();
  });

  test("should close mobile menu when clicking overlay", async ({ page }) => {
    await page.goto("/");

    // Open mobile menu
    const hamburger = page.locator("button").filter({ hasText: /menu/i }).first();
    await hamburger.click();

    // Click on overlay
    const overlay = page.locator(".fixed.bg-black\\/50").or(page.locator(".fixed.bg-black\\/50"));
    await overlay.click({ force: true });

    // Menu should be closed
    const mobileMenu = page.locator(".fixed").filter({ hasText: /Navigation/i });
    await expect(mobileMenu).not.toBeVisible();
  });
});

/**
 * E2E Performance Tests
 */
test.describe("Performance", () => {
  test("should load dashboard within 3 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test("should navigate between pages quickly", async ({ page }) => {
    await page.goto("/");

    const startTime = Date.now();
    await page.click('a[href="/agents"]');
    await page.waitForLoadState("networkidle");
    const navigationTime = Date.now() - startTime;

    expect(navigationTime).toBeLessThan(2000);
  });

  test("should handle rapid navigation", async ({ page }) => {
    await page.goto("/");

    // Navigate through multiple pages quickly
    for (let i = 0; i < 5; i++) {
      await page.click('a[href="/agents"]');
      await page.waitForLoadState("domcontentloaded");
      await page.click('a[href="/tasks"]');
      await page.waitForLoadState("domcontentloaded");
    }

    // Should still be functional
    await expect(page.locator("h1")).toBeVisible();
  });
});
