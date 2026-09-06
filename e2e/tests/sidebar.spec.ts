import { type Page } from '@playwright/test';
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

    const titleOffset = await page.locator('app-sidebar-comments-header').evaluate((element) => {
      const panel = document.querySelector('.sidebar-panel') as HTMLElement;
      const title = element.querySelector('.title') as HTMLElement;
      const panelRect = panel.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();

      return titleRect.left + titleRect.width / 2 - (panelRect.left + panelRect.width / 2);
    });

    expect(Math.abs(titleOffset)).toBeLessThanOrEqual(1);
  });

  test('should open sidebar via c keyboard shortcut', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await selectFirstStoryForKeyboardShortcut(page);

    await pressDocumentKey(page, 'c');
    await expect.poll(() => sidebarPage.isOpen(), { timeout: 5_000 }).toBe(true);
  });

  test('should close sidebar with Escape key', async ({ storiesPage, sidebarPage, page }) => {
    await openSidebarForStory(storiesPage, sidebarPage);

    await page.keyboard.press('Escape');
    await expect.poll(() => sidebarPage.isClosed(), { timeout: 5_000 }).toBe(true);
  });

  test('should close sidebar by clicking overlay', async ({ storiesPage, sidebarPage, page }) => {
    await openSidebarForStory(storiesPage, sidebarPage);

    // Resize to tablet viewport to reveal the overlay (lg:hidden = hidden above 1024px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    const overlayBox = await sidebarPage.overlay.boundingBox();
    const panelBox = await sidebarPage.panel.boundingBox();
    expect(overlayBox).not.toBeNull();
    expect(panelBox).not.toBeNull();

    await page.mouse.click(
      Math.max(20, Math.floor(panelBox!.x / 2)),
      Math.floor(overlayBox!.y + overlayBox!.height / 2),
    );

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

    await sidebarPage.viewThreadButtons.first().click();
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

    await sidebarPage.viewThreadButtons.first().click();
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

test.describe('Sidebar Comments Panel - mobile swipe dismissal', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile-only gesture');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'user.settings.v1',
        JSON.stringify({ openCommentsInSidebar: true }),
      );
    });
  });

  test('should keep the full-width sidebar above the overlay in landscape', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await openSidebarAtMobileSize(storiesPage, sidebarPage, page, { width: 797, height: 377 });

    const layout = await page.evaluate(() => {
      const panel = document.querySelector('.sidebar-panel');
      const overlay = document.querySelector('.sidebar-overlay');
      if (!panel || !overlay) {
        return null;
      }

      const panelRect = panel.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      const panelStyle = getComputedStyle(panel);
      const overlayStyle = getComputedStyle(overlay);

      return {
        viewportWidth: window.innerWidth,
        panelTop: panelRect.top,
        panelWidth: panelRect.width,
        overlayTop: overlayRect.top,
        panelZIndex: Number.parseInt(panelStyle.zIndex, 10),
        overlayZIndex: Number.parseInt(overlayStyle.zIndex, 10),
      };
    });

    expect(layout).not.toBeNull();
    expect(layout!.panelTop).toBeLessThanOrEqual(1);
    expect(layout!.overlayTop).toBeLessThanOrEqual(1);
    expect(Math.abs(layout!.panelWidth - layout!.viewportWidth)).toBeLessThanOrEqual(1);
    expect(layout!.panelZIndex).toBeGreaterThan(layout!.overlayZIndex);
  });

  test('should close full-width sidebar with a right swipe from the left edge', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await openSidebarAtMobileSize(storiesPage, sidebarPage, page);

    const panelBox = await sidebarPage.panel.boundingBox();
    if (!panelBox) {
      throw new Error('Sidebar panel is guaranteed to be laid out once open() has resolved');
    }

    await page.mouse.move(panelBox!.x + 8, panelBox!.y + panelBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(panelBox!.x + 170, panelBox!.y + panelBox!.height / 2, { steps: 6 });
    await page.mouse.up();

    await expect.poll(() => sidebarPage.isClosed(), { timeout: 5_000 }).toBe(true);
  });

  test('should close full-width sidebar with a fast right swipe from the left edge', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await openSidebarAtMobileSize(storiesPage, sidebarPage, page);

    const panelBox = await sidebarPage.panel.boundingBox();
    if (!panelBox) {
      throw new Error('Sidebar panel is guaranteed to be laid out once open() has resolved');
    }

    await page.mouse.move(panelBox!.x + 8, panelBox!.y + panelBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(panelBox!.x + 95, panelBox!.y + panelBox!.height / 2, { steps: 1 });
    await page.mouse.up();

    await expect.poll(() => sidebarPage.isClosed(), { timeout: 5_000 }).toBe(true);
  });

  test('should keep the full-width sidebar open after a short left-edge drag', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await openSidebarAtMobileSize(storiesPage, sidebarPage, page);

    const panelBox = await sidebarPage.panel.boundingBox();
    if (!panelBox) {
      throw new Error('Sidebar panel is guaranteed to be laid out once open() has resolved');
    }

    await page.mouse.move(panelBox!.x + 8, panelBox!.y + panelBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(panelBox!.x + 30, panelBox!.y + panelBox!.height / 2, { steps: 4 });
    await page.mouse.up();

    await expect.poll(() => sidebarPage.isOpen(), { timeout: 5_000 }).toBe(true);
  });

  test('should close full-width sidebar with an imperfect diagonal right swipe', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await openSidebarAtMobileSize(storiesPage, sidebarPage, page);

    const panelBox = await sidebarPage.panel.boundingBox();
    if (!panelBox) {
      throw new Error('Sidebar panel is guaranteed to be laid out once open() has resolved');
    }

    const startX = panelBox!.x + 8;
    const startY = panelBox!.y + panelBox!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 45, startY + 20, { steps: 2 });
    await page.mouse.move(startX + 110, startY - 14, { steps: 3 });
    await page.mouse.move(startX + 205, startY + 36, { steps: 4 });
    await page.mouse.up();

    await expect.poll(() => sidebarPage.isClosed(), { timeout: 5_000 }).toBe(true);
  });

  test('should keep the sidebar open after a mostly vertical edge drag', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await openSidebarAtMobileSize(storiesPage, sidebarPage, page);

    const panelBox = await sidebarPage.panel.boundingBox();
    if (!panelBox) {
      throw new Error('Sidebar panel is guaranteed to be laid out once open() has resolved');
    }

    const startX = panelBox!.x + 8;
    const startY = panelBox!.y + panelBox!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 10, startY + 55, { steps: 3 });
    await page.mouse.move(startX + 18, startY + 130, { steps: 4 });
    await page.mouse.up();

    await expect.poll(() => sidebarPage.isOpen(), { timeout: 5_000 }).toBe(true);
  });

  test.describe('Chromium touch input', () => {
    test.skip(
      ({ browserName }) => browserName !== 'chromium',
      'CDP touch events are Chromium-only',
    );

    test('should preserve vertical scrolling during a mostly vertical touch drag from the edge', async ({
      storiesPage,
      sidebarPage,
      page,
    }) => {
      await openSidebarAtMobileSize(storiesPage, sidebarPage, page);

      const panelBox = await sidebarPage.panel.boundingBox();
      if (!panelBox) {
        throw new Error('Sidebar panel is guaranteed to be laid out once open() has resolved');
      }

      const scrollable = await sidebarPage.commentsPanel.evaluate((element) => {
        element.scrollTop = 0;
        return element.scrollHeight > element.clientHeight + 200;
      });
      if (!scrollable) {
        throw new Error(
          'Fixture story has enough rendered comments to make the sidebar comments panel scrollable',
        );
      }

      const client = await page.context().newCDPSession(page);
      const startX = Math.round(panelBox!.x + 8);
      const startY = Math.round(panelBox!.y + panelBox!.height / 2);
      const beforeScrollTop = await sidebarPage.commentsPanel.evaluate(
        (element) => element.scrollTop,
      );

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 10, y: startY - 80, id: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 18, y: startY - 170, id: 1 }],
      });
      await page.waitForTimeout(100);

      const touchState = await page.evaluate(() => {
        const panel = document.querySelector('.sidebar-panel') as HTMLElement | null;
        const comments = document.querySelector('.sidebar-comments-panel') as HTMLElement | null;
        if (!panel || !comments) {
          return null;
        }

        return {
          panelTranslateX: new DOMMatrixReadOnly(getComputedStyle(panel).transform).m41,
          scrollTop: comments.scrollTop,
        };
      });

      expect(touchState).not.toBeNull();
      expect(touchState!.panelTranslateX).toBe(0);
      expect(touchState!.scrollTop).toBeGreaterThan(beforeScrollTop);

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });

      await expect.poll(() => sidebarPage.isOpen(), { timeout: 5_000 }).toBe(true);
    });

    test('should track and close during an imperfect diagonal touch swipe', async ({
      storiesPage,
      sidebarPage,
      page,
    }) => {
      await openSidebarAtMobileSize(storiesPage, sidebarPage, page);

      const panelBox = await sidebarPage.panel.boundingBox();
      if (!panelBox) {
        throw new Error('Sidebar panel is guaranteed to be laid out once open() has resolved');
      }

      const startX = Math.round(panelBox!.x + 8);
      const startY = Math.round(panelBox!.y + panelBox!.height / 2);
      const client = await page.context().newCDPSession(page);

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 56, y: startY + 18, id: 1 }],
      });
      await page.waitForTimeout(100);

      const midTransform = await sidebarPage.panel.evaluate((element) => {
        const transform = getComputedStyle(element).transform;
        if (transform === 'none') {
          return 0;
        }

        return new DOMMatrixReadOnly(transform).m41;
      });
      expect(midTransform).toBeGreaterThan(24);

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 125, y: startY - 12, id: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 210, y: startY + 34, id: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });

      await expect.poll(() => sidebarPage.isClosed(), { timeout: 5_000 }).toBe(true);
    });
  });
});

