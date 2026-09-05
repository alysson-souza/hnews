import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ItemPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToItem(id: number) {
    await this.navigate(`/item/${id}`);
    await this.waitForNetworkIdle();
  }
}
