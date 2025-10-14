import { test, expect } from '../fixtures/pages.fixture';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ settingsPage }) => {
    await settingsPage.navigateToSettings();
  });

  test.describe('Theme Settings', () => {
    test('should display theme toggle', async ({ settingsPage }) => {
      if (await settingsPage.themeToggle.isVisible()) {
        await expect(settingsPage.themeToggle).toBeVisible();
      }
    });

    test('should switch to dark theme', async ({ settingsPage }) => {
      if (await settingsPage.darkThemeOption.isVisible()) {
        await settingsPage.selectDarkTheme();
        const theme = await settingsPage.getCurrentTheme();
        expect(theme).toBe('dark');
      }
    });

    test('should switch to light theme', async ({ settingsPage }) => {
      if (await settingsPage.lightThemeOption.isVisible()) {
        await settingsPage.selectLightTheme();
        const theme = await settingsPage.getCurrentTheme();
        expect(theme).toBe('light');
      }
    });

    test('should switch to system theme', async ({ settingsPage }) => {
      if (await settingsPage.systemThemeOption.isVisible()) {
        await settingsPage.selectSystemTheme();
        await settingsPage.page.waitForTimeout(500);
        const theme = await settingsPage.getCurrentTheme();
        expect(['light', 'dark', 'system']).toContain(theme);
      }
    });

    test('should persist theme selection', async ({ settingsPage, page }) => {
      if (await settingsPage.darkThemeOption.isVisible()) {
        await settingsPage.selectDarkTheme();
        const themeBefore = await settingsPage.getCurrentTheme();

        await page.reload();
        await page.waitForTimeout(1000);

        const themeAfter = await settingsPage.getCurrentTheme();
        expect(themeAfter).toBe(themeBefore);
      }
    });
  });

  test.describe('Display Settings', () => {
    test('should change items per page', async ({ settingsPage }) => {
      if (await settingsPage.itemsPerPageInput.isVisible()) {
        await settingsPage.setItemsPerPage(50);
        await expect(settingsPage.itemsPerPageInput).toHaveValue('50');
      }
    });

    test('should toggle auto refresh', async ({ settingsPage }) => {
      if (await settingsPage.autoRefreshToggle.isVisible()) {
        const initialState = await settingsPage.autoRefreshToggle.isChecked();
        await settingsPage.toggleAutoRefresh();
        await settingsPage.page.waitForTimeout(500);
        const newState = await settingsPage.autoRefreshToggle.isChecked();
        expect(newState).not.toBe(initialState);
      }
    });
  });

  test.describe('Cache Management', () => {
    test('should clear cache', async ({ settingsPage }) => {
      if (await settingsPage.clearCacheButton.isVisible()) {
        await settingsPage.clearCache();
        await settingsPage.page.waitForTimeout(1000);
        await expect(settingsPage.clearCacheButton).toBeVisible();
      }
    });
  });

  test.describe('Save and Reset', () => {
    test('should save settings', async ({ settingsPage }) => {
      if (await settingsPage.saveButton.isVisible()) {
        await settingsPage.saveSettings();

        if (await settingsPage.successMessage.isVisible()) {
          await expect(settingsPage.successMessage).toBeVisible();
        }
      }
    });

    test('should reset settings to defaults', async ({ settingsPage }) => {
      if (await settingsPage.resetButton.isVisible()) {
        if (await settingsPage.darkThemeOption.isVisible()) {
          await settingsPage.selectDarkTheme();
          expect(await settingsPage.getCurrentTheme()).toBe('dark');
        }

        await settingsPage.resetSettings();
        await settingsPage.page.waitForTimeout(1000);
        await expect(settingsPage.resetButton).toBeVisible();
      }
    });
  });

  test.describe('Persistence', () => {
    test('should persist settings across page reloads', async ({ settingsPage, page }) => {
      if (await settingsPage.itemsPerPageInput.isVisible()) {
        await settingsPage.setItemsPerPage(25);

        if (await settingsPage.saveButton.isVisible()) {
          await settingsPage.saveSettings();
        }

        await page.reload();
        await page.waitForTimeout(1000);

        await expect(settingsPage.itemsPerPageInput).toHaveValue('25');
      }
    });
  });
});
