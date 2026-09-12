import { test, expect } from '../fixtures/pages.fixture';
import { MAIN_STORY_ID } from '../fixtures/hn-fixture-data';
import type { Page } from '@playwright/test';

const active = (page: Page) => page.locator('app-discussion-view[data-active="true"]');
async function open(page: Page) {
  await page.goto('/top');
  await page.locator('.story-comments').first().click();
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
  await expect
    .poll(() =>
      page.locator('.sidebar-panel').evaluate((el) => el.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('user.settings.v1', JSON.stringify({ openCommentsInSidebar: true })),
  );
});

test('the covered mobile page cannot take focus and becomes usable on desktop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const behind = page.locator('.story-comments').first();
  await behind.focus();
  await expect(behind).not.toBeFocused();
  await page.setViewportSize({ width: 1280, height: 900 });
  await behind.focus();
  await expect(behind).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await behind.focus();
  await expect(behind).not.toBeFocused();
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: /Keyboard Shortcuts/ })).toBeVisible();
});

test('closing returns focus to the comments link that opened the session', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/top');
  const opener = page.locator('.story-comments').first();
  await opener.press('Enter');
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('app-discussion-view')).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('leaving the window cancels an unfinished drag', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const key = await active(page).getAttribute('data-entry-key');
  const text = await active(page).locator('.comment-body p').first().boundingBox();
  const x = Math.max(60, text!.x + 15),
    y = text!.y + 10;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 120, y, { steps: 8 });
  await expect
    .poll(() => active(page).evaluate((el) => el.getBoundingClientRect().left))
    .toBeGreaterThan(80);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect.poll(() => active(page).evaluate((el) => el.getBoundingClientRect().left)).toBe(0);
  await page.mouse.up();
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
});

