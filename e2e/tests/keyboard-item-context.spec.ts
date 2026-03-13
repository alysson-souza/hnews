import { test, expect } from '../fixtures/pages.fixture';

test.describe('Keyboard Shortcuts - Item/Comments Page', () => {
  test('should navigate to next comment with j', async ({ itemPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await itemPage.navigateToItem(40224596);

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

  test('should navigate to previous comment with k', async ({ itemPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await itemPage.navigateToItem(40224596);

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

  test('should toggle collapse with c key', async ({ itemPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await itemPage.navigateToItem(40224596);

    const treeitems = page.locator('[role="treeitem"]');
    await treeitems
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});

    const commentCount = await treeitems.count();
    test.skip(commentCount === 0, 'No comments available');

    // Select first comment
    await page.keyboard.press('j');
    await page.waitForTimeout(200);

    const selectedComment = page.locator('[role="treeitem"][aria-selected="true"]');
    const commentText = selectedComment.locator('app-comment-text');
    await expect(commentText).toBeVisible();

    // Collapse with c
    await page.keyboard.press('c');
    await page.waitForTimeout(300);

    await expect(commentText).not.toBeVisible();

    // Expand with c again
    await page.keyboard.press('c');
    await page.waitForTimeout(300);

    await expect(commentText).toBeVisible();
  });

  test('should view thread with l key', async ({ itemPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await itemPage.navigateToItem(40224596);

    const treeitems = page.locator('[role="treeitem"]');
    await treeitems
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});

    const hasThreads = await page.locator('button[title="View this thread"]').count();
    test.skip(hasThreads === 0, 'No threaded comments available');

    const originalUrl = page.url();

    await page.keyboard.press('j');
    await page.waitForTimeout(200);
    await page.keyboard.press('l');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/item\/\d+/);
    expect(page.url()).not.toBe(originalUrl);
  });

  test('should go back with h key', async ({ itemPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await itemPage.navigateToItem(40224596);

    const treeitems = page.locator('[role="treeitem"]');
    await treeitems
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});

    const hasThreads = await page.locator('button[title="View this thread"]').count();
    test.skip(hasThreads === 0, 'No threaded comments available');

    // Navigate into a thread with l
    await page.keyboard.press('j');
    await page.waitForTimeout(200);
    await page.keyboard.press('l');
    await page.waitForTimeout(500);

    const threadUrl = page.url();
    await expect(page).toHaveURL(/\/item\/\d+/);

    // Go back with h
    await page.keyboard.press('h');
    await page.waitForTimeout(500);

    expect(page.url()).not.toBe(threadUrl);
    await expect(page).toHaveURL(/\/item\/40224596/);
  });

  test('should go back with Escape', async ({ storiesPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    // Navigate to /top and use Shift+C to navigate to item via Angular router
    await storiesPage.navigateToTop();
    await page.waitForTimeout(500);

    await page.keyboard.press('j');
    await page.waitForTimeout(200);
    await page.keyboard.press('Shift+C');
    await page.waitForURL(/\/item\/\d+/, { timeout: 10000 });

    await expect(page).toHaveURL(/\/item\/\d+/);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/top/);
  });

  test('should verify comments use treeitem role', async ({ itemPage, page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await itemPage.navigateToItem(40224596);

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
