import { test, expect } from '../fixtures/pages.fixture';

async function navigateToStoryWithComments(
  storiesPage: { navigateToTop(): Promise<void>; storyItems: import('@playwright/test').Locator },
  page: import('@playwright/test').Page,
): Promise<string> {
  await storiesPage.navigateToTop();

  const commentLinks = storiesPage.storyItems.locator('.story-comments');
  const linkCount = await commentLinks.count();

  for (let index = 0; index < linkCount; index++) {
    const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
    const countMatch = text.match(/\d+/);
    const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
    const href = await commentLinks.nth(index).getAttribute('href');

    if (commentCount > 1 && href?.includes('/item/')) {
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: /Comments/ }).waitFor({ timeout: 10000 });
      return href;
    }
  }

  throw new Error('Fixture data guarantees a story with comments in the top feed');
}

async function focusDocument(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
}

async function getSelectedCommentId(page: import('@playwright/test').Page): Promise<string | null> {
  return page.locator('[role="treeitem"][aria-selected="true"]').getAttribute('data-comment-id');
}

async function selectCommentById(
  page: import('@playwright/test').Page,
  targetCommentId: string,
): Promise<string> {
  await focusDocument(page);

  const treeitemCount = await page.locator('[role="treeitem"]').count();
  let previousId: string | null = null;
  for (let index = 0; index < treeitemCount; index++) {
    await page.keyboard.press('j');
    // Wait for the selection to actually advance (not just be truthy) so a
    // key press processed faster than change detection can't be mistaken
    // for a no-op and silently skip the target comment.
    await expect.poll(() => getSelectedCommentId(page)).not.toBe(previousId);

    const selectedId = await getSelectedCommentId(page);
    if (selectedId === targetCommentId) {
      return targetCommentId;
    }
    previousId = selectedId;
  }

  throw new Error(`Failed to select comment ${targetCommentId}`);
}

async function selectCommentWithThread(page: import('@playwright/test').Page): Promise<string> {
  const threadButton = page.locator('button[title="View this thread"]').first();
  const targetCommentId = await threadButton
    .locator('xpath=ancestor::*[@role="treeitem"][1]')
    .getAttribute('data-comment-id');

  if (!targetCommentId) {
    throw new Error('No threaded comment could be identified');
  }

  return selectCommentById(page, targetCommentId);
}

async function findLeafCommentId(page: import('@playwright/test').Page): Promise<string | null> {
  return page.evaluate(() => {
    const treeitems = Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]'));
    const leaf = treeitems.find(
      (treeitem) =>
        !treeitem.querySelector('.comment-card .header button[title="View this thread"]'),
    );

    return leaf?.getAttribute('data-comment-id') ?? null;
  });
}

