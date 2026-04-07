import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures/pages.fixture';

async function selectStoryWithNestedLink(
  storiesPage: { storyItems: Locator; getStoryCount(): Promise<number> },
  page: Page,
): Promise<{ index: number; nestedLink: Locator }> {
  const storyCount = await storiesPage.getStoryCount();

  for (let index = 0; index < storyCount; index++) {
    const storyItem = storiesPage.storyItems.nth(index);
    const nestedLink = storyItem.locator('.story-link-trigger a').first();

    if ((await nestedLink.count()) > 0) {
      for (let i = 0; i <= index; i++) {
        await page.keyboard.press('j');
        await page.waitForTimeout(150);
      }

      await expect(storyItem.locator('article')).toHaveClass(/story-card-selected/);

      return { index, nestedLink };
    }
  }

  throw new Error('No story with a nested story link found');
}

async function getSelectedStoryIndex(page: Page): Promise<number | null> {
  return await page.evaluate(() => {
    const selectedStory = document.querySelector('article.story-card-selected');
    const storyItem = selectedStory?.closest('app-story-item');
    const index = storyItem?.getAttribute('data-story-index');

    return index === null ? null : Number(index);
  });
}

async function selectLastStory(
  storiesPage: { getStoryCount(): Promise<number> },
  page: Page,
): Promise<number> {
  const storyCount = await storiesPage.getStoryCount();
  const targetIndex = storyCount - 1;

  for (let i = 0; i < storyCount + 2; i++) {
    const selectedIndex = await getSelectedStoryIndex(page);
    if (selectedIndex === targetIndex) {
      break;
    }

    await page.keyboard.press('j');
    await page.waitForTimeout(100);
  }

  await expect(storiesPage.storyItems.nth(targetIndex).locator('article')).toHaveClass(
    /story-card-selected/,
  );

  return storyCount;
}

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

  test('should load more stories with j on the last story', async ({
    storiesPage,
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    const initialCount = await selectLastStory(storiesPage, page);

    await page.keyboard.press('j');
    await page.waitForFunction(
      (count) => document.querySelectorAll('app-story-item').length > count,
      initialCount,
      { timeout: 10000 },
    );

    const newCount = await storiesPage.getStoryCount();
    expect(newCount).toBeGreaterThan(initialCount);
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

    const initialUrl = page.url();
    await selectStoryWithNestedLink(storiesPage, page);

    const pagePromise = page.context().waitForEvent('page', { timeout: 5000 });
    await page.keyboard.press('Shift+O');
    const newPage = await pagePromise;

    expect(newPage.url()).not.toBe(initialUrl);
    await newPage.close();
  });

  test('should open story with o key', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    const initialUrl = page.url();
    await selectStoryWithNestedLink(storiesPage, page);

    const pagePromise = page
      .context()
      .waitForEvent('page', { timeout: 5000 })
      .catch(() => null);
    await page.keyboard.press('o');
    const newPage = await pagePromise;

    if (newPage) {
      expect(newPage.url()).not.toBe(initialUrl);
      await newPage.close();
    } else {
      await page.waitForTimeout(500);
      expect(page.url()).not.toBe(initialUrl);
    }
  });

  test('should restore focus to the story item when closing actions menu with a', async ({
    storiesPage,
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    const { index } = await selectStoryWithNestedLink(storiesPage, page);
    const storyCard = storiesPage.storyItems.nth(index).locator('article.story-card');

    await page.keyboard.press('a');
    await page.waitForTimeout(300);

    const actionsMenu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(actionsMenu).toBeVisible();

    await page.keyboard.press('a');
    await page.waitForTimeout(300);

    await expect(actionsMenu).not.toBeVisible();
    await expect(storyCard).toBeFocused();
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
