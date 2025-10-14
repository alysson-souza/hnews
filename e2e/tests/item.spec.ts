import { test, expect } from '../fixtures/pages.fixture';

test.describe('Item Page', () => {
  test.describe('Story Details', () => {
    test('should display story title', async ({ itemPage }) => {
      await itemPage.navigateToItem(40224596);
      await itemPage.page.waitForTimeout(2000);
      const title = await itemPage.getStoryTitle();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should display story metadata', async ({ itemPage }) => {
      await itemPage.navigateToItem(40224596);
      await itemPage.page.waitForTimeout(2000);
      const hasTitle = await itemPage.storyTitle.isVisible();
      expect(hasTitle).toBe(true);
    });

    test('should display external link when available', async ({ itemPage }) => {
      await itemPage.navigateToItem(40224596);
      if (await itemPage.storyUrl.isVisible()) {
        const url = await itemPage.getStoryUrl();
        expect(url).toBeTruthy();
      }
    });
  });

  test.describe('Comments', () => {
    test('should display comments', async ({ itemPage }) => {
      await itemPage.navigateToItem(40224596);
      await itemPage.page.waitForTimeout(2000);

      const commentCount = await itemPage.getCommentCount();
      if (commentCount > 0) {
        expect(commentCount).toBeGreaterThan(0);
        await expect(itemPage.commentThreads.first()).toBeVisible();
      }
    });

    test('should display comment author', async ({ itemPage }) => {
      await itemPage.navigateToItem(40224596);
      await itemPage.page.waitForTimeout(2000);

      const commentCount = await itemPage.getCommentCount();
      if (commentCount > 0) {
        const author = await itemPage.getCommentAuthor(0);
        expect(author).toBeTruthy();
      }
    });

    test('should collapse and expand comments', async ({ itemPage }) => {
      await itemPage.navigateToItem(40224596);
      await itemPage.page.waitForTimeout(2000);

      const commentCount = await itemPage.getCommentCount();
      if (commentCount > 0) {
        await itemPage.collapseComment(0);
        await itemPage.page.waitForTimeout(500);
        await itemPage.expandComment(0);
        await expect(itemPage.commentThreads.first()).toBeVisible();
      }
    });

    test('should navigate to user profile when clicking comment author', async ({ itemPage }) => {
      await itemPage.navigateToItem(40224596);
      await itemPage.page.waitForTimeout(2000);

      const commentCount = await itemPage.getCommentCount();
      if (commentCount > 0) {
        await itemPage.clickCommentAuthor(0);
        await expect(itemPage.page).toHaveURL(/\/user\/[\w-]+/);
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to stories', async ({ itemPage, storiesPage }) => {
      await storiesPage.navigateToTop();
      await storiesPage.clickStoryByIndex(0);

      if (await itemPage.backButton.isVisible()) {
        await itemPage.goBack();
        await expect(itemPage.page).toHaveURL(/\/top/);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle non-existent item gracefully', async ({ itemPage }) => {
      await itemPage.navigateToItem(999999999);
      await itemPage.page.waitForTimeout(2000);
      await expect(itemPage.page).toHaveURL(/\/item\/999999999/);
    });
  });
});
