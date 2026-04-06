import { test, expect } from "@playwright/test";

test.describe("Search flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for initial load (empty query returns all items)
    await expect(page.getByLabel(/^Media item/).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("loads all items on initial visit", async ({ page }) => {
    // Empty query returns all 10K items, paginated to 20
    await expect(page.getByLabel(/^Media item/)).toHaveCount(20);
    await expect(page.getByLabel("Search results pagination")).toBeVisible();
  });

  test("searches for a term and displays matching results", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search media items");
    await searchInput.fill("football");

    // Wait for debounce + API response
    const pagination = page.getByLabel("Search results pagination");
    await expect(pagination).toBeVisible({ timeout: 10_000 });

    // Result count in search bar (exact match to avoid ambiguity with footer)
    await expect(
      page.getByText(/^\d[\d,]* results$/).first(),
    ).toBeVisible();

    // Cards are rendered
    await expect(page.getByLabel(/^Media item/).first()).toBeVisible();
  });

  test("paginates to next page", async ({ page }) => {
    const searchInput = page.getByLabel("Search media items");
    await searchInput.fill("football");

    // Wait for page 1
    await expect(page.getByText(/Page 1 of \d+/)).toBeVisible({
      timeout: 10_000,
    });

    // Navigate to page 2
    await page.getByLabel("Next page").click();
    await expect(page.getByText(/Page 2 of \d+/)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows no-results state for gibberish query", async ({ page }) => {
    const searchInput = page.getByLabel("Search media items");
    await searchInput.fill("xyzzyqwert123456");

    await expect(page.getByText(/No results found for/)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("clear button resets search to all items", async ({ page }) => {
    const searchInput = page.getByLabel("Search media items");
    await searchInput.fill("football");

    // Wait for filtered results
    await expect(page.getByLabel("Search results pagination")).toBeVisible({
      timeout: 10_000,
    });

    // Clear search
    await page.getByLabel("Clear search").click();

    // Should return to all items (10K total)
    await expect(
      page.getByText("10,000 results", { exact: true }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sort order cycles through relevance, asc, desc", async ({ page }) => {
    const sortButton = page.getByLabel(/Sort by date/);
    await expect(sortButton).toContainText("Relevance");

    await sortButton.click();
    await expect(sortButton).toContainText("Date (oldest first)");

    await sortButton.click();
    await expect(sortButton).toContainText("Date (newest first)");

    await sortButton.click();
    await expect(sortButton).toContainText("Relevance");
  });
});
