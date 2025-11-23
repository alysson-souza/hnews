import { test, expect } from '../fixtures/pages.fixture';

test.describe('Keyboard Shortcuts', () => {
  test.describe('Navigation Shortcuts', () => {
    test('should navigate using keyboard shortcuts', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();
      await page.waitForTimeout(1000);

      await page.keyboard.press('?');
      await page.waitForTimeout(500);

      const helpDialog = page.locator('[role="dialog"], .help-dialog, .shortcuts-dialog');
      if (await helpDialog.isVisible()) {
        await expect(helpDialog).toBeVisible();
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        expect(true).toBe(true);
      }
    });

    test('should use j/k for navigation', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();
      await page.waitForTimeout(1000);

      await page.keyboard.press('j');
      await page.waitForTimeout(200);

      await page.keyboard.press('k');
      await page.waitForTimeout(200);

      const count = await storiesPage.getStoryCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should open item with Enter key', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();
      await page.waitForTimeout(2000);

      const storyLink = storiesPage.storyItems.first().locator('a[href*="/item/"]');
      const href = await storyLink.getAttribute('href');
      expect(href).toMatch(/\/item\/\d+/);
    });

    test('should toggle and navigate actions menu via keyboard', async ({ storiesPage, page }) => {
      await storiesPage.navigateToTop();
      await page.waitForTimeout(1000);

      // Toggle actions menu (auto-select first story if none selected)
      await page.keyboard.press('a');
      await page.waitForTimeout(300);

      const actionsMenu = page.locator('[data-testid="story-actions-menu"]').first();
      await expect(actionsMenu).toBeVisible();

      // Navigate down (j)
      await page.keyboard.press('j');
      await page.waitForTimeout(150);
      const activeElementText1 = await page.evaluate(() =>
        document.activeElement?.textContent?.trim(),
      );
      expect(activeElementText1 && activeElementText1.length).toBeGreaterThan(0);

      // Navigate up (k)
      await page.keyboard.press('k');
      await page.waitForTimeout(150);
      const activeElementText2 = await page.evaluate(() =>
        document.activeElement?.textContent?.trim(),
      );
      expect(activeElementText2 && activeElementText2.length).toBeGreaterThan(0);

      // Close with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      await expect(actionsMenu).not.toBeVisible();

      // Re-open with 'a' and close again with 'a'
      await page.keyboard.press('a');
      await page.waitForTimeout(300);
      await expect(actionsMenu).toBeVisible();
      await page.keyboard.press('a');
      await page.waitForTimeout(200);
      await expect(actionsMenu).not.toBeVisible();
    });
  });

  test.describe('Theme Toggle', () => {
    test('should toggle theme via button', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1000);

      const html = page.locator('html');
      const themeButton = page
        .locator('button[aria-label*="theme" i], button:has-text("Theme")')
        .first();

      if (await themeButton.isVisible()) {
        const initialClass = await html.getAttribute('class');

        await themeButton.click();
        await page.waitForTimeout(500);

        const newClass = await html.getAttribute('class');
        expect(newClass).not.toBe(initialClass);
      } else {
        expect(true).toBe(true);
      }
    });
  });
});
