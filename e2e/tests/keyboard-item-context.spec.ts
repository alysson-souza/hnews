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

  test.skip(true, 'No story with comments available in current feed');
  throw new Error('No story with comments available in current feed');
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
  for (let index = 0; index < treeitemCount; index++) {
    await page.keyboard.press('j');
    await expect.poll(() => getSelectedCommentId(page)).toBeTruthy();

    if ((await getSelectedCommentId(page)) === targetCommentId) {
      return targetCommentId;
    }
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
    test.skip(commentCount === 0, 'No comments available');

    await page.keyboard.press('j');
    await page.waitForTimeout(300);

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
    test.skip(commentCount < 2, 'Not enough comments for k navigation');

    // Press j twice to select second comment
    await page.keyboard.press('j');
    await page.waitForTimeout(200);
    await page.keyboard.press('j');
    await page.waitForTimeout(200);

    const secondSelectedId = await page
      .locator('[role="treeitem"][aria-selected="true"]')
      .getAttribute('data-comment-id');

    // Press k to go back to first comment
    await page.keyboard.press('k');
    await page.waitForTimeout(200);

    const firstSelectedId = await page
      .locator('[role="treeitem"][aria-selected="true"]')
      .getAttribute('data-comment-id');

    expect(firstSelectedId).not.toBe(secondSelectedId);
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
    test.skip(commentCount === 0, 'No comments available');

    const leafCommentId = await findLeafCommentId(page);
    test.skip(!leafCommentId, 'No leaf comment available for collapse test');

    await selectCommentById(page, leafCommentId);

    const selectedComment = page.locator('[role="treeitem"][aria-selected="true"]');
    const commentText = selectedComment.locator(':scope > .comment-card app-comment-text');
    await expect(commentText).toBeVisible();

    // Collapse with c
    await page.keyboard.press('c');
    await page.waitForTimeout(300);

    await expect(selectedComment).toHaveAttribute('aria-expanded', 'false');
    await expect(selectedComment.locator(':scope > .comment-card .collapsed-text')).toBeVisible();

    // Expand with c again
    await page.keyboard.press('c');
    await page.waitForTimeout(300);

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
    test.skip(hasThreads === 0, 'No threaded comments available');

    const originalUrl = page.url();

    await selectCommentWithThread(page);
    await page.keyboard.press('l');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/item\/\d+/);
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
    test.skip(hasThreads === 0, 'No threaded comments available');

    await selectCommentWithThread(page);
    await page.keyboard.press('l');
    await page.waitForTimeout(500);

    const threadUrl = page.url();
    await expect(page).toHaveURL(/\/item\/\d+/);

    await page.keyboard.press('h');
    await page.waitForTimeout(500);

    expect(page.url()).not.toBe(threadUrl);
    await expect(page).toHaveURL(new RegExp(itemHref.replace(/\//g, '\\/')));
  });

  test('should go back with Escape', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);
    await focusDocument(page);

    await page.keyboard.press('j');
    await expect(page.locator('.story-card-selected')).toHaveCount(1);

    await page.keyboard.press('Shift+C');
    await page.waitForURL(/\/item\/\d+/, { timeout: 10000 });

    await expect(page).toHaveURL(/\/item\/\d+/);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/top/);
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
    test.skip(count === 0, 'No comments loaded for this item');

    // Verify treeitem attributes
    const firstTreeitem = treeitems.first();
    await expect(firstTreeitem).toHaveAttribute('aria-level');
    await expect(firstTreeitem).toHaveAttribute('data-comment-id');
  });
});
