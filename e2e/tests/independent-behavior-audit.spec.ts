import { test, expect } from '../fixtures/pages.fixture';
import { MAIN_STORY_ID, addComment } from '../fixtures/hn-fixture-data';
import type { Page, BrowserContext } from '@playwright/test';
const active = (page: Page) => page.locator('app-discussion-view[data-active="true"]');
async function settle(page: Page) {
  await expect
    .poll(() =>
      page.locator('.sidebar-panel').evaluate((el) => el.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
}
async function open(page: Page) {
  await page.goto('/top');
  await page.locator('.story-comments').first().click();
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
  await settle(page);
}
async function swipe(page: Page, context: BrowserContext, direction: number) {
  const cdp = await context.newCDPSession(page);
  const start = direction > 0 ? 80 : 300;
  const y = 550;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start, y }],
  });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: start + direction * i * 20, y }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await settle(page);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('user.settings.v1', JSON.stringify({ openCommentsInSidebar: true })),
  );
});
test('audit native Back Forward after keyboard nesting and viewport changes', async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(!isMobile);
  await open(page);
  const root = await active(page).getAttribute('data-entry-key');
  await page.keyboard.press('j');
  await page.keyboard.press('l');
  await expect(active(page)).not.toHaveAttribute('data-entry-key', root!);
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
  await settle(page);
  const nested = await active(page).getAttribute('data-entry-key');
  await swipe(page, context, 1);
  await expect(active(page)).toHaveAttribute('data-entry-key', root!);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('app-shell')).not.toHaveAttribute('inert', '');
  await page.setViewportSize({ width: 393, height: 851 });
  await swipe(page, context, -1);
  await expect(active(page)).toHaveAttribute('data-entry-key', nested!);
  await expect(active(page).locator('[aria-selected="true"]')).toHaveCount(1);
});
test('audit full page navigation browser Back does not revive discussion session', async ({
  page,
}) => {
  await open(page);
  await page.keyboard.press('j');
  await page.keyboard.press('l');
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
  await page.keyboard.press('o');
  await expect(page).toHaveURL(/\/item\/\d+/);
  await expect(active(page)).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/top$/);
  await expect(page.locator('app-discussion-view')).toHaveCount(0);
});
test('audit desktop full-view link opens separate tab and preserves sidebar', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);
  // Open a sidebar by returning to story list, then use the desktop full view in a separate tab.
  await page.goto('/top');
  await page.locator('.story-comments').first().click();
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
  await settle(page);
  const popupPromise = page.waitForEvent('popup');
  await active(page).getByRole('link', { name: 'Open in full view' }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(new RegExp(`/item/${MAIN_STORY_ID}$`));
  await expect(popup.locator('[role="treeitem"]').first()).toBeVisible();
  await expect(active(page)).toHaveCount(1);
  await popup.close();
});
test('audit delayed discussion load can be closed and reopened without stale screen or focus', async ({
  page,
}) => {
  await page.goto('/top');
  await expect(page.locator('.story-comments').first()).toBeVisible();
  await page.clock.setFixedTime(new Date(Date.now() + 7200000));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested!: () => void;
  const pending = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route(`**/item/${MAIN_STORY_ID}.json`, async (route) => {
    requested();
    await gate;
    await route.fallback();
  });
  await page.locator('.story-comments').first().click();
  await pending;
  await active(page).getByRole('button', { name: 'Close sidebar', exact: true }).click();
  await page.locator('.story-comments').nth(1).click();
  await expect(active(page).locator('app-sidebar-story-summary')).toContainText(
    'Many Top-Level Comments',
  );
  const key = await active(page).getAttribute('data-entry-key');
  const close = active(page).getByRole('button', { name: 'Close sidebar', exact: true });
  await close.focus();
  release();
  await page.waitForTimeout(500);
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
  await expect(close).toBeFocused();
  await expect(page.locator('app-discussion-view')).toHaveCount(1);
});
test('audit story navigation at end of list cannot paginate inactive discussion', async ({
  page,
  context,
  hnDataset,
  isMobile,
}) => {
  test.skip(!isMobile);
  hnDataset.storyLists.top = hnDataset.storyLists.top.slice(0, 2);
  await page.goto('/top');
  await page.locator('.story-comments').nth(1).click();
  await expect(active(page).locator('.comments-list > app-comment-thread')).toHaveCount(10);
  await settle(page);
  await page.keyboard.press('h');
  await expect(active(page)).toHaveCount(0);
  await settle(page);
  await expect(page.locator('app-story-list .load-more-btn')).toHaveCount(0);
  await page.keyboard.press('j');
  await page.keyboard.press('j');
  await page.keyboard.press('j');
  await swipe(page, context, -1);
  await expect(active(page)).toHaveCount(1);
  await expect(active(page).locator('.comments-list > app-comment-thread')).toHaveCount(10);
});
test('audit button-opened short thread preserves top alignment after view reconstruction', async ({
  page,
  hnDataset,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  hnDataset.items.get(MAIN_STORY_ID)!.kids = [];
  let parent = MAIN_STORY_ID;
  for (let i = 0; i < 7; i++)
    parent = addComment(hnDataset, {
      parent,
      storyId: MAIN_STORY_ID,
      text: `<p>Short level ${i}.</p>`,
    }).id;
  await open(page);
  const nested = async () => {
    const previous = await active(page).getAttribute('data-entry-key');
    await active(page)
      .getByRole('button', { name: /^View thread for comment/ })
      .first()
      .click();
    await expect(active(page)).not.toHaveAttribute('data-entry-key', previous!);
    await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
    await expect(active(page).locator('[aria-busy="true"]')).toHaveCount(0);
    await settle(page);
  };
  const aligned = async () => {
    await expect
      .poll(async () => {
        const comment = await active(page).locator('[role="treeitem"]').first().boundingBox();
        const toolbar = await active(page).locator('.comments-heading').boundingBox();
        return comment && toolbar ? Math.abs(comment.y - toolbar.y - toolbar.height) : Infinity;
      })
      .toBeLessThan(1);
  };
  await nested();
  const key = await active(page).getAttribute('data-entry-key');
  await expect(active(page).locator('[aria-selected="true"]')).toHaveCount(0);
  await aligned();
  for (let i = 0; i < 3; i++) await nested();
  await expect(page.locator(`app-discussion-view[data-entry-key="${key}"]`)).toHaveCount(0);
  for (let i = 0; i < 3; i++) {
    const before = await active(page).getAttribute('data-entry-key');
    await active(page).getByRole('button', { name: 'Go back to previous view' }).click();
    await expect(active(page)).not.toHaveAttribute('data-entry-key', before!);
    await settle(page);
  }
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
  await expect(active(page).locator('[aria-busy="true"]')).toHaveCount(0);
  await aligned();
});
test('audit native Forward aligns the retained selected comment below toolbar', async ({
  page,
  context,
  hnDataset,
  isMobile,
}) => {
  test.skip(!isMobile);
  const parent = hnDataset.items.get(MAIN_STORY_ID)!.kids![0];
  hnDataset.items.get(parent)!.text = '<p>Long parent text.</p>'.repeat(30);
  await open(page);
  await page.keyboard.press('j');
  await page.keyboard.press('l');
  await expect(active(page).locator('[aria-selected="true"]')).toHaveCount(1);
  await settle(page);
  await page.keyboard.press('j');
  const key = await active(page).getAttribute('data-entry-key');
  const selected = await active(page)
    .locator('[aria-selected="true"]')
    .getAttribute('data-comment-id');
  await active(page)
    .locator('.sidebar-comments-panel')
    .evaluate((el) => {
      el.scrollTo({ top: 0, behavior: 'instant' });
    });
  await swipe(page, context, 1);
  await expect(active(page)).not.toHaveAttribute('data-entry-key', key!);
  await swipe(page, context, -1);
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
  await expect(active(page).locator('[aria-selected="true"]')).toHaveAttribute(
    'data-comment-id',
    selected!,
  );
  await expect
    .poll(async () => {
      const comment = await active(page).locator('[aria-selected="true"]').boundingBox();
      const toolbar = await active(page).locator('.comments-heading').boundingBox();
      return comment && toolbar ? Math.abs(comment.y - toolbar.y - toolbar.height) : Infinity;
    })
    .toBeLessThan(1);
});