test.describe('Keyboard Shortcuts - Item/Comments Page', () => {
  test('should navigate to next comment with j', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await navigateToStoryWithComments(storiesPage, page);

    // Wait for comments to load from API
    const treeitems = page.locator('[role="treeitem"]');
    await treeitems
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});

    const commentCount = await treeitems.count();
    if (commentCount === 0) {
      throw new Error('Fixture story guarantees comments are loaded');
    }

    // j selects the first comment (docs/comment-navigation.md: J moves to the next comment)
    const firstCommentId = await treeitems.first().getAttribute('data-comment-id');
    await page.keyboard.press('j');
    await expect.poll(() => getSelectedCommentId(page), { timeout: 5_000 }).toBe(firstCommentId);

    const selectedComment = page.locator('[role="treeitem"][aria-selected="true"]');
    await expect(selectedComment).toHaveCount(1);

    const focusedCard = selectedComment.locator('.comment-card.keyboard-focused');
    await expect(focusedCard).toBeVisible();
  });

  test('should navigate to previous comment with k', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await navigateToStoryWithComments(storiesPage, page);

    const treeitems = page.locator('[role="treeitem"]');
    await treeitems
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});

    const commentCount = await treeitems.count();
    if (commentCount < 2) {
      throw new Error('Fixture story guarantees at least two comments for k navigation');
    }

    const firstCommentId = await treeitems.first().getAttribute('data-comment-id');

    // Press j twice to select the second comment
    await page.keyboard.press('j');
    await expect.poll(() => getSelectedCommentId(page)).toBe(firstCommentId);

    await page.keyboard.press('j');
    await expect.poll(() => getSelectedCommentId(page)).not.toBe(firstCommentId);

    // k must return the selection to the first comment
    await page.keyboard.press('k');
    await expect.poll(() => getSelectedCommentId(page)).toBe(firstCommentId);
    await expect(page.locator('[role="treeitem"][aria-selected="true"]')).toHaveCount(1);
  });

  test('should toggle collapse with c key', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await navigateToStoryWithComments(storiesPage, page);

    const treeitems = page.locator('[role="treeitem"]');
    await treeitems
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});

    const commentCount = await treeitems.count();
    if (commentCount === 0) {
      throw new Error('Fixture story guarantees comments are loaded');
    }

    const leafCommentId = await findLeafCommentId(page);
    if (!leafCommentId) {
      throw new Error('Fixture story guarantees a leaf comment for the collapse test');
    }

    await selectCommentById(page, leafCommentId);

    const selectedComment = page.locator('[role="treeitem"][aria-selected="true"]');
    const commentText = selectedComment.locator(':scope > .comment-card app-comment-text');
    await expect(commentText).toBeVisible();

    // Collapse with c
    await page.keyboard.press('c');

    await expect(selectedComment).toHaveAttribute('aria-expanded', 'false');
    await expect(selectedComment.locator(':scope > .comment-card .collapsed-text')).toBeVisible();

    // Expand with c again
    await page.keyboard.press('c');

    await expect(selectedComment).toHaveAttribute('aria-expanded', 'true');
    await expect(commentText).toBeVisible();
  });

  test('should view thread with l key', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await navigateToStoryWithComments(storiesPage, page);

    const treeitems = page.locator('[role="treeitem"]');
    await treeitems
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});

    const hasThreads = await page.locator('button[title="View this thread"]').count();
    if (hasThreads === 0) {
      throw new Error('Fixture story guarantees at least one threaded (non-leaf) comment');
    }

    const originalUrl = page.url();

    await selectCommentWithThread(page);
    await page.keyboard.press('l');
    await page.waitForURL(/\/item\/\d+/, { timeout: 10_000 });
    expect(page.url()).not.toBe(originalUrl);
  });

  test('should go back with h key', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    const itemHref = await navigateToStoryWithComments(storiesPage, page);

    const treeitems = page.locator('[role="treeitem"]');
    await treeitems
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});

    const hasThreads = await page.locator('button[title="View this thread"]').count();
    if (hasThreads === 0) {
      throw new Error('Fixture story guarantees at least one threaded (non-leaf) comment');
    }

    await selectCommentWithThread(page);
    await page.keyboard.press('l');
    await page.waitForURL(/\/item\/\d+/, { timeout: 10_000 });

    const threadUrl = page.url();

    await page.keyboard.press('h');
    await expect
      .poll(() => page.evaluate(() => location.pathname), { timeout: 10_000 })
      .toBe(itemHref);
    expect(page.url()).not.toBe(threadUrl);
  });

  test('should go back with Escape', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await focusDocument(page);

    await page.keyboard.press('j');
    await expect(page.locator('.story-card-selected')).toHaveCount(1);

    await page.keyboard.press('Shift+C');
    await page.waitForURL(/\/item\/\d+/, { timeout: 10000 });

    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/top/, { timeout: 10_000 });
  });

  test('should verify comments use treeitem role', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await navigateToStoryWithComments(storiesPage, page);

    // Wait for comments to load from API
    const treeitems = page.locator('[role="treeitem"]');
    await treeitems
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});

    const count = await treeitems.count();
    if (count === 0) {
      throw new Error('Fixture story guarantees comments are loaded');
    }

    // Verify treeitem attributes
    const firstTreeitem = treeitems.first();
    await expect(firstTreeitem).toHaveAttribute('aria-level');
    await expect(firstTreeitem).toHaveAttribute('data-comment-id');
  });
});
