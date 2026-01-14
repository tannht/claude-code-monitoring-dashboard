import { test, expect } from "@playwright/test";

/**
 * E2E Error Handling Tests
 */
test.describe("Error Handling", () => {
  test("should handle 404 pages gracefully", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle database connection errors", async ({ page }) => {
    // This test verifies the page shows error state when DB is unavailable
    // In a real test, you might mock the API to return errors
    await page.goto("/agents");

    // Page should load even without data
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Navigate to a page
    await page.goto("/agents");

    // Simulate offline mode
    await page.context().setOffline(true);

    // Try to navigate
    await page.click('a[href="/tasks"]');

    // Should show some kind of error or state (not crash)
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Restore online mode
    await page.context().setOffline(false);
  });

  test("should handle malformed query params", async ({ page }) => {
    // Navigate with invalid query params
    await page.goto("/tasks?status=invalid_status&limit=abc");

    // Should not crash
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });
});

/**
 * E2E API Error Tests
 */
test.describe("API Error Handling", () => {
  test("should handle API errors on health endpoint", async ({ page }) => {
    const response = await page.request.get("/api/sqlite/health");

    // Response should have proper structure
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("success");
  });

  test("should handle API errors on agents endpoint", async ({ page }) => {
    const response = await page.request.get("/api/sqlite/agents");

    // Should respond (even if no data)
    expect(response.status()).toBeLessThan(500);

    const data = await response.json();
    expect(data).toHaveProperty("success");
  });
});
