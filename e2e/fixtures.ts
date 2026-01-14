import { test, expect, type Page } from "@playwright/test";

/**
 * Base URL for the application
 */
export const BASE_URL = process.env.BASE_URL || "http://localhost:8800";

export { test, expect };

/**
 * Common locators used across tests
 */
export class CommonLocators {
  constructor(public page: Page) {}

  get hamburgerButton() {
    return this.page.locator("button").filter({ hasText: /menu/i }).first();
  }

  get mobileMenu() {
    return this.page.locator(".fixed").filter({ hasText: /Navigation/i });
  }

  get desktopNav() {
    return this.page.locator("nav").first();
  }

  get exportButton() {
    return this.page.locator("button").filter({ hasText: /export/i });
  }

  get refreshButton() {
    return this.page.locator("button").filter({ hasText: /refresh/i });
  }

  get pageHeading() {
    return this.page.locator("h1");
  }

  get statusCards() {
    return this.page.locator(".grid > div");
  }
}

/**
 * Helper functions for common test operations
 */
export class TestHelpers {
  constructor(public page: Page) {}

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Wait for data to load (checks for loading spinner to disappear)
   */
  async waitForDataLoad() {
    // Wait for any loading indicators to disappear
    const loadingSpinner = this.page.locator(".animate-spin, [role='progressbar']");
    try {
      await loadingSpinner.waitFor({ state: "hidden", timeout: 5000 });
    } catch {
      // No loading spinner or it's already hidden
    }
  }

  /**
   * Take a screenshot on failure
   */
  async screenshotOnFailure(testInfo: any) {
    if (testInfo.status !== "passed") {
      await this.page.screenshot({
        path: `screenshots/${testInfo.title}.png`,
        fullPage: true,
      });
    }
  }

  /**
   * Open mobile menu
   */
  async openMobileMenu() {
    const locators = new CommonLocators(this.page);
    await locators.hamburgerButton.click();
    await locators.mobileMenu.waitFor({ state: "visible" });
  }

  /**
   * Close mobile menu
   */
  async closeMobileMenu() {
    const locators = new CommonLocators(this.page);
    const closeButton = this.page.locator("button[aria-label*='close' i], button[aria-label*='menu' i]").last();
    await closeButton.click();
    await locators.mobileMenu.waitFor({ state: "hidden" });
  }

  /**
   * Navigate to a page using mobile menu
   */
  async navigateWithMobileMenu(path: string) {
    await this.openMobileMenu();
    await this.page.click(`a[href="${path}"]`);
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Get all navigation links
   */
  getNavLinks() {
    return this.page.locator("nav a, [role='navigation'] a");
  }

  /**
   * Check if element is in viewport
   */
  async isInViewport(selector: string) {
    const element = this.page.locator(selector).first();
    const boundingBox = await element.boundingBox();
    if (!boundingBox) return false;

    const viewportSize = this.page.viewportSize();
    if (!viewportSize) return false;

    return (
      boundingBox.y >= 0 &&
      boundingBox.x >= 0 &&
      boundingBox.y + boundingBox.height <= viewportSize.height &&
      boundingBox.x + boundingBox.width <= viewportSize.width
    );
  }
}

/**
 * Page-specific helpers
 */
export class DashboardHelpers extends TestHelpers {
  /**
   * Navigate to each main page and verify it loads
   */
  async verifyAllPagesLoad() {
    const pages = ["/", "/agents", "/tasks", "/alerts", "/status", "/settings"];

    for (const pagePath of pages) {
      await this.navigateTo(pagePath);
      const heading = this.page.locator("h1");
      await heading.waitFor({ state: "visible", timeout: 5000 });
    }
  }
}

export class AgentsPageHelpers extends TestHelpers {
  /**
   * Get agent summary cards
   */
  getAgentCards() {
    return this.page.locator(".grid > div");
  }

  /**
   * Filter agents by status
   */
  async filterByStatus(status: string) {
    const filterButton = this.page.locator("button").filter({ hasText: new RegExp(status, "i") });
    await filterButton.click();
  }
}

export class TasksPageHelpers extends TestHelpers {
  /**
   * Filter tasks by status
   */
  async filterByStatus(status: string) {
    const filterButton = this.page.locator("button").filter({ hasText: new RegExp(status, "i") });
    await filterButton.click();
  }

  /**
   * Get task cards/rows
   */
  getTaskItems() {
    return this.page.locator("[data-testid='task-item'], .grid > div, tbody tr");
  }
}

export class AlertsPageHelpers extends TestHelpers {
  /**
   * Filter alerts by severity
   */
  async filterBySeverity(severity: string) {
    const filterButton = this.page.locator("button").filter({ hasText: new RegExp(severity, "i") });
    await filterButton.click();
  }

  /**
   * Get alert items
   */
  getAlertItems() {
    return this.page.locator("tbody tr, [data-testid='alert-item']");
  }
}
