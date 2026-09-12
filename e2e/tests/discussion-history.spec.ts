import { test, expect } from '../fixtures/pages.fixture';
import { addComment, MAIN_STORY_ID } from '../fixtures/hn-fixture-data';
import { type Page } from '@playwright/test';

const active = (page: Page) => page.locator('app-discussion-view[data-active="true"]');
async function open(page: Page) {
  await page.goto('/top');
  await page.locator('.story-comments').first().click();
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
}
async function nested(page: Page) {
  const key = await active(page).getAttribute('data-entry-key');
  await active(page).locator('button[title="View this thread"]').first().click();
  await expect(active(page)).not.toHaveAttribute('data-entry-key', key!);
  await expect(active(page).locator('[role="treeitem"]').first()).toBeVisible();
}
async function drag(page: Page, dx: number, end: 'up' | 'cancel' | 'hold' = 'up') {
  // Dispatch touch streams to the actual reading surface, including WebKit.
  // Native input scrolling is checked separately; these events test gesture arbitration.
  await active(page)
    .locator('.comments-body')
    .evaluate(
      (el, { dx, end }) => {
        const target = el as HTMLElement;
        const x = dx > 0 ? 80 : innerWidth - 80;
        const dispatch = (type: string, currentX: number) => {
          const touch = { identifier: 7, target, clientX: currentX, clientY: 260 };
          const event = new Event(type, { bubbles: true, cancelable: true });
          Object.defineProperties(event, {
            touches: { value: type === 'touchend' || type === 'touchcancel' ? [] : [touch] },
            changedTouches: { value: [touch] },
          });
          target.dispatchEvent(event);
        };
        dispatch('touchstart', x);
        dispatch('touchmove', x + dx);
        if (end !== 'hold') dispatch(end === 'cancel' ? 'touchcancel' : 'touchend', x + dx);
      },
      { dx, end },
    );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('user.settings.v1'))
      localStorage.setItem('user.settings.v1', JSON.stringify({ openCommentsInSidebar: true }));
  });
});

test('normal entry, nested Back/Forward, explicit close and full-page preference', async ({
  page,
  isMobile,
}) => {
  await open(page);
  await expect(page).toHaveURL(/\/top$/);
  const first = await active(page).getAttribute('data-entry-key');
  await nested(page);
  const second = await active(page).getAttribute('data-entry-key');
  await active(page).getByRole('button', { name: 'Go back to previous view' }).click();
  await expect(active(page)).toHaveAttribute('data-entry-key', first!);
  if (isMobile) {
    await drag(page, -180);
    await expect(active(page)).toHaveAttribute('data-entry-key', second!);
  }
  await active(page).getByRole('button', { name: 'Close sidebar' }).click();
  await expect(page.locator('app-discussion-view')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Go forward to next discussion' })).toHaveCount(0);
  await page.evaluate(() =>
    localStorage.setItem('user.settings.v1', JSON.stringify({ openCommentsInSidebar: false })),
  );
  await page.reload();
  await page.locator('.story-comments').first().click();
  await expect(page).toHaveURL(/\/item\/\d+/);
});

test('partial swipe reveals two real screens and cancellation preserves focus and visits', async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'Mobile presentation');
  await open(page);
  await nested(page);
  const key = await active(page).getAttribute('data-entry-key');
  const before = await page.evaluate(() => ({
    focus: document.activeElement?.outerHTML,
    storage: JSON.stringify(localStorage),
  }));
  await drag(page, 120, 'hold');
  const rects = await page.locator('app-discussion-view').evaluateAll((els) =>
    els
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, text: el.textContent };
      })
      .filter((r) => r.right > 0 && r.left < innerWidth),
  );
  expect(rects).toHaveLength(2);
  expect(rects.every((r) => r.text!.includes('Comments'))).toBe(true);
  await page.screenshot({ path: '/tmp/hnews-partial-swipe.png' });
  await page.locator('.comments-body').last().dispatchEvent('touchcancel');
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
  expect(
    await page.evaluate(() => ({
      focus: document.activeElement?.outerHTML,
      storage: JSON.stringify(localStorage),
    })),
  ).toEqual(before);
  await drag(page, 35);
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
  await expect
    .poll(() => active(page).evaluate((el) => Math.round(el.getBoundingClientRect().left)))
    .toBe(0);
});

