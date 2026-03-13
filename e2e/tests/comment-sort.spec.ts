import { test, expect } from '../fixtures/pages.fixture';

test.describe('Comment Sort', () => {
  test('should display sort dropdown on item page', async ({ itemPage, page }) => {
    await itemPage.navigateToItem(40224596);
    await page.waitForTimeout(2000);

    const sortDropdown = page.locator('select[aria-label="Sort comments"]');
    await expect(sortDropdown).toBeVisible();
  });

  test('should default to "default" sort order', async ({ itemPage, page }) => {
    await itemPage.navigateToItem(40224596);
    await page.waitForTimeout(2000);

    const sortDropdown = page.locator('select[aria-label="Sort comments"]');
    await expect(sortDropdown).toHaveValue('default');
  });

  test('should change sort to newest', async ({ itemPage, page }) => {
    await itemPage.navigateToItem(40224596);
    await page.waitForTimeout(2000);

    const sortDropdown = page.locator('select[aria-label="Sort comments"]');
    await sortDropdown.selectOption('newest');
    await page.waitForTimeout(500);

    await expect(sortDropdown).toHaveValue('newest');
  });

  test('should change sort to popular', async ({ itemPage, page }) => {
    await itemPage.navigateToItem(40224596);
    await page.waitForTimeout(2000);

    const sortDropdown = page.locator('select[aria-label="Sort comments"]');
    await sortDropdown.selectOption('popular');
    await page.waitForTimeout(500);

    await expect(sortDropdown).toHaveValue('popular');
  });

  test('should change sort to oldest', async ({ itemPage, page }) => {
    await itemPage.navigateToItem(40224596);
    await page.waitForTimeout(2000);

    const sortDropdown = page.locator('select[aria-label="Sort comments"]');
    await sortDropdown.selectOption('oldest');
    await page.waitForTimeout(500);

    await expect(sortDropdown).toHaveValue('oldest');
  });
});
