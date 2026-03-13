import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class UserscriptPage extends BasePage {
  readonly heading: Locator;
  readonly installationHeading: Locator;
  readonly instructionsList: Locator;
  readonly codeBlock: Locator;
  readonly installButton: Locator;
  readonly copyButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'HNews Redirect Userscript' });
    this.installationHeading = page.getByRole('heading', { name: 'Installation' });
    this.instructionsList = page.locator('.instructions-list');
    this.codeBlock = page.locator('.code-block');
    this.installButton = page.locator('button[aria-label="Install userscript"]');
    this.copyButton = page.locator('button[aria-label="Copy userscript to clipboard"]');
  }

  async navigateToUserscript() {
    await this.navigate('/userscript');
    await this.waitForNetworkIdle();
  }
}
