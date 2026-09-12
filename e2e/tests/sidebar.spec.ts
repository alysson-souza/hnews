import { test, expect } from '../fixtures/pages.fixture';
import { SidebarPage } from '../page-objects/sidebar.page';
import { StoriesPage } from '../page-objects/stories.page';
import { MANY_TOP_LEVEL_COMMENTS_STORY_TITLE } from '../fixtures/hn-fixture-data';

/**
 * Waits for a repeatedly-sampled count to stop changing, then returns it.
 * The nested comment tree mounts progressively (each level renders once its
 * own data resolves), so a single read taken right after some readiness
 * signal can still be a mid-load value — this waits for two consecutive
 * samples, a poll interval apart, to agree before treating it as settled.
 */
async function waitForStableCount(
  getCount: () => Promise<number>,
  timeoutMs = 10_000,
  intervalMs = 200,
): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  let previous = await getCount();
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const current = await getCount();
    if (current === previous) {
      return current;
    }
    previous = current;
  }
  return previous;
}

/** Finds the index of the first story whose comments link has at least minComments comments. */
async function findStoryWithComments(
  storiesPage: StoriesPage,
  minComments: number,
): Promise<number> {
  const commentLinks = storiesPage.storyItems.locator('.story-comments');
  const linkCount = await commentLinks.count();
  for (let index = 0; index < linkCount; index++) {
    const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
    const countMatch = text.match(/\d+/);
    const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
    if (commentCount >= minComments) {
      return index;
    }
  }
  return -1;
}

/** Opens the sidebar from the story list for the first story with enough comments. */
async function openSidebarForStory(
  storiesPage: StoriesPage,
  sidebarPage: SidebarPage,
  minComments = 1,
): Promise<void> {
  await storiesPage.navigateToTop();

  const targetLinkIndex = await findStoryWithComments(storiesPage, minComments);
  if (targetLinkIndex < 0) {
    throw new Error(
      `Fixture data guarantees a story with at least ${minComments} comments in the top feed`,
    );
  }

  await storiesPage.storyItems.locator('.story-comments').nth(targetLinkIndex).click();
  await expect.poll(() => sidebarPage.isOpen(), { timeout: 10_000 }).toBe(true);
  await expect(sidebarPage.commentsPanel).toBeVisible();
}

/**
 * Opens the sidebar for the dedicated fixture story with more top-level
 * comments than the sidebar's page size, rather than the generic first
 * story matching a comment-count threshold (which would resolve to the
 * main fixture thread and never trigger top-level pagination).
 */
