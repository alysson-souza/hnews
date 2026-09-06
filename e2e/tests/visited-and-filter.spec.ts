import { test, expect, Page } from '../fixtures/pages.fixture';
import { StoriesPage } from '../page-objects/stories.page';
import { MAIN_STORY_ID } from '../fixtures/hn-fixture-data';

test.describe('Visited Stories and Filtering', () => {
  /** Visits the first story's item page so the visited service records it. */
  async function markFirstStoryVisited(storiesPage: StoriesPage, page: Page): Promise<string> {
    await storiesPage.navigateToTop();
    const storyId = await storiesPage.storyItems.first().getAttribute('data-story-id');

    await page.goto(`/item/${storyId}`);
    await page.getByRole('heading', { name: /Comments/ }).waitFor({ timeout: 15_000 });

    await page.goto('/top');
    await storiesPage.storyItems.first().waitFor({ timeout: 15_000 });
    return storyId!;
  }

  test.describe('Visited Stories', () => {
    test('should mark story as visited after clicking', async ({ storiesPage, page }) => {
      const storyId = await markFirstStoryVisited(storiesPage, page);

      const visitedStory = page.locator(`[data-story-id="${storyId}"] .story-title`);
      await expect(visitedStory).toHaveClass(/story-title-visited/, { timeout: 10000 });
    });

    test('should persist visited state across reload', async ({ storiesPage, page }) => {
      const storyId = await markFirstStoryVisited(storiesPage, page);

      const visitedStory = page.locator(`[data-story-id="${storyId}"] .story-title`);
      await expect(visitedStory).toHaveClass(/story-title-visited/, { timeout: 10000 });

      // Reload the page and verify visited state persists
      await page.reload();
      await storiesPage.storyItems.first().waitFor({ timeout: 15_000 });

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

      await expect(topHalfTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should reveal Top 50% only after the complete pool is prepared', async ({
      storiesPage,
      page,
    }) => {
      await storiesPage.navigateToTop();

      let releaseExpandedPool = () => {};
      const expandedPoolGate = new Promise<void>((resolve) => {
        releaseExpandedPool = resolve;
      });
      const itemRoute = '**/v0/item/*.json';
      await page.route(itemRoute, async (route) => {
        await expandedPoolGate;
        await route.continue();
      });

      try {
        const topHalfTab = page.getByRole('tab', { name: 'Top 50%' });
        await topHalfTab.click();

        const preparingStatus = page.getByRole('status', {
          name: 'Preparing Top 50% stories',
        });
        await expect(topHalfTab).toHaveAttribute('aria-selected', 'true');
        await expect(topHalfTab).toBeDisabled();
        await expect(preparingStatus).toBeVisible();
        await expect(storiesPage.storyItems).toHaveCount(0);
        await expect(page.getByText('Loading more stories...')).toHaveCount(0);

        releaseExpandedPool();

        await expect(preparingStatus).toBeHidden();
        await expect(topHalfTab).toBeEnabled();
        await expect.poll(() => storiesPage.storyItems.count()).toBeGreaterThan(0);
      } finally {
        releaseExpandedPool();
        await page.unroute(itemRoute);
      }
    });

    test('should return to Default filter', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();

      // First activate Top 50%
      const topHalfTab = page.locator('[role="tab"]').filter({ hasText: 'Top 50%' });
      await topHalfTab.click();
      await expect(topHalfTab).toHaveAttribute('aria-selected', 'true');

      // Then click Default
      const defaultTab = page.locator('[role="tab"]').filter({ hasText: 'Default' });
      await defaultTab.click();

      await expect(defaultTab).toHaveAttribute('aria-selected', 'true');
      await expect(topHalfTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  test.describe('URL Deep Linking', () => {
    test('should handle /item?id=N query param (HN compat)', async ({ page, hnDataset }) => {
      // `h1.story-title` ("Discussion") only renders for a comment-type item
      // page (see item.component.html), so this must deep-link to a fixture
      // comment, not the story itself.
      const commentId = hnDataset.items.get(MAIN_STORY_ID)?.kids?.[0];
      expect(commentId).toBeDefined();

      await page.goto(`/item?id=${commentId}`);

      await expect(page.locator('h1.story-title').first()).toBeVisible({ timeout: 15_000 });
    });

    test('should handle /user?id=pg query param (HN compat)', async ({ page }) => {
      await page.goto('/user?id=pg');

      const username = page.locator('h1').first();
      await expect(username).toBeVisible({ timeout: 15_000 });

      const usernameText = await username.textContent();
      expect(usernameText?.toLowerCase()).toContain('pg');
    });

    test('should redirect /news to /top', async ({ page }) => {
      await page.goto('/news');

      await expect(page).toHaveURL(/\/top/, { timeout: 15_000 });
    });
  });
});
