import { test, expect } from '../fixtures/pages.fixture';

test.describe('Visited Stories and Filtering', () => {
  test.describe('Visited Stories', () => {
    test('should mark story as visited after clicking', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();

      // Get the story ID of the first story to track it
      const firstStory = storiesPage.storyItems.first();
      const storyId = await firstStory.getAttribute('data-story-id');

      // Navigate directly to the item page to mark it as visited
      await page.goto(`/item/${storyId}`);
      await page.waitForLoadState('networkidle');

      // Go back to the stories list
      await page.goto('/top');
      await page.waitForLoadState('networkidle');

      // Assert the same story now has visited class
      const visitedStory = page.locator(`[data-story-id="${storyId}"] .story-title`);
      await expect(visitedStory).toHaveClass(/story-title-visited/, { timeout: 10000 });
    });

    test('should persist visited state across reload', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();

      // Get the story ID to track it
      const firstStory = storiesPage.storyItems.first();
      const storyId = await firstStory.getAttribute('data-story-id');

      // Navigate to the item page to mark it as visited
      await page.goto(`/item/${storyId}`);
      await page.waitForLoadState('networkidle');

      // Go back to the stories list
      await page.goto('/top');
      await page.waitForLoadState('networkidle');

      const visitedStory = page.locator(`[data-story-id="${storyId}"] .story-title`);
      await expect(visitedStory).toHaveClass(/story-title-visited/, { timeout: 10000 });

      // Reload the page and verify visited state persists
      await page.reload();
      await page.waitForLoadState('networkidle');

      const reloadedTitle = page.locator(`[data-story-id="${storyId}"] .story-title`);
      await expect(reloadedTitle).toHaveClass(/story-title-visited/, { timeout: 10000 });
    });
  });

  test.describe('Story Filter', () => {
    test('should display segmented control filter', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();

      const segmentedControl = page.locator('app-segmented-control');
      await expect(segmentedControl).toBeVisible();

      const tabs = page.locator('[role="tab"]');
      const defaultTab = tabs.filter({ hasText: 'Default' });
      const topHalfTab = tabs.filter({ hasText: 'Top 50%' });

      await expect(defaultTab).toBeVisible();
      await expect(topHalfTab).toBeVisible();
    });

    test('should toggle to Top 50% filter', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();

      const topHalfTab = page.locator('[role="tab"]').filter({ hasText: 'Top 50%' });
      await topHalfTab.click();
      await page.waitForTimeout(300);

      await expect(topHalfTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should return to Default filter', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();

      // First activate Top 50%
      const topHalfTab = page.locator('[role="tab"]').filter({ hasText: 'Top 50%' });
      await topHalfTab.click();
      await page.waitForTimeout(300);
      await expect(topHalfTab).toHaveAttribute('aria-selected', 'true');

      // Then click Default
      const defaultTab = page.locator('[role="tab"]').filter({ hasText: 'Default' });
      await defaultTab.click();
      await page.waitForTimeout(300);

      await expect(defaultTab).toHaveAttribute('aria-selected', 'true');
      await expect(topHalfTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  test.describe('URL Deep Linking', () => {
    test('should handle /item?id=N query param (HN compat)', async ({ page }) => {
      await page.goto('/item?id=40224596');
      await page.waitForLoadState('networkidle');

      const storyTitle = page.locator('h1.story-title').first();
      await expect(storyTitle).toBeVisible({ timeout: 10000 });

      const titleText = await storyTitle.textContent();
      expect(titleText).toBeTruthy();
      expect(titleText!.length).toBeGreaterThan(0);
    });

    test('should handle /user?id=pg query param (HN compat)', async ({ page }) => {
      await page.goto('/user?id=pg');
      await page.waitForLoadState('networkidle');

      const username = page.locator('h1').first();
      await expect(username).toBeVisible({ timeout: 10000 });

      const usernameText = await username.textContent();
      expect(usernameText?.toLowerCase()).toContain('pg');
    });

    test('should redirect /news to /top', async ({ page }) => {
      await page.goto('/news');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/top/);
    });
  });
});
