import { test, expect } from '../fixtures/pages.fixture';

test.describe('Keyboard Shortcuts', () => {
  test.describe('Navigation Shortcuts', () => {
    test('opens the shortcuts dialog with ? and closes it with Escape', async ({
      storiesPage,
      page,
    }) => {
      await storiesPage.navigateToTop();
      await expect(storiesPage.storyItems.first()).toBeVisible();

      await page.keyboard.press('?');

      const helpDialog = page.locator('[role="dialog"]');
      await expect(helpDialog).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(helpDialog).not.toBeVisible();
    });

    test('selects stories with j and moves back with k', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();
      await expect(storiesPage.storyItems.first()).toBeVisible();

      const selectedStory = page.locator('.story-card-selected');
      const selectedHref = () =>
        selectedStory.locator('a[href*="/item/"]').first().getAttribute('href');

      await page.keyboard.press('j');
      await expect(selectedStory).toHaveCount(1);
      const firstHref = await selectedHref();
      expect(firstHref).toMatch(/\/item\/\d+/);

      // j moves the selection to the next story
      await page.keyboard.press('j');
      await expect.poll(async () => selectedHref(), { timeout: 5_000 }).not.toBe(firstHref);
      const secondHref = await selectedHref();
      expect(secondHref).not.toBe(firstHref);

      // k moves the selection back to the previous story
      await page.keyboard.press('k');
      await expect.poll(async () => selectedHref(), { timeout: 5_000 }).toBe(firstHref);
    });

    test('opens comments for the selected story with c', async ({
      storiesPage,
      sidebarPage,
      page,
    }) => {
      await storiesPage.navigateToTop();
      await expect(storiesPage.storyItems.first()).toBeVisible();

      await page.keyboard.press('j');
      await expect(page.locator('.story-card-selected')).toHaveCount(1);

      await page.keyboard.press('c');
      await expect.poll(() => sidebarPage.isOpen(), { timeout: 5_000 }).toBe(true);

      await page.keyboard.press('Escape');
      await expect.poll(() => sidebarPage.isOpen()).toBe(false);
    });

    test('toggles and navigates the actions menu via keyboard', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();
      await expect(storiesPage.storyItems.first()).toBeVisible();

      // Toggle actions menu (auto-selects the first story if none selected)
      await page.keyboard.press('a');

      const actionsMenu = page.locator('[data-testid="story-actions-menu"]').first();
      await expect(actionsMenu).toBeVisible();

      // Opening the menu focuses its first item asynchronously (a setTimeout(0)
      // after the menu renders). j/k are handled by a (keydown) listener on the
      // menu element itself, so they only take effect once focus has actually
      // landed inside it — wait for that before sending them, otherwise the key
      // can arrive while focus is still on the toggle button and be swallowed
      // (or misrouted to the global j/k story-navigation shortcut instead).
      await expect
        .poll(() => page.evaluate(() => document.activeElement?.getAttribute('role')))
        .toBe('menuitem');

      // j/k move focus between menu entries
      await page.keyboard.press('j');
      let focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
      expect(focusedRole).toBe('menuitem');

      await page.keyboard.press('k');
      focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
      expect(focusedRole).toBe('menuitem');

      // Close with Escape, re-open with a, close again with a
      await page.keyboard.press('Escape');
      await expect(actionsMenu).not.toBeVisible();

      await page.keyboard.press('a');
      await expect(actionsMenu).toBeVisible();

      await page.keyboard.press('a');
      await expect(actionsMenu).not.toBeVisible();
    });
  });

  test.describe('Theme Toggle', () => {
    test('toggles the theme from the header button', async ({ page }) => {
      await page.goto('/');
      const themeButton = page.locator('.theme-toggle');
      await expect(themeButton).toBeVisible();

      const storedTheme = () => page.evaluate(() => localStorage.getItem('hnews-theme'));
      const initial = await storedTheme();

      await themeButton.click();

      await expect.poll(storedTheme).not.toBe(initial);
    });
  });
});
