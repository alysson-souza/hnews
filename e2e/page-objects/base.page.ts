import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(public readonly page: Page) {}

  async navigate(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {});
  }

  async waitForElement(selector: string) {
    await this.page.waitForSelector(selector);
  }

  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async getText(selector: string): Promise<string> {
    return (await this.page.textContent(selector)) ?? '';
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }

  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }

  async waitForURL(pattern: string | RegExp) {
    await this.page.waitForURL(pattern);
  }
}
