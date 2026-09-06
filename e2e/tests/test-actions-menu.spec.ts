import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures/pages.fixture';

test.describe('Story Actions Menu - Keyboard Interaction', () => {
  test.beforeEach(async ({ storiesPage }) => {
    await storiesPage.navigateToTop();
  });

  async function findFirstCommentsLinkWithComments(page: Page): Promise<Locator> {
    const commentLinks = page.locator('app-story-item .story-comments');

    // The fixture story list always has a story with comments, but the story
    // cards (and their comment counts) can still be mid-render right after a
    // navigation/reload, so poll rather than reading the DOM once.
    await expect
      .poll(
        async () => {
          const linkCount = await commentLinks.count();
          for (let index = 0; index < linkCount; index++) {
            const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
            const countMatch = text.match(/\d+/);
            const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
            if (commentCount > 0) {
              return true;
            }
          }
          return false;
        },
        { timeout: 10_000 },
      )
      .toBe(true);

    const linkCount = await commentLinks.count();
    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        return commentLinks.nth(index);
      }
    }

    throw new Error('Fixture data guarantees a story with comments in the top feed');
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

  async function openActionsMenu(
    page: Page,
    opener: 'click' | 'Enter' | 'Space',
  ): Promise<Locator> {
    const actionsBtn = page.locator('button.story-actions-btn').first();

    if (opener === 'click') {
      await actionsBtn.click();
    } else {
      await actionsBtn.focus();
      await page.keyboard.press(opener);
    }

    const menu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(menu).toBeVisible();
    await expectMenuInViewport(page, menu);

    // First menu item should have focus
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedRole).toBe('menuitem');

    return menu;
  }

  for (const opener of ['click', 'Enter', 'Space'] as const) {
    test(`opens the menu and focuses the first item via ${opener}`, async ({ page }) => {
      await openActionsMenu(page, opener);
    });
  }

  test('navigates menu items with ArrowDown and ArrowUp after opening', async ({ page }) => {
    await openActionsMenu(page, 'click');

    const focusedText = () => page.evaluate(() => document.activeElement?.textContent?.trim());
    const firstItemText = await focusedText();

    // ArrowDown to second item
    await page.keyboard.press('ArrowDown');
    await expect.poll(focusedText).not.toBe(firstItemText);
    const secondItemText = await focusedText();

    // ArrowUp back to first item
    await page.keyboard.press('ArrowUp');
    await expect.poll(focusedText).toBe(firstItemText);
    expect(secondItemText).not.toBe(firstItemText);
  });

  test('closes the menu with Escape and returns focus to the story item', async ({ page }) => {
    const menu = await openActionsMenu(page, 'click');

    await page.keyboard.press('Escape');

    await expect(menu).not.toBeVisible();

    const storyCard = page.locator('app-story-item').first().locator('article.story-card');
    await expect(storyCard).toBeFocused();
  });

  test('places the story actions button in the mobile vote header', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only story card layout');

    const firstStory = page.locator('app-story-item').first();
    const actionsBtn = firstStory.locator('.vote-section button.story-actions-btn');
    await expect(actionsBtn).toBeVisible();
    await expect(firstStory.locator('.story-header button.story-actions-btn')).toHaveCount(0);

    await actionsBtn.click();

    const menu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(menu).toBeVisible();
    await expectMenuInViewport(page, menu);
  });

  test('opens the menu from the sidebar story summary', async ({ page, sidebarPage }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only sidebar opening path');

    await page.evaluate(() => {
      window.localStorage.setItem(
        'user.settings.v1',
        JSON.stringify({ openCommentsInSidebar: true }),
      );
    });
    await page.reload();
    await page.locator('app-story-item').first().waitFor({ timeout: 15_000 });

    const commentsLink = await findFirstCommentsLinkWithComments(page);
    await commentsLink.click();

    await expect(sidebarPage.storySummary).toBeVisible({ timeout: 10_000 });
    const actionsBtn = sidebarPage.storySummary.locator('button.story-actions-btn');
    await actionsBtn.click();

    const menu = sidebarPage.storySummary.locator('[data-testid="story-actions-menu"]');
    await expect(menu).toBeVisible();
    await expectMenuInViewport(page, menu);
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedRole).toBe('menuitem');
  });

  test('opens the menu from the item page story summary', async ({ page }) => {
    const commentsLink = await findFirstCommentsLinkWithComments(page);
    const href = await commentsLink.getAttribute('href');
    if (!href) {
      throw new Error('Fixture story guarantees a comments link with an href');
    }

    await page.goto(href);
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