test('swipe Back reaches the page and Forward reopens, including reduced motion', async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'Mobile presentation');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  const key = await active(page).getAttribute('data-entry-key');
  await drag(page, 180);
  await expect(active(page)).toHaveCount(0);
  await page.locator('app-shell').evaluate((el) => {
    const target = el as HTMLElement;
    for (const [type, x] of [
      ['touchstart', 300],
      ['touchmove', 100],
      ['touchend', 100],
    ] as const) {
      const t = { identifier: 9, target, clientX: x, clientY: 300 };
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        touches: { value: type === 'touchend' ? [] : [t] },
        changedTouches: { value: [t] },
      });
      target.dispatchEvent(event);
    }
  });
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
});

test('restores scroll and expanded comments after releasing older views; bounds screens', async ({
  page,
  hnDataset,
}) => {
  let parent = MAIN_STORY_ID;
  hnDataset.items.get(parent)!.kids = [];
  for (let i = 0; i < 6; i++) {
    parent = addComment(hnDataset, {
      parent,
      storyId: MAIN_STORY_ID,
      text: `<p>Level ${i}</p>` + '<p>Reading position paragraph.</p>'.repeat(25),
    }).id;
  }
  await open(page);
  const first = await active(page).getAttribute('data-entry-key');
  const scroll = active(page).locator('.sidebar-comments-panel');
  await expect(active(page).locator('[role="treeitem"]')).toHaveCount(6);
  await active(page).getByRole('button', { name: 'Collapse comment', exact: true }).last().click();
  await page.keyboard.press('j');
  const selected = await active(page)
    .locator('[aria-selected="true"]')
    .getAttribute('data-comment-id');
  const expanded = await active(page).locator('[role="treeitem"][aria-expanded="true"]').count();
  await scroll.evaluate((el) => {
    el.scrollTop = 180;
  });
  await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  const saved = await scroll.evaluate((el) => el.scrollTop);
  for (let i = 0; i < 3; i++) {
    if (i === 0) {
      await page.keyboard.press('l');
      await expect(active(page)).not.toHaveAttribute('data-entry-key', first!);
    } else await nested(page);
    expect(await page.locator('app-discussion-view').count()).toBeLessThanOrEqual(3);
  }
  await page.route('**/v0/**', (route) => route.abort());
  await page.route('**/api/v1/**', (route) => route.abort());
  for (let i = 0; i < 3; i++) {
    const current = await active(page).getAttribute('data-entry-key');
    await active(page).getByRole('button', { name: 'Go back to previous view' }).click();
    await expect(active(page)).not.toHaveAttribute('data-entry-key', current!);
  }
  await expect(active(page)).toHaveAttribute('data-entry-key', first!);
  await expect(active(page).locator('[aria-selected="true"]')).toHaveAttribute(
    'data-comment-id',
    selected!,
  );
  await expect(active(page).locator('[role="treeitem"][aria-expanded="true"]')).toHaveCount(
    expanded,
  );
  await expect
    .poll(() =>
      active(page)
        .locator('.sidebar-comments-panel')
        .evaluate((el) => el.scrollTop),
    )
    .toBeCloseTo(saved, 0);
});

test('rotation cancels a drag and inactive screens cannot receive focus', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'Mobile presentation');
  await open(page);
  await nested(page);
  const key = await active(page).getAttribute('data-entry-key');
  await drag(page, 160, 'hold');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
  await expect.poll(() => active(page).evaluate((el) => el.getBoundingClientRect().left)).toBe(0);
  const inactive = page.locator('app-discussion-view[data-active="false"]').first();
  await expect(inactive).toHaveAttribute('inert', '');
  expect(
    await inactive.evaluate((el) => {
      (el.querySelector('button') as HTMLElement).focus();
      return el.contains(document.activeElement);
    }),
  ).toBe(false);
});

