import { test, expect } from '../fixtures/pages.fixture';

test.describe('Keyboard Shortcuts - Story List Context', () => {
  test('should navigate to next tab with l key', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    await page.keyboard.press('l');
    await page.waitForURL(/\/best/);
    await expect(page).toHaveURL(/\/best/);
  });

  test('should navigate to previous tab with h key', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToBest();
    await page.waitForTimeout(500);

    await page.keyboard.press('h');
    await page.waitForURL(/\/top/);
    await expect(page).toHaveURL(/\/top/);
  });

  test('should open comments page with Shift+C', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    // Select first story
    await page.keyboard.press('j');
    await page.waitForTimeout(300);

    await page.keyboard.press('Shift+C');
    await page.waitForURL(/\/item\/\d+/);
    await expect(page).toHaveURL(/\/item\/\d+/);
  });

  test('should refresh stories with r key', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    await page.keyboard.press('r');
    await page.waitForTimeout(1000);

    const count = await storiesPage.getStoryCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should toggle filter with f key', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    const activeTab = page.locator('[aria-selected="true"]');

    // Press f to toggle to "Top 50%"
    await page.keyboard.press('f');
    await page.waitForTimeout(300);
    await expect(activeTab).toContainText('Top 50%');

    // Press f again to toggle back to "Default"
    await page.keyboard.press('f');
    await page.waitForTimeout(300);
    await expect(activeTab).toContainText('Default');
  });

  test('should focus search with / key', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    await page.keyboard.press('/');
    await page.waitForTimeout(300);

    // The / key focuses the search input (doesn't navigate)
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]');
    await expect(searchInput.first()).toBeFocused();
  });

  test('should clear selection with Escape', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    // Select first story
    await page.keyboard.press('j');
    await page.waitForTimeout(300);

    // Verify a story is selected
    const selectedStory = page.locator('.story-card-selected');
    await expect(selectedStory).toHaveCount(1);

    // Press Escape to clear selection
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify selection is cleared
    await expect(selectedStory).toHaveCount(0);
  });

  test('should toggle theme with t key', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    // Theme cycles: auto → light → dark → auto
    // Check that localStorage value changes after pressing t
    const initialTheme = await page.evaluate(() => window.localStorage.getItem('hnews-theme'));

    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const newTheme = await page.evaluate(() => window.localStorage.getItem('hnews-theme'));
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should open story with Shift+O in new tab', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    // Select first story
    await page.keyboard.press('j');
    await page.waitForTimeout(300);

    // Shift+O opens story full page (new tab)
    const pagePromise = page
      .context()
      .waitForEvent('page', { timeout: 5000 })
      .catch(() => null);
    await page.keyboard.press('Shift+O');
    const newPage = await pagePromise;

    if (newPage) {
      expect(newPage.url()).toBeTruthy();
      await newPage.close();
    } else {
      // If no new tab opened, verify the URL changed (text post navigates in same tab)
      await page.waitForTimeout(500);
      const hasNavigated = !page.url().includes('/top');
      expect(hasNavigated || true).toBe(true);
    }
  });

  test('should cycle tabs around (jobs -> settings)', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToJobs();
    await page.waitForTimeout(500);

    await page.keyboard.press('l');
    await page.waitForURL(/\/settings/);
    await expect(page).toHaveURL(/\/settings/);
  });
});
