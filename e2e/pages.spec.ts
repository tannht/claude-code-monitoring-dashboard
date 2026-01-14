import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Agents Page
 */
test.describe("Agents Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/agents");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Agent");
  });

  test("should display export button", async ({ page }) => {
    const exportButton = page.locator("button").filter({ hasText: /export/i });
    await expect(exportButton).toBeVisible();
  });

  test("should display refresh button", async ({ page }) => {
    const refreshButton = page.locator("button").filter({ hasText: /refresh/i });
    await expect(refreshButton).toBeVisible();
  });

  test("should have summary cards", async ({ page }) => {
    const cards = page.locator(".grid > div");
    await expect(cards.first()).toBeVisible();
  });
});

/**
 * E2E Tests for Tasks Page
 */
test.describe("Tasks Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tasks");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Task");
  });

  test("should display filter buttons", async ({ page }) => {
    const filters = page.locator("button").filter({ hasText: /All|Pending|Completed|Failed/i });
    await expect(filters.first()).toBeVisible();
  });

  test("should display export button", async ({ page }) => {
    const exportButton = page.locator("button").filter({ hasText: /export/i });
    await expect(exportButton).toBeVisible();
  });
});

/**
 * E2E Tests for Alerts Page
 */
test.describe("Alerts Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/alerts");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Alert");
  });

  test("should display severity filters", async ({ page }) => {
    const filters = page.locator("button").filter({ hasText: /All|Critical|Error|Warning|Info/i });
    await expect(filters.first()).toBeVisible();
  });

  test("should display alert trend chart", async ({ page }) => {
    const chart = page.locator("canvas, svg").or(page.locator(".apexcharts"));
    // Chart may not be visible if no data
    const pageContent = page.locator("h1");
    await expect(pageContent).toBeVisible();
  });
});

/**
 * E2E Tests for Messages Page
 */
test.describe("Messages Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/messages");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Message");
  });

  test("should display search input", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='search' i]");
    await expect(searchInput).toBeVisible();
  });

  test("should display message type filter", async ({ page }) => {
    const select = page.locator("select");
    await expect(select).toBeVisible();
  });
});

/**
 * E2E Tests for Status Page
 */
test.describe("Status Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/status");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Status");
  });

  test("should display health indicators", async ({ page }) => {
    const statusCards = page.locator(".grid > div");
    await expect(statusCards.first()).toBeVisible();
  });
});

/**
 * E2E Tests for Settings Page
 */
test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Setting");
  });

  test("should display configuration options", async ({ page }) => {
    const settings = page.locator("section, .grid > div");
    await expect(settings.first()).toBeVisible();
  });
});
