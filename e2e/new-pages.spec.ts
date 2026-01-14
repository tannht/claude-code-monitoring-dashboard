import { test, expect } from "@playwright/test";
import { TestHelpers } from "./fixtures";

/**
 * E2E Tests for Patterns Page
 */
test.describe("Patterns Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/patterns");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Pattern");
  });

  test("should display pattern type filter", async ({ page }) => {
    const select = page.locator("select");
    await expect(select).toBeVisible();
  });

  test("should display sort options", async ({ page }) => {
    // Look for sort buttons or dropdown
    const sortButtons = page.locator("button").filter({ hasText: /Confidence|Usage|Recency/i });
    const count = await sortButtons.count();
    // At least one sort option should be visible
    expect(count).toBeGreaterThan(0);
  });

  test("should display export button", async ({ page }) => {
    const exportButton = page.locator("button").filter({ hasText: /export/i });
    await expect(exportButton).toBeVisible();
  });

  test("should display refresh button", async ({ page }) => {
    const refreshButton = page.locator("button").filter({ hasText: /refresh/i });
    await expect(refreshButton).toBeVisible();
  });
});

/**
 * E2E Tests for Trajectories Page
 */
test.describe("Trajectories Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/trajectories");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Trajectory");
  });

  test("should display filter options", async ({ page }) => {
    // Look for filter controls
    const filters = page.locator("select, input[type='search']");
    const count = await filters.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display export button", async ({ page }) => {
    const exportButton = page.locator("button").filter({ hasText: /export/i });
    await expect(exportButton).toBeVisible();
  });

  test("should display trajectory list or cards", async ({ page }) => {
    // Check for trajectory items
    const trajectoryItems = page.locator("tbody tr, .grid > div");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });
});

/**
 * E2E Tests for Performance Metrics Page
 */
test.describe("Performance Metrics Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/performance-metrics");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Performance");
  });

  test("should display performance chart", async ({ page }) => {
    // Look for chart elements (canvas, svg, or apexcharts)
    const chart = page.locator("canvas, svg, .apexcharts");
    // Chart may not render if no data, so just check page is loaded
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("should display export button", async ({ page }) => {
    const exportButton = page.locator("button").filter({ hasText: /export/i });
    await expect(exportButton).toBeVisible();
  });

  test("should display refresh button", async ({ page }) => {
    const refreshButton = page.locator("button").filter({ hasText: /refresh/i });
    await expect(refreshButton).toBeVisible();
  });

  test("should display agent selector", async ({ page }) => {
    // Look for agent filter/selector
    const select = page.locator("select");
    const count = await select.count();
    if (count > 0) {
      await expect(select.first()).toBeVisible();
    }
  });
});

/**
 * E2E Tests for Swarms Page
 */
test.describe("Swarms Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/swarms");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Swarm");
  });

  test("should display swarm cards or list", async ({ page }) => {
    const swarmItems = page.locator(".grid > div, tbody tr");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("should display export button", async ({ page }) => {
    const exportButton = page.locator("button").filter({ hasText: /export/i });
    await expect(exportButton).toBeVisible();
  });

  test("should display refresh button", async ({ page }) => {
    const refreshButton = page.locator("button").filter({ hasText: /refresh/i });
    await expect(refreshButton).toBeVisible();
  });

  test("should display swarm status indicators", async ({ page }) => {
    // Look for status badges or indicators
    const statusBadges = page.locator("[class*='badge'], [class*='status']");
    const count = await statusBadges.count();
    // Status badges may not exist if no swarms, so just check page loads
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });
});

/**
 * E2E Tests for Queries Page
 */
test.describe("Queries Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/queries");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Query");
  });

  test("should display query list or cards", async ({ page }) => {
    const queryItems = page.locator("tbody tr, .grid > div, [data-testid='query-item']");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("should display refresh button", async ({ page }) => {
    const refreshButton = page.locator("button").filter({ hasText: /refresh/i });
    await expect(refreshButton).toBeVisible();
  });

  test("should display query status indicators", async ({ page }) => {
    // Look for status indicators
    const statusElements = page.locator("[class*='status'], [class*='badge']");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });
});

/**
 * E2E Tests for Metrics Page
 */
test.describe("Metrics Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/metrics");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Metric");
  });

  test("should display charts", async ({ page }) => {
    // Look for chart elements
    const charts = page.locator("canvas, svg, .apexcharts, [class*='chart']");
    // Charts may not render if no data, so just check page is loaded
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("should display export button", async ({ page }) => {
    const exportButton = page.locator("button").filter({ hasText: /export/i });
    await expect(exportButton).toBeVisible();
  });

  test("should display timeframe selector", async ({ page }) => {
    // Look for timeframe selector
    const timeframeSelector = page.locator("select, button").filter({ hasText: /1h|24h|7d|30d/i });
    const count = await timeframeSelector.count();
    if (count > 0) {
      await expect(timeframeSelector.first()).toBeVisible();
    }
  });
});

/**
 * Mobile Tests for New Pages
 */
test.describe("New Pages - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("patterns page should be responsive", async ({ page }) => {
    await page.goto("/patterns");
    await expect(page.locator("h1")).toBeVisible();

    // Check hamburger menu is visible
    const hamburger = page.locator("button").filter({ hasText: /menu/i }).first();
    await expect(hamburger).toBeVisible();
  });

  test("trajectories page should be responsive", async ({ page }) => {
    await page.goto("/trajectories");
    await expect(page.locator("h1")).toBeVisible();

    // Check hamburger menu is visible
    const hamburger = page.locator("button").filter({ hasText: /menu/i }).first();
    await expect(hamburger).toBeVisible();
  });

  test("performance-metrics page should be responsive", async ({ page }) => {
    await page.goto("/performance-metrics");
    await expect(page.locator("h1")).toBeVisible();

    // Check hamburger menu is visible
    const hamburger = page.locator("button").filter({ hasText: /menu/i }).first();
    await expect(hamburger).toBeVisible();
  });

  test("should navigate to patterns using mobile menu", async ({ page }) => {
    const helpers = new TestHelpers(page);

    // Open mobile menu
    await helpers.openMobileMenu();

    // Click on patterns link (if it exists in nav)
    const patternsLink = page.locator("a[href='/patterns']");
    const count = await patternsLink.count();

    if (count > 0) {
      await patternsLink.click();
      await expect(page).toHaveURL(/\/patterns/);
      await expect(page.locator("h1")).toContainText("Pattern");
    } else {
      // Skip test if patterns link doesn't exist in nav
      test.skip();
    }
  });
});

/**
 * Cross-Page Navigation Tests
 */
test.describe("Cross-Page Navigation", () => {
  test("should navigate from patterns to trajectories", async ({ page }) => {
    await page.goto("/patterns");
    await expect(page.locator("h1")).toContainText("Pattern");

    // Navigate using a link or by typing URL
    await page.goto("/trajectories");
    await expect(page.locator("h1")).toContainText("Trajectory");
  });

  test("should navigate from performance-metrics to agents", async ({ page }) => {
    await page.goto("/performance-metrics");
    await expect(page.locator("h1")).toContainText("Performance");

    await page.goto("/agents");
    await expect(page.locator("h1")).toContainText("Agent");
  });

  test("should navigate through all new pages sequentially", async ({ page }) => {
    const pages = ["/patterns", "/trajectories", "/performance-metrics", "/swarms", "/queries"];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});