async function openSidebarAtMobileSize(
  storiesPage: StoriesPage,
  sidebarPage: SidebarPage,
  page: Page,
  mobileViewport = { width: 390, height: 844 },
): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 720 });
  await storiesPage.navigateToTop();

  const targetLinkIndex = await findStoryWithComments(storiesPage, 1);
  if (targetLinkIndex < 0) {
    throw new Error('Fixture data guarantees a story with comments in the top feed');
  }

  await storiesPage.storyItems.locator('.story-comments').nth(targetLinkIndex).click();
  await expect(sidebarPage.panel).toBeVisible();
  await expect.poll(() => sidebarPage.isOpen(), { timeout: 5_000 }).toBe(true);

  await page.setViewportSize(mobileViewport);
  // Resizing to a mobile viewport reflows the panel into its full-width mode;
  // wait for that state directly instead of assuming a fixed delay always
  // outlasts the reflow (it can lag under full-suite CPU contention).
  await expect.poll(() => sidebarPage.isOpen(), { timeout: 5_000 }).toBe(true);
}

async function pressDocumentKey(page: Page, key: string): Promise<void> {
  await page.evaluate((pressedKey) => {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: pressedKey,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, key);
}

async function selectFirstStoryForKeyboardShortcut(page: Page): Promise<void> {
  await expect(page.locator('app-story-item').first()).toBeVisible();

  const selectedViaAngular = await page.evaluate(() => {
    const angular = (
      window as Window & {
        ng?: {
          getComponent(element: Element | null): {
            keyboardNavService?: {
              selectedIndex?: { set(index: number): void };
              setSelectedIndex(index: number): void;
            };
          } | null;
        };
      }
    ).ng;
    const appRoot = document.querySelector('app-root');
    const component = angular?.getComponent(appRoot);
    if (component?.keyboardNavService?.selectedIndex) {
      component.keyboardNavService.selectedIndex.set(0);
    } else {
      component?.keyboardNavService?.setSelectedIndex(0);
    }
    return Boolean(component?.keyboardNavService);
  });

  if (!selectedViaAngular) {
    await page.evaluate(() => {
      document.body.tabIndex = -1;
      document.body.focus();
    });

    for (let attempt = 0; attempt < 3; attempt++) {
      if ((await page.locator('.story-card-selected').count()) > 0) {
        break;
      }
      await pressDocumentKey(page, 'j');
      await page.waitForTimeout(200);
    }
  }

  await expect(page.locator('.story-card-selected')).toBeVisible();
}
