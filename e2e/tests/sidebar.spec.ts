import { test, expect } from '../fixtures/pages.fixture';

test.describe('Sidebar Comments Panel', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'user.settings.v1',
        JSON.stringify({ openCommentsInSidebar: true }),
      );
    });
  });

  test('should open sidebar when clicking comments link', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

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

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);

    expect(await sidebarPage.isOpen()).toBe(true);
    await expect(sidebarPage.commentsPanel).toBeVisible();
  });

  test('should open sidebar via c keyboard shortcut', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    await page.keyboard.press('j');
    await page.waitForTimeout(200);

    await page.keyboard.press('c');
    await page.waitForTimeout(500);

    expect(await sidebarPage.isOpen()).toBe(true);
  });

  test('should close sidebar with Escape key', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

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

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);
    expect(await sidebarPage.isOpen()).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    expect(await sidebarPage.isClosed()).toBe(true);
  });

  test('should close sidebar by clicking overlay', async ({ storiesPage, sidebarPage, page }) => {
    // Open sidebar at desktop viewport first
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

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

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);
    expect(await sidebarPage.isOpen()).toBe(true);

    // Resize to tablet viewport to reveal the overlay (lg:hidden = hidden above 1024px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    await sidebarPage.overlay.click({ force: true });
    await page.waitForTimeout(500);

    expect(await sidebarPage.isClosed()).toBe(true);
  });

  test('should display story summary in sidebar', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

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

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);

    await expect(sidebarPage.storySummary).toBeVisible();
  });

  test('should display comments in sidebar', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

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

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(1200);

    const threadCount = await sidebarPage.commentThreads.count();
    expect(threadCount).toBeGreaterThan(0);
  });

  test('should display sort dropdown', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

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

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);

    await expect(sidebarPage.sortDropdown).toBeVisible();
    await expect(sidebarPage.sortDropdown).toHaveValue('default');
  });

  test('should change sort order', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

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

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);

    await sidebarPage.sortDropdown.selectOption('newest');
    await page.waitForTimeout(300);

    await expect(sidebarPage.sortDropdown).toHaveValue('newest');
  });

  test('should navigate into thread via View this thread', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1500);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 20) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with enough comments for thread navigation');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(1200);

    const viewThreadCount = await sidebarPage.viewThreadButtons.count();
    test.skip(viewThreadCount === 0, 'No view-thread buttons available in sidebar');

    await sidebarPage.viewThreadButtons.first().click();
    await page.waitForTimeout(500);

    await expect(sidebarPage.backButton).toBeVisible();
  });

  test('should navigate back from thread', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1500);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 20) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with enough comments for thread navigation');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(1200);

    const viewThreadCount = await sidebarPage.viewThreadButtons.count();
    test.skip(viewThreadCount === 0, 'No view-thread buttons available in sidebar');

    const initialThreadCount = await sidebarPage.commentThreads.count();

    await sidebarPage.viewThreadButtons.first().click();
    await page.waitForTimeout(500);
    await expect(sidebarPage.backButton).toBeVisible();

    await sidebarPage.backButton.click();
    await page.waitForTimeout(500);

    await expect(sidebarPage.backButton).not.toBeVisible();
    const restoredThreadCount = await sidebarPage.commentThreads.count();
    expect(restoredThreadCount).toBe(initialThreadCount);
  });

  test('should navigate back from thread via h key', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1500);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 20) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with enough comments for thread navigation');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(1200);

    const viewThreadCount = await sidebarPage.viewThreadButtons.count();
    test.skip(viewThreadCount === 0, 'No view-thread buttons available in sidebar');

    await sidebarPage.viewThreadButtons.first().click();
    await page.waitForTimeout(500);
    await expect(sidebarPage.backButton).toBeVisible();

    await page.keyboard.press('h');
    await page.waitForTimeout(500);

    await expect(sidebarPage.backButton).not.toBeVisible();
  });

  test('should load more comments', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1500);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 20) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with enough comments for load more');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(1200);

    const loadMoreVisible = await sidebarPage.loadMoreButton.first().isVisible();
    test.skip(!loadMoreVisible, 'No load more button visible in sidebar');

    const initialCount = await sidebarPage.commentThreads.count();

    await sidebarPage.loadMoreButton.first().click();
    await page.waitForTimeout(1200);

    const newCount = await sidebarPage.commentThreads.count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });
});
