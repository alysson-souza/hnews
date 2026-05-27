import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures/pages.fixture';

test.describe('Story Actions Menu - Keyboard Interaction', () => {
  test.beforeEach(async ({ storiesPage }) => {
    await storiesPage.navigateToTop();
  });

  async function findFirstCommentsLinkWithComments(page: Page): Promise<Locator> {
    const commentLinks = page.locator('app-story-item .story-comments');
    const linkCount = await commentLinks.count();

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        return commentLinks.nth(index);
      }
    }

    test.skip(true, 'No story with comments available');
    throw new Error('No story with comments available');
  }

  async function expectMenuInViewport(page: Page, menu: Locator): Promise<void> {
    const box = await menu.boundingBox();
    const viewport = page.viewportSize();

    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();

    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  }

  test('should open menu and focus first item when clicking the button', async ({ page }) => {
    const actionsBtn = page.locator('button.story-actions-btn').first();
    await actionsBtn.click();
    await page.waitForTimeout(300);

    const menu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(menu).toBeVisible();
    await expectMenuInViewport(page, menu);

    // First menu item should have focus
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedRole).toBe('menuitem');
  });

  test('should open menu and focus first item when pressing Enter on button', async ({ page }) => {
    const actionsBtn = page.locator('button.story-actions-btn').first();
    await actionsBtn.focus();

    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const menu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(menu).toBeVisible();
    await expectMenuInViewport(page, menu);

    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedRole).toBe('menuitem');
  });

  test('should open menu and focus first item when pressing Space on button', async ({ page }) => {
    const actionsBtn = page.locator('button.story-actions-btn').first();
    await actionsBtn.focus();

    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const menu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(menu).toBeVisible();
    await expectMenuInViewport(page, menu);

    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedRole).toBe('menuitem');
  });

  test('should navigate menu items with ArrowDown and ArrowUp after opening', async ({ page }) => {
    const actionsBtn = page.locator('button.story-actions-btn').first();
    await actionsBtn.click();
    await page.waitForTimeout(300);

    // First item should be focused
    const firstItemText = await page.evaluate(() => document.activeElement?.textContent?.trim());

    // ArrowDown to second item
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    const secondItemText = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(secondItemText).not.toBe(firstItemText);

    // ArrowUp back to first item
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    const backToFirst = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(backToFirst).toBe(firstItemText);
  });

  test('should close menu with Escape and return focus to the story item', async ({ page }) => {
    const actionsBtn = page.locator('button.story-actions-btn').first();
    await actionsBtn.click();
    await page.waitForTimeout(300);

    const menu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(menu).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    await expect(menu).not.toBeVisible();

    const storyCard = page.locator('app-story-item').first().locator('article.story-card');
    await expect(storyCard).toBeFocused();
  });

  test('should open menu from the sidebar story summary', async ({
    page,
    sidebarPage,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only sidebar opening path');

    await page.evaluate(() => {
      window.localStorage.setItem(
        'user.settings.v1',
        JSON.stringify({ openCommentsInSidebar: true }),
      );
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const commentsLink = await findFirstCommentsLinkWithComments(page);
    await commentsLink.click();
    await page.waitForTimeout(500);

    await expect(sidebarPage.storySummary).toBeVisible();
    const actionsBtn = sidebarPage.storySummary.locator('button.story-actions-btn');
    await actionsBtn.click();

    const menu = sidebarPage.storySummary.locator('[data-testid="story-actions-menu"]');
    await expect(menu).toBeVisible();
    await expectMenuInViewport(page, menu);
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedRole).toBe('menuitem');
  });

  test('should open menu from the item page story summary', async ({ page }) => {
    const commentsLink = await findFirstCommentsLinkWithComments(page);
    const href = await commentsLink.getAttribute('href');
    test.skip(!href, 'No comments page link available');

    await page.goto(href!);
    await page.waitForLoadState('networkidle');

    const summary = page.locator('app-sidebar-story-summary').first();
    await expect(summary).toBeVisible();
    const actionsBtn = summary.locator('button.story-actions-btn');
    await actionsBtn.click();

    const menu = summary.locator('[data-testid="story-actions-menu"]');
    await expect(menu).toBeVisible();
    await expectMenuInViewport(page, menu);
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedRole).toBe('menuitem');
  });
});
