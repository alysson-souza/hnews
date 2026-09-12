import { test, expect } from '../fixtures/pages.fixture';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('user.settings.v1')) {
      localStorage.setItem('user.settings.v1', JSON.stringify({ openCommentsInSidebar: true }));
    }
  });
});

test('desktop moves the sidebar and its contents together', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto('/top');
  await expect(page.locator('.story-comments').first()).toBeVisible();
  const samples = await page.evaluate(async () => {
    const readings: { page: number; discussion: number }[] = [];
    (document.querySelector('.story-comments') as HTMLElement).click();
    const start = performance.now();
    while (performance.now() - start < 450) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const discussion = document.querySelector('app-discussion-view[data-active="true"]');
      if (!discussion) continue;
      const r = discussion.getBoundingClientRect();
      const panel = document.querySelector('.sidebar-panel')!.getBoundingClientRect();
      readings.push({ page: panel.left, discussion: r.left });
    }
    return readings;
  });
  expect(samples.length).toBeGreaterThan(2);
  expect(
    Math.max(...samples.map((s) => s.page)) - Math.min(...samples.map((s) => s.page)),
  ).toBeGreaterThan(100);
  expect(Math.max(...samples.map((s) => Math.abs(s.page - s.discussion)))).toBeLessThanOrEqual(1);
});

test('desktop keeps its original first-discussion controls', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto('/top');
  await page.locator('.story-comments').first().click();
  await expect(page.getByRole('button', { name: 'Close sidebar', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open in full view', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Go forward to next discussion', exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Go back to previous view', exact: true }),
  ).not.toBeVisible();
});

test('dragging comment text in desktop mobile emulation starts the swipe', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Exercise the desktop pointer path at a mobile viewport');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/top');
  await page.locator('.story-comments').first().click();
  const screen = page.locator('app-discussion-view[data-active="true"]');
  const text = screen.locator('.comment-body p').first();
  await expect(text).toBeVisible();
  await expect.poll(() => screen.evaluate((el) => el.getBoundingClientRect().left)).toBe(0);
  const box = await text.boundingBox();
  const x = Math.max(50, box!.x + 20),
    y = box!.y + Math.min(12, box!.height / 2);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 150, y + 4, { steps: 15 });
  await expect
    .poll(() => screen.evaluate((el) => el.getBoundingClientRect().left))
    .toBeGreaterThan(100);
  await page.mouse.up();
  await expect(screen).toHaveCount(0);
});

test('desktop closes the whole panel without leaving floating controls', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);
  await page.goto('/top');
  await page.locator('.story-comments').first().click();
  const screen = page.locator('app-discussion-view[data-active="true"]');
  await expect
    .poll(() => screen.evaluate((el) => el.getBoundingClientRect().left))
    .toBeLessThan(800);
  const samples = await page.evaluate(async () => {
    const readings: number[] = [];
    (
      document.querySelector(
        'app-discussion-view[data-active="true"] button[aria-label="Close sidebar"]',
      ) as HTMLElement
    ).click();
    const start = performance.now();
    while (performance.now() - start < 400) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const panel = document.querySelector('.sidebar-panel')!;
      const screen = panel.querySelector('app-discussion-view');
      if (screen)
        readings.push(
          Math.abs(panel.getBoundingClientRect().left - screen.getBoundingClientRect().left),
        );
    }
    return readings;
  });
  expect(samples.length).toBeGreaterThan(2);
  expect(Math.max(...samples)).toBeLessThanOrEqual(1);
  await expect(page.locator('app-discussion-view')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Go forward to next discussion', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Close sidebar', exact: true })).toHaveCount(0);
});

