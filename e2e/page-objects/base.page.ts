import { Page } from '@playwright/test';

export class BasePage {
  constructor(public readonly page: Page) {}

  async navigate(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {});
  }
}
