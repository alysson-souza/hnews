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
    test('should display story items', async ({ storiesPage }) => {
      await storiesPage.navigateToTop();
      const count = await storiesPage.getStoryCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should display story titles', async ({ storiesPage }) => {
      await storiesPage.navigateToTop();
      const title = await storiesPage.getStoryTitle(0);
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should navigate to story details when clicked', async ({ storiesPage }) => {
      await storiesPage.navigateToTop();
      const storyLink = storiesPage.storyItems.first().locator('a[href*="/item/"]');
      const href = await storyLink.getAttribute('href');
      expect(href).toMatch(/\/item\/\d+/);
    });

    test('should load more stories when Load More is clicked', async ({ storiesPage }) => {
      await storiesPage.navigateToTop();
      const initialCount = await storiesPage.getStoryCount();

      if (await storiesPage.loadMoreButton.isVisible()) {
        await storiesPage.loadMoreStories();
        await storiesPage.page.waitForTimeout(2000);
        const newCount = await storiesPage.getStoryCount();
        expect(newCount).toBeGreaterThanOrEqual(initialCount);
      }
    });
  });

  test.describe('Refresh', () => {
    test('should refresh stories', async ({ storiesPage }) => {
      await storiesPage.navigateToTop();
      await storiesPage.page.waitForTimeout(1000);

      if (await storiesPage.refreshButton.isVisible()) {
        await storiesPage.refreshStories();
        const count = await storiesPage.getStoryCount();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ storiesPage, page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await storiesPage.navigateToTop();
      const count = await storiesPage.getStoryCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should display properly on tablet', async ({ storiesPage, page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await storiesPage.navigateToTop();
      const count = await storiesPage.getStoryCount();
      expect(count).toBeGreaterThan(0);
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
      const commentsSection = newPage.locator('text=Comments');
      await expect(commentsSection).toBeVisible({ timeout: 10000 });

      await newPage.close();
    });
  });
});
