import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SettingsPage extends BasePage {
  readonly themeToggle: Locator;
  readonly systemThemeOption: Locator;
  readonly lightThemeOption: Locator;
  readonly darkThemeOption: Locator;
  readonly itemsPerPageInput: Locator;
  readonly autoRefreshToggle: Locator;
  readonly clearCacheButton: Locator;
  readonly saveButton: Locator;
  readonly resetButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.themeToggle = page.locator('button[aria-label*="theme"], .theme-toggle');
    this.systemThemeOption = page.locator('input[value="system"], button:has-text("System")');
    this.lightThemeOption = page.locator('input[value="light"], button:has-text("Light")');
    this.darkThemeOption = page.locator('input[value="dark"], button:has-text("Dark")');
    this.itemsPerPageInput = page.locator('input[name="itemsPerPage"], input[type="number"]');
    this.autoRefreshToggle = page.locator(
      'input[name="autoRefresh"], [aria-label*="Auto refresh"]',
    );
    this.clearCacheButton = page.locator('button:has-text("Clear Cache")');
    this.saveButton = page.locator('button:has-text("Save")');
    this.resetButton = page.locator('button:has-text("Reset")');
    this.successMessage = page.locator('.success, [role="alert"]:has-text("success")');
  }

  async navigateToSettings() {
    await this.navigate('/settings');
    await this.waitForNetworkIdle();
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }

  async selectSystemTheme() {
    await this.systemThemeOption.click();
    await this.page.waitForTimeout(500);
  }

  async selectLightTheme() {
    await this.lightThemeOption.click();
    await this.page.waitForTimeout(500);
  }

  async selectDarkTheme() {
    await this.darkThemeOption.click();
    await this.page.waitForTimeout(500);
  }

  async getCurrentTheme(): Promise<string> {
    const html = this.page.locator('html');
    const classList = await html.getAttribute('class');
    if (classList?.includes('dark')) return 'dark';
    if (classList?.includes('light')) return 'light';
    return 'system';
  }

  async setItemsPerPage(value: number) {
    await this.itemsPerPageInput.fill(value.toString());
  }

  async toggleAutoRefresh() {
    await this.autoRefreshToggle.click();
  }

  async clearCache() {
    await this.clearCacheButton.click();
    await this.page.waitForTimeout(1000);
  }

  async saveSettings() {
    if (await this.saveButton.isVisible()) {
      await this.saveButton.click();
      await this.waitForNetworkIdle();
    }
  }

  async resetSettings() {
    if (await this.resetButton.isVisible()) {
      await this.resetButton.click();
      await this.waitForNetworkIdle();
    }
  }

  async hasSuccessMessage(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }
}
