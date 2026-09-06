import { test, expect } from '../fixtures/pages.fixture';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ settingsPage }) => {
    await settingsPage.navigateToSettings();
  });

  test.describe('Appearance', () => {
    test('switches to the dark theme', async ({ settingsPage }) => {
      await settingsPage.selectTheme('Dark');

      await expect(settingsPage.storedTheme()).resolves.toBe('dark');
      expect(await settingsPage.htmlHasDarkClass()).toBe(true);
    });

    test('switches to the light theme', async ({ settingsPage }) => {
      await settingsPage.selectTheme('Light');

      await expect(settingsPage.storedTheme()).resolves.toBe('light');
      expect(await settingsPage.htmlHasDarkClass()).toBe(false);
    });

    test('switches to the auto theme', async ({ settingsPage }) => {
      await settingsPage.selectTheme('Auto');

      // Auto mode removes the stored override and follows the OS preference
      await expect(settingsPage.storedTheme()).resolves.toBeNull();
      await expect(settingsPage.selectedTheme()).resolves.toBe('Auto');
    });

    test('persists the theme selection across a reload', async ({ settingsPage }) => {
      await settingsPage.selectTheme('Dark');

      await settingsPage.page.reload();
      await settingsPage.themeGroup.waitFor({ state: 'visible' });

      await expect(settingsPage.storedTheme()).resolves.toBe('dark');
      await expect(settingsPage.selectedTheme()).resolves.toBe('Dark');
      expect(await settingsPage.htmlHasDarkClass()).toBe(true);
    });
  });

  test.describe('Privacy Redirects', () => {
    test('should select exactly one redirect frontend with the keyboard', async ({
      settingsPage,
      page,
    }) => {
      await expect(settingsPage.xCancelRedirectToggle).toHaveAttribute('aria-checked', 'true');
      await expect(settingsPage.twitterViewerRedirectToggle).toHaveAttribute(
        'aria-checked',
        'false',
      );

      await settingsPage.twitterViewerRedirectToggle.focus();
      await settingsPage.twitterViewerRedirectToggle.press('Space');

      await expect(settingsPage.xCancelRedirectToggle).toHaveAttribute('aria-checked', 'false');
      await expect(settingsPage.twitterViewerRedirectToggle).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await expect
        .poll(() => page.evaluate(() => localStorage.getItem('privacy.redirect.settings.v1')))
        .toBe(JSON.stringify({ enabled: true, frontend: 'twitter-viewer' }));
    });
  });

  test.describe('Cache Management', () => {
    test('clears all cached data and reports success', async ({ settingsPage }) => {
      settingsPage.page.once('dialog', (dialog) => dialog.accept());
      await settingsPage.clearAllCacheButton.click();

      await expect
        .poll(() => settingsPage.cacheMessageText())
        .toContain('All cache cleared successfully');
    });

    test('shows the cached-items statistic after a refresh', async ({
      settingsPage,
      storiesPage,
    }) => {
      // Seed IndexedDB with cached data by loading the story list, then clear it so
      // the refresh below starts from a known-zero baseline.
      await storiesPage.navigateToTop();
      await settingsPage.navigateToSettings();
      settingsPage.page.once('dialog', (dialog) => dialog.accept());
      await settingsPage.clearAllCacheButton.click();
      await expect
        .poll(() => settingsPage.cacheMessageText())
        .toContain('All cache cleared successfully');
      await settingsPage.refreshCacheStatsButton.click();
      await expect.poll(() => settingsPage.getCachedItemsCount()).toBe(0);

      // Re-populate the cache and confirm the refreshed statistic reflects it.
      await storiesPage.navigateToTop();
      await settingsPage.navigateToSettings();
      await settingsPage.refreshCacheStatsButton.click();

      await expect.poll(() => settingsPage.getCachedItemsCount()).toBeGreaterThan(0);
    });
  });

  test.describe('Layout', () => {
    test('should keep footer at the bottom of the viewport on short pages', async ({
      settingsPage,
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop-only sticky footer regression check');

      await page.setViewportSize({ width: 1440, height: 2200 });
      await settingsPage.navigateToSettings();

      const footer = page.getByRole('contentinfo');
      await expect(footer).toBeVisible();

      const footerBox = await footer.boundingBox();
      const viewport = page.viewportSize();

      expect(footerBox).not.toBeNull();
      expect(viewport).not.toBeNull();

      const footerBottom = (footerBox?.y ?? 0) + (footerBox?.height ?? 0);
      expect(Math.abs(footerBottom - (viewport?.height ?? 0))).toBeLessThanOrEqual(8);
    });
  });
});
