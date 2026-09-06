import { test, expect } from '../fixtures/pages.fixture';

test.describe('Stories Page', () => {
  test.describe('Navigation', () => {
    test('should load top stories by default', async ({ storiesPage }) => {
      await storiesPage.navigateToTop();
      await expect(storiesPage.page).toHaveURL(/\/top/);
      const count = await storiesPage.getStoryCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should navigate to different story feeds', async ({ storiesPage }) => {
      await storiesPage.navigateToNew();
      await expect(storiesPage.page).toHaveURL(/\/newest/);

      await storiesPage.navigateToBest();
      await expect(storiesPage.page).toHaveURL(/\/best/);

      await storiesPage.navigateToAsk();
      await expect(storiesPage.page).toHaveURL(/\/ask/);

      await storiesPage.navigateToShow();
      await expect(storiesPage.page).toHaveURL(/\/show/);

      await storiesPage.navigateToJobs();
      await expect(storiesPage.page).toHaveURL(/\/jobs/);
    });
  });

  test.describe('Story List', () => {
    test('displays story titles', async ({ storiesPage }) => {
      await storiesPage.navigateToTop();
      await expect(storiesPage.storyItems.first().locator('.story-title')).toHaveText(/\S/);
    });

    test('loads more stories when Load More is clicked', async ({ storiesPage }) => {
      await storiesPage.navigateToTop();
      const initialCount = await storiesPage.getStoryCount();

      await expect(storiesPage.loadMoreButton).toBeVisible();
      await storiesPage.loadMoreStories();

      await expect
        .poll(() => storiesPage.getStoryCount(), { timeout: 15_000 })
        .toBeGreaterThan(initialCount);
    });
  });

  test.describe('Responsive Design', () => {
    for (const viewport of [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
    ]) {
      test(`renders without horizontal overflow at ${viewport.width}px`, async ({
        storiesPage,
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await storiesPage.navigateToTop();

        await expect(storiesPage.storyItems.first()).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);
      });
    }

    test('should keep the footer source icon constrained before stylesheets load', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.route('**/*', async (route) => {
        if (route.request().resourceType() === 'stylesheet') {
          await route.abort();
          return;
        }

        await route.continue();
      });

      await page.goto('/top');

      const sourceIcon = page
        .getByRole('link', { name: 'View Source Code On GitHub' })
        .locator('svg');
      await expect(sourceIcon).toBeVisible();

      const sourceIconBox = await sourceIcon.boundingBox();
      expect(sourceIconBox).not.toBeNull();
      expect(sourceIconBox?.width).toBeLessThanOrEqual(32);
      expect(sourceIconBox?.height).toBeLessThanOrEqual(32);
    });
  });

  test.describe('Comments Link', () => {
    test('should navigate to item page when shift+clicking comments link', async ({
      storiesPage,
    }) => {
      await storiesPage.navigateToTop();
      const count = await storiesPage.getStoryCount();
      expect(count).toBeGreaterThan(0);

      // Find first story with comments
      let storyWithComments = -1;
      for (let i = 0; i < Math.min(count, 10); i++) {
        const commentsText = await storiesPage.getCommentsLinkText(i);
        if (commentsText && !commentsText.includes('0 comments')) {
          storyWithComments = i;
          break;
        }
      }

      // If no story with comments found, just use the first story
      if (storyWithComments === -1) {
        storyWithComments = 0;
      }

      // Shift+click the comments link
      const newPage = await storiesPage.shiftClickCommentsLink(storyWithComments);

      // Verify the new page has the correct URL (/item/:id, not /top)
      expect(newPage.url()).toMatch(/\/item\/\d+/);
      expect(newPage.url()).not.toMatch(/\/top/);

      // Verify the item page loads correctly by checking for comments section
      const commentsSection = newPage.getByRole('heading', { name: /Comments/ });
      await expect(commentsSection).toBeVisible({ timeout: 10000 });

      await newPage.close();
    });
  });
});