test('native touch preserves vertical scroll, code panning and pinch gestures', async ({
  page,
  context,
  hnDataset,
  browserName,
  isMobile,
}) => {
  test.skip(browserName !== 'chromium' || !isMobile, 'CDP native touch input');
  const root = hnDataset.items.get(MAIN_STORY_ID)!;
  const comment = hnDataset.items.get(root.kids![0])!;
  comment.text =
    '<pre><code>' +
    'long_code_line_'.repeat(50) +
    '</code></pre>' +
    '<p>Vertical reading paragraph.</p>'.repeat(50);
  await open(page);
  const key = await active(page).getAttribute('data-entry-key');
  const cdp = await context.newCDPSession(page);
  async function touch(
    points: { x: number; y: number }[],
    type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel',
  ) {
    await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  }
  const scroll = active(page).locator('.sidebar-comments-panel');
  const before = await scroll.evaluate((el) => el.scrollTop);
  await touch([{ x: 260, y: 600 }], 'touchStart');
  for (let y = 580; y >= 340; y -= 20) {
    await touch([{ x: 260, y }], 'touchMove');
    await page.waitForTimeout(16);
  }
  await touch([], 'touchEnd');
  await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(before);
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
  const code = active(page).locator('pre').first();
  await code.evaluate((el) => {
    const panel = el.closest('.sidebar-comments-panel')!;
    const toolbar = panel.querySelector('.comments-heading')!;
    panel.scrollTop +=
      el.getBoundingClientRect().top -
      panel.getBoundingClientRect().top -
      toolbar.getBoundingClientRect().height -
      30;
  });
  const box = await code.boundingBox();
  const y = box!.y + Math.min(18, box!.height / 2);
  await touch([{ x: 280, y }], 'touchStart');
  for (let x = 260; x >= 90; x -= 20) {
    await touch([{ x, y }], 'touchMove');
    await page.waitForTimeout(16);
  }
  await touch([], 'touchEnd');
  await expect.poll(() => code.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
  await touch([{ x: 80, y: 550 }], 'touchStart');
  for (let x = 100; x <= 240; x += 20) {
    await touch([{ x, y: 550 }], 'touchMove');
    await page.waitForTimeout(16);
  }
  await expect
    .poll(() => active(page).evaluate((el) => el.getBoundingClientRect().left))
    .toBeGreaterThan(100);
  await touch([], 'touchCancel');
  await expect.poll(() => active(page).evaluate((el) => el.getBoundingClientRect().left)).toBe(0);
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
  await touch(
    [
      { x: 140, y: 400 },
      { x: 230, y: 400 },
    ],
    'touchStart',
  );
  await touch(
    [
      { x: 90, y: 400 },
      { x: 290, y: 400 },
    ],
    'touchMove',
  );
  await touch([], 'touchEnd');
  await expect(active(page)).toHaveAttribute('data-entry-key', key!);
});

test('repeated navigation keeps at most three views and measures animation frames', async ({
  page,
}, testInfo) => {
  await open(page);
  await page.evaluate(() => {
    const sample = { frames: [] as number[], previous: performance.now(), running: true, views: 0 };
    Object.assign(window, { discussionFrames: sample });
    const frame = (now: number) => {
      sample.frames.push(now - sample.previous);
      sample.previous = now;
      sample.views = Math.max(
        sample.views,
        document.querySelectorAll('app-discussion-view').length,
      );
      if (sample.running) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  for (let i = 0; i < 8; i++) {
    await nested(page);
    const key = await active(page).getAttribute('data-entry-key');
    await active(page).getByRole('button', { name: 'Go back to previous view' }).click();
    await expect(active(page)).not.toHaveAttribute('data-entry-key', key!);
  }
  const metrics = await page.evaluate(() => {
    const sample = (
      window as unknown as {
        discussionFrames: { frames: number[]; running: boolean; views: number };
      }
    ).discussionFrames;
    sample.running = false;
    const frames = sample.frames.slice(1).sort((a, b) => a - b);
    return {
      p95: frames[Math.floor(frames.length * 0.95)],
      max: Math.max(...frames),
      retainedViews: sample.views,
      samples: frames.length,
    };
  });
  console.log(testInfo.project.name, 'discussion frame timing', metrics);
  expect(metrics.retainedViews).toBeLessThanOrEqual(3);
  expect(metrics.samples).toBeGreaterThan(10);
  // Shared CI runners do not provide a stable frame-time budget. Keep the
  // measurements as artifacts; gate this test on bounded rendering and interaction.
  await testInfo.attach('discussion-frame-timing', {
    body: JSON.stringify(metrics),
    contentType: 'application/json',
  });
});

test('late comment responses cannot reopen a closed discussion', async ({ page, hnDataset }) => {
  const child = hnDataset.items.get(MAIN_STORY_ID)!.kids![0];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested!: () => void;
  const pending = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route(`**/item/${child}.json`, async (route) => {
    requested();
    await gate;
    await route.fulfill({ json: hnDataset.items.get(child) });
  });
  await page.goto('/top');
  await page.locator('.story-comments').first().click();
  await pending;
  await active(page).getByRole('button', { name: 'Close sidebar' }).click();
  release();
  await page.locator('.story-comments').nth(1).click();
  await expect(active(page).locator('app-sidebar-story-summary')).toContainText(
    'Many Top-Level Comments',
  );
  await expect(page.locator('app-discussion-view')).toHaveCount(1);
  await expect(active(page).locator('app-sidebar-story-summary')).not.toContainText('Mega Thread');
});

test('retained discussions do not overwrite each other after closing and reopening', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const rootComment = active(page).locator('[role="treeitem"]').first();
  const commentId = await rootComment.getAttribute('data-comment-id');
  await nested(page);
  const childKey = await active(page).getAttribute('data-entry-key');
  await active(page).getByRole('button', { name: 'Go back to previous view' }).click();
  await expect(active(page)).not.toHaveAttribute('data-entry-key', childKey!);
  await rootComment.getByRole('button', { name: 'Collapse comment', exact: true }).first().click();
  await expect(rootComment).toHaveAttribute('aria-expanded', 'false');
  await drag(page, -180);
  await expect(active(page)).toHaveAttribute('data-entry-key', childKey!);
  await active(page).getByRole('button', { name: 'Collapse comment', exact: true }).first().click();
  await active(page).getByRole('button', { name: 'Close sidebar' }).click();
  await expect(page.locator('app-discussion-view')).toHaveCount(0);
  await page.reload();
  await page.locator('.story-comments').first().click();
  await expect(
    active(page).locator(`[role="treeitem"][data-comment-id="${commentId}"]`),
  ).toHaveAttribute('aria-expanded', 'false');
});

test('Forward restores the departing discussion selection after Back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.keyboard.press('j');
  const parentSelection = await active(page)
    .locator('[aria-selected="true"]')
    .getAttribute('data-comment-id');
  await nested(page);
  await page.keyboard.press('j');
  const childSelection = await active(page)
    .locator('[aria-selected="true"]')
    .getAttribute('data-comment-id');
  expect(childSelection).not.toBe(parentSelection);
  const childKey = await active(page).getAttribute('data-entry-key');
  await active(page).getByRole('button', { name: 'Go back to previous view' }).click();
  await expect(active(page).locator('[aria-selected="true"]')).toHaveAttribute(
    'data-comment-id',
    parentSelection!,
  );
  await drag(page, -180);
  await expect(active(page)).toHaveAttribute('data-entry-key', childKey!);
  await expect(active(page).locator('[aria-selected="true"]')).toHaveAttribute(
    'data-comment-id',
    childSelection!,
  );
});