for (const width of [390, 1280]) {
  test(`reopening during close survives the old animation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    const first = await active(page).getAttribute('data-entry-key');
    await active(page).getByRole('button', { name: 'Close sidebar', exact: true }).click();
    await expect
      .poll(() =>
        page.locator('.sidebar-panel').evaluate((el) => el.getAnimations({ subtree: true }).length),
      )
      .toBeGreaterThan(0);
    await page.locator('.story-comments').nth(1).click();
    await expect(active(page)).not.toHaveAttribute('data-entry-key', first!);
    await expect(active(page).locator('app-sidebar-story-summary')).toContainText(
      'Many Top-Level Comments',
    );
    await expect
      .poll(() =>
        page.locator('.sidebar-panel').evaluate((el) => el.getAnimations({ subtree: true }).length),
      )
      .toBe(0);
    await expect(active(page)).toHaveCount(1);
    await active(page).getByRole('button', { name: 'Close sidebar', exact: true }).click();
    await expect(page.locator('app-discussion-view')).toHaveCount(0);
  });
}

test('late initial data does not take focus from a header control', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/top');
  await expect(page.locator('.story-comments').first()).toBeVisible();
  await page.clock.setFixedTime(new Date(Date.now() + 2 * 60 * 60 * 1000));
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
  const close = active(page).getByRole('button', { name: 'Close sidebar', exact: true });
  await close.focus();
  release();
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
  await expect(close).toBeFocused();
});

test('navigation captures the scroll position before its queued scroll event', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(active(page).locator('[aria-busy="true"]')).toHaveCount(0);
  const root = await active(page).getAttribute('data-entry-key');
  const scroll = active(page).locator('.sidebar-comments-panel');
  await expect
    .poll(() => scroll.evaluate((el) => el.scrollHeight - el.clientHeight))
    .toBeGreaterThan(300);
  await scroll.evaluate((el) => {
    el.scrollTop = 160;
    (el.querySelector('button[title="View this thread"]') as HTMLElement).click();
  });
  await expect(active(page)).not.toHaveAttribute('data-entry-key', root!);
  await active(page).getByRole('button', { name: 'Go back to previous view' }).click();
  await expect(active(page)).toHaveAttribute('data-entry-key', root!);
  await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBe(160);
});

for (const distance of [40, 140]) {
  test(`release settles without reversing the ${distance}px drag`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const key = await active(page).getAttribute('data-entry-key');
    const bounds = await active(page).locator('.comment-body p').first().boundingBox();
    const x = Math.max(60, bounds!.x + 15),
      y = bounds!.y + 10;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + distance, y, { steps: 10 });
    const sampling = page.evaluate(async (key) => {
      const positions: number[] = [];
      const start = performance.now();
      while (performance.now() - start < 400) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const view = document.querySelector(`app-discussion-view[data-entry-key="${key}"]`);
        if (view) positions.push(view.getBoundingClientRect().left);
      }
      return positions;
    }, key);
    await page.mouse.up();
    const positions = await sampling;
    expect(positions.length).toBeGreaterThan(3);
    const wrongDirection = positions
      .slice(1)
      .map((value, index) =>
        distance > 100 ? positions[index] - value : value - positions[index],
      );
    expect(Math.max(...wrongDirection)).toBeLessThanOrEqual(1);
    await expect(page.locator(`app-discussion-view[data-entry-key="${key}"]`)).toHaveAttribute(
      'data-active',
      distance > 100 ? 'false' : 'true',
    );
  });
}

test('nested unread state follows a never-visited parent rather than an old child visit', async ({
  page,
  hnDataset,
}) => {
  const childId = hnDataset.items.get(MAIN_STORY_ID)!.kids![0];
  await page.addInitScript((childId) => {
    const before = Date.now() - 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      'hn_visited_stories',
      JSON.stringify([
        { storyId: childId, visitedAt: before, commentsVisitedAt: before, commentsCount: 0 },
      ]),
    );
  }, childId);
  await open(page);
  await expect(active(page).locator('.comment-card.unread')).toHaveCount(0);
  await active(page).locator('button[title="View this thread"]').first().click();
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
  await expect(active(page).locator('.comment-card.unread')).toHaveCount(0);
});

test('browser history navigation cancels a drag and restores page access', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/best');
  await page.getByRole('button', { name: 'Toggle Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Top', exact: true }).click();
  await expect(page).toHaveURL(/\/top$/);
  await page.locator('.story-comments').first().click();
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
  const p = await active(page).locator('.comment-body p').first().boundingBox();
  const x = Math.max(60, p!.x + 15),
    y = p!.y + 10;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 120, y, { steps: 8 });
  await page.goBack();
  await page.mouse.up();
  await expect(page).toHaveURL(/\/best$/);
  await expect(page.locator('app-discussion-view')).toHaveCount(0);
  const link = page.locator('.story-comments').first();
  await link.focus();
  await expect(link).toBeFocused();
});

test('losing window focus during settling cannot commit navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const key = await active(page).getAttribute('data-entry-key');
  const p = await active(page).locator('.comment-body p').first().boundingBox();
  const x = Math.max(60, p!.x + 15),
    y = p!.y + 10;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 140, y, { steps: 8 });
  await page.mouse.up();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect
    .poll(() =>
      page.locator('.sidebar-panel').evaluate((el) => el.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
  await expect.poll(() => active(page).evaluate((el) => el.getBoundingClientRect().left)).toBe(0);
});

test('a new branch after Back releases the old forward discussion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const root = await active(page).getAttribute('data-entry-key');
  await active(page).locator('button[title="View this thread"]').first().click();
  await expect(active(page)).not.toHaveAttribute('data-entry-key', root!);
  const oldChild = await active(page).getAttribute('data-entry-key');
  await active(page).getByRole('button', { name: 'Go back to previous view' }).click();
  await expect(active(page)).toHaveAttribute('data-entry-key', root!);
  await active(page).locator('button[title="View this thread"]').nth(1).click();
  await expect(active(page)).not.toHaveAttribute('data-entry-key', root!);
  const branch = await active(page).getAttribute('data-entry-key');
  await expect(page.locator(`app-discussion-view[data-entry-key="${oldChild}"]`)).toHaveCount(0);
  const p = await active(page).locator('.comment-body p').first().boundingBox();
  const x = 300,
    y = p!.y + 10;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 160, y, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => active(page).evaluate((el) => el.getBoundingClientRect().left)).toBe(0);
  await expect(active(page)).toHaveAttribute('data-entry-key', branch!);
});
