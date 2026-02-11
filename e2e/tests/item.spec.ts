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

    test('should open thread at top and navigate back to the previous item', async ({
      itemPage,
      storiesPage,
    }, testInfo) => {
      test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only thread navigation');

      await storiesPage.navigateToTop();
      await itemPage.page.waitForTimeout(1500);

      const commentLinks = storiesPage.storyItems.locator('.story-comments');
      const linkCount = await commentLinks.count();
      let itemHref: string | null = null;

      for (let index = 0; index < linkCount; index++) {
        const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
        const countMatch = text.match(/\d+/);
        const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
        const href = await commentLinks.nth(index).getAttribute('href');

        if (commentCount > 20 && href?.includes('/item/')) {
          itemHref = href;
          break;
        }
      }

      test.skip(!itemHref, 'No sufficiently active story found for thread navigation assertion');

      await itemPage.page.goto(itemHref!);
      await itemPage.page.waitForLoadState('networkidle');
      await itemPage.page.waitForTimeout(1500);

      const viewThreadCount = await itemPage.page
        .locator('button[title="View this thread"]')
        .count();
      test.skip(viewThreadCount === 0, 'No view-thread actions available for this story');

      await itemPage.page.evaluate(() => {
        window.scrollTo({ top: 1400, behavior: 'auto' });
      });
      await itemPage.page.waitForTimeout(200);

      const previousScrollY = await itemPage.page.evaluate(() => window.scrollY);
      test.skip(previousScrollY < 200, 'Item page is not scrollable enough for restoration check');

      const clickedThreadFromViewport = await itemPage.page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll('button[title="View this thread"]'),
        ) as HTMLButtonElement[];

        const visibleButton = buttons.find((button) => {
          const rect = button.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= window.innerHeight;
        });

        if (!visibleButton) {
          return false;
        }

        visibleButton.click();
        return true;
      });
      test.skip(!clickedThreadFromViewport, 'No in-viewport thread action available for click');
      await itemPage.page.waitForLoadState('networkidle');

      const threadScrollY = await itemPage.page.evaluate(() => window.scrollY);
      expect(threadScrollY).toBeLessThan(220);
      await expect(itemPage.page.locator('#submission-title')).toBeVisible();

      await itemPage.page.goBack();
      await itemPage.page.waitForLoadState('networkidle');
      await expect(itemPage.page).toHaveURL(/\/item\/\d+/);
      await expect(itemPage.page.locator('h2.comments-title')).toBeVisible();
    });

    test('should reset sidebar scroll on thread open and restore on sidebar back', async ({
      storiesPage,
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only sidebar behavior');

      await page.addInitScript(() => {
        window.localStorage.setItem(
          'user.settings.v1',
          JSON.stringify({ openCommentsInSidebar: true }),
        );
      });

      await storiesPage.navigateToTop();
      await page.waitForTimeout(1500);

      const commentLinks = storiesPage.storyItems.locator('.story-comments');
      const linkCount = await commentLinks.count();
      let targetLinkIndex = -1;

      for (let index = 0; index < linkCount; index++) {
        const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
        const countMatch = text.match(/\d+/);
        const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
        if (commentCount > 0) {
          targetLinkIndex = index;
          break;
        }
      }

      test.skip(targetLinkIndex < 0, 'No story with comments available in current feed');

      await commentLinks.nth(targetLinkIndex).click();
      const sidebarPanel = page.locator('.sidebar-comments-panel');
      await expect(sidebarPanel).toBeVisible();
      await page.waitForTimeout(1200);

      const viewThreadButtons = sidebarPanel.locator('button[title="View this thread"]');
      const sidebarThreadButtonCount = await viewThreadButtons.count();
      test.skip(sidebarThreadButtonCount === 0, 'No view-thread actions available in sidebar');

      const initialSidebarScroll = await sidebarPanel.evaluate((element) => {
        const panel = element as HTMLElement;
        panel.scrollTop = Math.max(0, Math.min(600, panel.scrollHeight));
        return panel.scrollTop;
      });
      test.skip(initialSidebarScroll < 80, 'Sidebar content is not scrollable enough');

      const scrollBeforeClick = await sidebarPanel.evaluate((element) => {
        return (element as HTMLElement).scrollTop;
      });
      const clickedSidebarThreadFromViewport = await page.evaluate(() => {
        const container = document.querySelector('.sidebar-comments-panel') as HTMLElement | null;
        if (!container) {
          return false;
        }

        const containerRect = container.getBoundingClientRect();
        const buttons = Array.from(
          container.querySelectorAll('button[title="View this thread"]'),
        ) as HTMLButtonElement[];

        const visibleButton = buttons.find((button) => {
          const rect = button.getBoundingClientRect();
          return rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
        });

        if (!visibleButton) {
          return false;
        }

        visibleButton.click();
        return true;
      });
      test.skip(
        !clickedSidebarThreadFromViewport,
        'No in-viewport sidebar thread action available for click',
      );

      const backButton = page.locator('button[aria-label="Go back to previous view"]');
      await expect(backButton).toBeVisible();
      await page.waitForTimeout(500);

      const openThreadSidebarScroll = await sidebarPanel.evaluate((element) => {
        return (element as HTMLElement).scrollTop;
      });
      expect(openThreadSidebarScroll).toBeLessThan(40);

      await backButton.click();
      await page.waitForTimeout(700);

      const restoredSidebarScroll = await sidebarPanel.evaluate((element) => {
        return (element as HTMLElement).scrollTop;
      });
      expect(Math.abs(restoredSidebarScroll - scrollBeforeClick)).toBeLessThan(140);
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
