import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class UserPage extends BasePage {
  readonly username: Locator;
  readonly karma: Locator;
  readonly about: Locator;
  readonly created: Locator;
  readonly submittedTab: Locator;
  readonly commentsTab: Locator;
  readonly favoritesTab: Locator;
  readonly itemList: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.locator('h1').first();
    this.karma = page.locator('[class*="karma"], dd').first();
    this.about = page.locator('.about-prose, [class*="about-prose"]').first();
    this.created = page.locator('[class*="created"], dd').nth(1);
    this.submittedTab = page.locator(
      'button:has-text("Submitted"), [role="tab"]:has-text("Submitted")',
    );
    this.commentsTab = page.locator(
      'button:has-text("Comments"), [role="tab"]:has-text("Comments")',
    );
    this.favoritesTab = page.locator(
      'button:has-text("Favorites"), [role="tab"]:has-text("Favorites")',
    );
    this.itemList = page.locator('app-story-item, app-comment-thread');
  }

  async navigateToUser(username: string) {
    await this.navigate(`/user/${username}`);
    await this.waitForNetworkIdle();
  }

  async getUsername(): Promise<string> {
    return (await this.username.textContent()) ?? '';
  }

  async getKarma(): Promise<string> {
    return (await this.karma.textContent()) ?? '';
  }

  async hasAboutSection(): Promise<boolean> {
    return await this.about.isVisible();
  }

  async getCreatedDate(): Promise<string> {
    return (await this.created.textContent()) ?? '';
  }

  async switchToSubmittedTab() {
    await this.submittedTab.click();
    await this.waitForNetworkIdle();
  }

  async switchToCommentsTab() {
    await this.commentsTab.click();
    await this.waitForNetworkIdle();
  }

  async switchToFavoritesTab() {
    if (await this.favoritesTab.isVisible()) {
      await this.favoritesTab.click();
      await this.waitForNetworkIdle();
    }
  }

  async getItemCount(): Promise<number> {
    return await this.itemList.count();
  }

  async clickItem(index: number) {
    await this.itemList.nth(index).click();
  }
}