for (const platform of ['MacIntel', 'Linux x86_64']) {
  for (const width of [637, 1280]) {
    test(`original toolbar order on ${platform} at ${width}px`, async ({ page, isMobile }) => {
      test.skip(isMobile);
      await page.setViewportSize({ width, height: 1382 });
      await page.addInitScript(
        (platform) => Object.defineProperty(navigator, 'platform', { value: platform }),
        platform,
      );
      await page.goto('/top');
      await page.locator('.story-comments').first().click();
      const active = page.locator('app-discussion-view[data-active="true"]');
      await active.locator('button[title="View this thread"]').first().click();
      const back = active.getByRole('button', { name: 'Go back to previous view', exact: true });
      const close = active.getByRole('button', { name: 'Close sidebar', exact: true });
      await expect(back).toBeVisible();
      await expect(close).toBeVisible();
      const leftToRight = await active
        .locator('app-sidebar-comments-header button:visible')
        .evaluateAll((buttons) =>
          buttons
            .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
            .map((button) => button.getAttribute('aria-label')),
        );
      expect(leftToRight).toEqual(
        platform === 'MacIntel'
          ? ['Close sidebar', 'Go back to previous view']
          : ['Go back to previous view', 'Close sidebar'],
      );
    });
  }
}

test('desktop switches stories in an open sidebar without sliding', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto('/top');
  await page.locator('.story-comments').first().click();
  const active = page.locator('app-discussion-view[data-active="true"]');
  await expect(active.locator('[role="treeitem"]').first()).toBeVisible();
  await expect
    .poll(() => page.locator('.sidebar-panel').evaluate((el) => el.getAnimations().length))
    .toBe(0);
  const originalKey = await active.getAttribute('data-entry-key');
  const offsets = await page.evaluate(async () => {
    const samples: number[] = [];
    (document.querySelectorAll('.story-comments')[1] as HTMLElement).click();
    const start = performance.now();
    while (performance.now() - start < 350) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const panel = document.querySelector('.sidebar-panel')!.getBoundingClientRect();
      const view = document
        .querySelector('app-discussion-view[data-active="true"]')!
        .getBoundingClientRect();
      samples.push(Math.abs(view.left - panel.left));
    }
    return samples;
  });
  await expect(active).not.toHaveAttribute('data-entry-key', originalKey!);
  await expect(active.locator('app-sidebar-story-summary')).toContainText(
    'Many Top-Level Comments',
  );
  expect(Math.max(...offsets)).toBeLessThanOrEqual(1);
});

for (const depth of [0, 1]) {
  test(`Escape ends a mobile discussion session at depth ${depth}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/top');
    await page.locator('.story-comments').first().click();
    const active = page.locator('app-discussion-view[data-active="true"]');
    await expect(active.locator('[role="treeitem"]').first()).toBeVisible();
    if (depth) {
      const key = await active.getAttribute('data-entry-key');
      await active.locator('button[title="View this thread"]').first().click();
      await expect(active).not.toHaveAttribute('data-entry-key', key!);
    }
    await page.keyboard.press('Escape');
    await expect(page.locator('app-discussion-view')).toHaveCount(0);
  });
}

for (const width of [390, 1280]) {
  test(`Enter activates the comments link once at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/top');
    await page.locator('.story-comments').first().press('Enter');
    const active = page.locator('app-discussion-view[data-active="true"]');
    await expect(active.locator('[role="treeitem"]').first()).toBeVisible();
    await expect(page).toHaveURL(/\/top$/);
    await active.getByRole('button', { name: 'Close sidebar', exact: true }).click();
    await expect(page.locator('app-discussion-view')).toHaveCount(0);
    await page.locator('.story-comments').first().press('Enter');
    await expect(active.locator('[role="treeitem"]').first()).toBeVisible();
  });
}

test('Enter keeps full-page navigation when the sidebar preference is disabled', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/top');
  await page.evaluate(() =>
    localStorage.setItem('user.settings.v1', JSON.stringify({ openCommentsInSidebar: false })),
  );
  await page.reload();
  await page.locator('.story-comments').first().press('Enter');
  await expect(page).toHaveURL(/\/item\/\d+/);
  await expect(page.locator('app-discussion-view')).toHaveCount(0);
});