async function openSidebarForManyTopLevelCommentsStory(
  storiesPage: StoriesPage,
  sidebarPage: SidebarPage,
): Promise<void> {
  await storiesPage.navigateToTop();

  const storyItem = storiesPage.storyItems.filter({ hasText: MANY_TOP_LEVEL_COMMENTS_STORY_TITLE });
  await storyItem.locator('.story-comments').click();
  await expect.poll(() => sidebarPage.isOpen(), { timeout: 10_000 }).toBe(true);
  await expect(sidebarPage.commentsPanel).toBeVisible();
}

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

  test('should open sidebar when clicking comments link', async ({ storiesPage, sidebarPage }) => {
    await openSidebarForStory(storiesPage, sidebarPage);

    const horizontalSpacing = await sidebarPage.commentsPanel.evaluate((panel) => {
      const body = panel.querySelector('.comments-body');
      const heading = panel.querySelector('.comments-heading');
      if (!body || !heading) {
        return null;
      }

      const bodyStyle = getComputedStyle(body);
      const headingStyle = getComputedStyle(heading);

      return {
        bodyPaddingLeft: bodyStyle.paddingLeft,
        bodyPaddingRight: bodyStyle.paddingRight,
        headingPaddingLeft: headingStyle.paddingLeft,
        headingPaddingRight: headingStyle.paddingRight,
        headingMarginLeft: headingStyle.marginLeft,
        headingMarginRight: headingStyle.marginRight,
      };
    });

    expect(horizontalSpacing).toEqual({
      bodyPaddingLeft: '18px',
      bodyPaddingRight: '18px',
      headingPaddingLeft: '18px',
      headingPaddingRight: '18px',
      headingMarginLeft: '-18px',
      headingMarginRight: '-18px',
    });

    const dividerSpacing = await sidebarPage.commentsPanel.evaluate((panel) => {
      const storySummary = panel.querySelector('app-sidebar-story-summary');
      const divider = panel.querySelector('.comments-divider');
      const sortDropdown = panel.querySelector('app-comment-sort-dropdown');
      if (!storySummary || !divider || !sortDropdown) {
        return null;
      }

      const summaryRect = storySummary.getBoundingClientRect();
      const dividerRect = divider.getBoundingClientRect();
      const dropdownRect = sortDropdown.getBoundingClientRect();

      return {
        gapAbove: dividerRect.top - summaryRect.bottom,
        gapBelow: dropdownRect.top - dividerRect.bottom,
      };
    });

    expect(dividerSpacing).toEqual({
      gapAbove: 12,
      gapBelow: 12,
    });
  });

  test('should lock page scrolling while keeping the sidebar independently scrollable', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await page.setViewportSize({ width: 870, height: 720 });
    await storiesPage.navigateToTop();
    await expect(storiesPage.storyItems.first()).toBeVisible();

    const documentIsScrollable = await page.evaluate(() => {
      const scrollingElement = document.scrollingElement!;
      return scrollingElement.scrollHeight > scrollingElement.clientHeight;
    });
    expect(documentIsScrollable).toBe(true);

    const targetLinkIndex = await findStoryWithComments(storiesPage, 21);
    if (targetLinkIndex < 0) {
      throw new Error('Fixture data guarantees a story with more than 21 comments in the top feed');
    }

    await page.setViewportSize({ width: 1024, height: 720 });
    await page.waitForTimeout(300);
    await storiesPage.storyItems.locator('.story-comments').nth(targetLinkIndex).click();
    await expect(sidebarPage.commentThreads.first()).toBeVisible();

    await page.setViewportSize({ width: 870, height: 720 });
    await page.waitForTimeout(300);

    const sidebarIsScrollable = await sidebarPage.commentsPanel.evaluate(
      (commentsPanel) => commentsPanel.scrollHeight > commentsPanel.clientHeight,
    );
    if (!sidebarIsScrollable) {
      throw new Error(
        'Fixture story has enough rendered comments to make the sidebar comments panel scrollable',
      );
    }

    const panelRight = await sidebarPage.panel.evaluate(
      (panel) => panel.getBoundingClientRect().right,
    );
    const commentsLayout = await sidebarPage.commentsPanel.evaluate((commentsPanel) => ({
      right: commentsPanel.getBoundingClientRect().right,
      marginRight: getComputedStyle(commentsPanel).marginRight,
      bodyOverflow: getComputedStyle(document.body).overflow,
    }));

    expect(Math.abs(panelRight - commentsLayout.right)).toBeLessThanOrEqual(1);
    expect(commentsLayout.marginRight).toBe('0px');
    expect(commentsLayout.bodyOverflow).toBe('hidden');

    const pageScrollY = await page.evaluate(() => window.scrollY);
    await page.mouse.move(100, 360);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(100);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - pageScrollY)).toBeLessThanOrEqual(
      1,
    );

    const sidebarScrollTop = await sidebarPage.commentsPanel.evaluate((commentsPanel) => {
      commentsPanel.scrollTop = Math.min(
        300,
        commentsPanel.scrollHeight - commentsPanel.clientHeight,
      );
      return commentsPanel.scrollTop;
    });

    expect(sidebarScrollTop).toBeGreaterThan(0);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - pageScrollY)).toBeLessThanOrEqual(
      1,
    );

    await page.keyboard.press('Escape');
    await expect.poll(() => sidebarPage.isClosed(), { timeout: 5_000 }).toBe(true);

    expect(await page.locator('body').evaluate((body) => getComputedStyle(body).overflow)).not.toBe(
      'hidden',
    );

    await page.mouse.move(100, 360);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(pageScrollY);
  });

  test('should center the header title in the sidebar panel', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await openSidebarForStory(storiesPage, sidebarPage);

    await expect
      .poll(async () =>
        Math.abs(
          await page.locator('app-sidebar-comments-header').evaluate((element) => {
            const panel = document.querySelector('.sidebar-panel') as HTMLElement;
            const title = element.querySelector('.title') as HTMLElement;
            const panelRect = panel.getBoundingClientRect();
            const titleRect = title.getBoundingClientRect();

            return titleRect.left + titleRect.width / 2 - (panelRect.left + panelRect.width / 2);
          }),
        ),
      )
      .toBeLessThanOrEqual(1);
  });

  test('should open sidebar via c keyboard shortcut', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.keyboard.press('j');
    await expect(page.locator('.story-card-selected')).toBeVisible();
    await page.keyboard.press('c');
    await expect.poll(() => sidebarPage.isOpen(), { timeout: 5_000 }).toBe(true);
  });

  test('should close sidebar with Escape key', async ({ storiesPage, sidebarPage, page }) => {
    await openSidebarForStory(storiesPage, sidebarPage);

    await page.keyboard.press('Escape');
    await expect.poll(() => sidebarPage.isClosed(), { timeout: 5_000 }).toBe(true);
  });

  test('should display story summary in sidebar', async ({ storiesPage, sidebarPage }) => {
    await openSidebarForStory(storiesPage, sidebarPage);

    await expect(sidebarPage.storySummary).toBeVisible();
  });

  test('should display comments in sidebar', async ({ storiesPage, sidebarPage }) => {
    await openSidebarForStory(storiesPage, sidebarPage);

    await expect(sidebarPage.commentThreads.first()).toBeVisible({ timeout: 10_000 });
  });

  test('should display sort dropdown', async ({ storiesPage, sidebarPage }) => {
    await openSidebarForStory(storiesPage, sidebarPage);

    await expect(sidebarPage.sortDropdown).toBeVisible();
    await expect(sidebarPage.sortDropdown).toHaveValue('default');
  });

  test('should reorder comments when changing sort order', async ({ storiesPage, sidebarPage }) => {
    await openSidebarForStory(storiesPage, sidebarPage);

    await expect(sidebarPage.sortDropdown).toBeVisible();
    await expect(sidebarPage.sortDropdown).toHaveValue('default');

    const sidebarPermalinks = () =>
      sidebarPage.commentsPanel
        .locator('a[title^="Permalink for comment"]')
        .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).getAttribute('href')));

    // Wait for comments to render before asserting on their order
    await sidebarPage.commentsPanel
      .locator('a[title^="Permalink for comment"]')
      .first()
      .waitFor({ timeout: 10_000 });

    await sidebarPage.sortDropdown.selectOption('newest');
    await expect(sidebarPage.sortDropdown).toHaveValue('newest');

    // Sorting reloads the panel — wait for comments to render again
    await expect
      .poll(async () => (await sidebarPermalinks()).length, { timeout: 10_000 })
      .toBeGreaterThan(1);
    const newestOrder = await sidebarPermalinks();
    expect(newestOrder.length).toBeGreaterThan(1);

    await sidebarPage.sortDropdown.selectOption('oldest');
    await expect(sidebarPage.sortDropdown).toHaveValue('oldest');
    await expect
      .poll(async () => (await sidebarPermalinks()).length, { timeout: 10_000 })
      .toBeGreaterThan(1);
    await expect.poll(sidebarPermalinks, { timeout: 10_000 }).not.toEqual(newestOrder);
  });

  test('should navigate into thread via View this thread', async ({ storiesPage, sidebarPage }) => {
    await openSidebarForStory(storiesPage, sidebarPage, 20);

    // Comments render asynchronously after the sidebar opens (fetched over the
    // mocked network); wait for that to settle instead of counting immediately.
    await expect
      .poll(() => sidebarPage.viewThreadButtons.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);

    await sidebarPage.viewThreadButtons.first().click();

    await expect(sidebarPage.backButton).toBeVisible({ timeout: 5_000 });
  });

  test('should navigate back from thread', async ({ storiesPage, sidebarPage }) => {
    await openSidebarForStory(storiesPage, sidebarPage, 20);

    await expect
      .poll(() => sidebarPage.viewThreadButtons.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);
    const initialThreadCount = await waitForStableCount(() =>
      sidebarPage.topLevelCommentThreads.count(),
    );
    // Guard the restore assertion below against passing on 0 === 0
    expect(initialThreadCount).toBeGreaterThan(0);

    const previousKey = await sidebarPage.commentsPanel
      .locator('..')
      .locator('..')
      .getAttribute('data-entry-key');
    await sidebarPage.viewThreadButtons.first().click();
    await expect(sidebarPage.commentsPanel.locator('..').locator('..')).not.toHaveAttribute(
      'data-entry-key',
      previousKey!,
    );
    await expect(sidebarPage.backButton).toBeVisible({ timeout: 5_000 });

    await sidebarPage.backButton.click();

    await expect(sidebarPage.backButton).not.toBeVisible({ timeout: 5_000 });
    // Returning restores the same top-level list it was opened from
    await expect
      .poll(() => sidebarPage.topLevelCommentThreads.count(), { timeout: 10_000 })
      .toBe(initialThreadCount);
  });

  test('should navigate back from thread via h key', async ({ storiesPage, sidebarPage, page }) => {
    await openSidebarForStory(storiesPage, sidebarPage, 20);

    await expect
      .poll(() => sidebarPage.viewThreadButtons.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);
    const initialThreadCount = await waitForStableCount(() =>
      sidebarPage.topLevelCommentThreads.count(),
    );
    // Guard the restore assertion below against passing on 0 === 0
    expect(initialThreadCount).toBeGreaterThan(0);

    const previousKey = await sidebarPage.commentsPanel
      .locator('..')
      .locator('..')
      .getAttribute('data-entry-key');
    await sidebarPage.viewThreadButtons.first().click();
    await expect(sidebarPage.commentsPanel.locator('..').locator('..')).not.toHaveAttribute(
      'data-entry-key',
      previousKey!,
    );
    await expect(sidebarPage.backButton).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('h');

    await expect(sidebarPage.backButton).not.toBeVisible({ timeout: 5_000 });
    await expect
      .poll(() => sidebarPage.topLevelCommentThreads.count(), { timeout: 10_000 })
      .toBe(initialThreadCount);
  });

  test('should load more comments', async ({ storiesPage, sidebarPage }) => {
    await openSidebarForManyTopLevelCommentsStory(storiesPage, sidebarPage);

    // Comments (and the load-more control) render asynchronously after the
    // sidebar opens; wait for that to settle instead of checking immediately.
    await expect(sidebarPage.loadMoreButton.first()).toBeVisible({ timeout: 10_000 });

    const initialCount = await sidebarPage.commentThreads.count();

    await sidebarPage.loadMoreButton.first().click();

    await expect
      .poll(() => sidebarPage.commentThreads.count(), { timeout: 10_000 })
      .toBeGreaterThan(initialCount);
  });
});
