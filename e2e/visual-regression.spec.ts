import { test, expect } from "@playwright/test";

/**
 * E2E Visual Regression Tests
 * These tests capture screenshots and compare against baselines
 */

test.describe("Visual Regression - Dashboard", () => {
  test("should match dashboard screenshot - desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for main content to be visible
    await expect(page.locator("h1")).toBeVisible();

    // Take full page screenshot
    await expect(page).toHaveScreenshot("dashboard-desktop.png", {
      fullPage: true,
    });
  });

  test("should match dashboard screenshot - tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("dashboard-tablet.png", {
      fullPage: true,
    });
  });

  test("should match dashboard screenshot - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("dashboard-mobile.png", {
      fullPage: true,
    });
  });

  test("should match dashboard dark mode screenshot", async ({ page }) => {
    // Set dark mode preference
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("dashboard-dark.png", {
      fullPage: true,
    });
  });
});

test.describe("Visual Regression - Agents Page", () => {
  test("should match agents page screenshot", async ({ page }) => {
    await page.goto("/agents");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("agents-desktop.png", {
      fullPage: true,
    });
  });

  test("should match agents page screenshot - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/agents");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("agents-mobile.png", {
      fullPage: true,
    });
  });
});

test.describe("Visual Regression - Tasks Page", () => {
  test("should match tasks page screenshot", async ({ page }) => {
    await page.goto("/tasks");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("tasks-desktop.png", {
      fullPage: true,
    });
  });
});

test.describe("Visual Regression - Alerts Page", () => {
  test("should match alerts page screenshot", async ({ page }) => {
    await page.goto("/alerts");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("alerts-desktop.png", {
      fullPage: true,
    });
  });
});

test.describe("Visual Regression - Status Page", () => {
  test("should match status page screenshot", async ({ page }) => {
    await page.goto("/status");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("status-desktop.png", {
      fullPage: true,
    });
  });
});

test.describe("Visual Regression - Settings Page", () => {
  test("should match settings page screenshot", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("settings-desktop.png", {
      fullPage: true,
    });
  });
});

test.describe("Visual Regression - New Pages", () => {
  test("should match patterns page screenshot", async ({ page }) => {
    await page.goto("/patterns");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("patterns-desktop.png", {
      fullPage: true,
    });
  });

  test("should match trajectories page screenshot", async ({ page }) => {
    await page.goto("/trajectories");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("trajectories-desktop.png", {
      fullPage: true,
    });
  });

  test("should match performance-metrics page screenshot", async ({ page }) => {
    await page.goto("/performance-metrics");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("performance-metrics-desktop.png", {
      fullPage: true,
    });
  });

  test("should match swarms page screenshot", async ({ page }) => {
    await page.goto("/swarms");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("swarms-desktop.png", {
      fullPage: true,
    });
  });

  test("should match queries page screenshot", async ({ page }) => {
    await page.goto("/queries");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("queries-desktop.png", {
      fullPage: true,
    });
  });
});

test.describe("Visual Regression - Component Snapshots", () => {
  test("should match mobile menu open state", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Open mobile menu
    const hamburger = page.locator("button").filter({ hasText: /menu/i }).first();
    await hamburger.click();

    // Wait for menu animation
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("mobile-menu-open.png");
  });

  test("should match navigation screenshot", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();

    await expect(nav).toHaveScreenshot("navigation-bar.png");
  });
});

test.describe("Visual Regression - Dark Mode", () => {
  test.use({ colorScheme: "dark" });

  test("should match agents page in dark mode", async ({ page }) => {
    await page.goto("/agents");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("agents-dark.png", {
      fullPage: true,
    });
  });

  test("should match alerts page in dark mode", async ({ page }) => {
    await page.goto("/alerts");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    await expect(page).toHaveScreenshot("alerts-dark.png", {
      fullPage: true,
    });
  });
});
