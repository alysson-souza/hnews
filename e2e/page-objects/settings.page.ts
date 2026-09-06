import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SettingsPage extends BasePage {
  readonly themeGroup: Locator;
  readonly xCancelRedirectToggle: Locator;
  readonly twitterViewerRedirectToggle: Locator;
  readonly cacheSection: Locator;
  readonly clearAllCacheButton: Locator;
  readonly refreshCacheStatsButton: Locator;
  readonly cachedItemsValue: Locator;

  constructor(page: Page) {
    super(page);
    this.themeGroup = page.getByRole('radiogroup', { name: 'Theme selection' });
    this.xCancelRedirectToggle = page.getByRole('switch', {
      name: 'Redirect Twitter/X links to XCancel',
    });
    this.twitterViewerRedirectToggle = page.getByRole('switch', {
      name: 'Redirect Twitter/X links to Twitter Viewer',
    });
    this.cacheSection = page.locator('[aria-label="Cache Management"]');
    this.clearAllCacheButton = page.getByRole('button', { name: 'Clear all cached data' });
    this.refreshCacheStatsButton = page.getByRole('button', { name: 'Refresh cache statistics' });
    this.cachedItemsValue = this.cacheSection
      .locator('.stat-row')
      .filter({ hasText: 'Cached Items' })
      .locator('.stat-row-value');
  }

  async navigateToSettings() {
    await this.navigate('/settings');
    await this.waitForNetworkIdle();
  }

  async selectTheme(theme: 'Auto' | 'Light' | 'Dark') {
    await this.themeGroup.locator('label.theme-segment').filter({ hasText: theme }).click();
    await expectThemeSelected(this.themeGroup, theme);
  }

  async selectedTheme(): Promise<string> {
    return (
      (await this.themeGroup.locator('.theme-segment.selected .segment-label').textContent()) ?? ''
    );
  }

  async storedTheme(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('hnews-theme'));
  }

  async htmlHasDarkClass(): Promise<boolean> {
    const classNames = (await this.page.locator('html').getAttribute('class')) ?? '';
    return classNames.split(/\s+/).includes('dark');
  }

  async getCachedItemsCount(): Promise<number> {
    return Number((await this.cachedItemsValue.textContent())?.trim() ?? NaN);
  }

  async cacheMessageText(): Promise<string> {
    return (
      (await this.cacheSection
        .locator('.alert-danger, .alert-success')
        .first()
        .textContent()
        .catch(() => '')) ?? ''
    );
  }
}

async function expectThemeSelected(themeGroup: Locator, theme: string) {
  await themeGroup
    .locator('.theme-segment.selected')
    .filter({ hasText: theme })
    .waitFor({ state: 'visible' });
}
