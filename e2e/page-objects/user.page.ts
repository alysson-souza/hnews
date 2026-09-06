import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class UserPage extends BasePage {
  readonly usernameHeading: Locator;
  readonly profileCard: Locator;
  readonly activityCard: Locator;
  readonly activityItems: Locator;
  readonly activityFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.profileCard = page.locator('#user-profile');
    this.activityCard = page.locator('.activity-card');
    this.usernameHeading = page.locator('h1.page-title');
    this.activityItems = this.activityCard.locator('article.activity-item');
    this.activityFilter = this.activityCard.getByRole('tablist');
  }

  async navigateToUser(username: string) {
    await this.navigate(`/user/${username}`);
  }

  async waitForProfileLoaded() {
    await this.profileCard.waitFor({ state: 'visible' });
  }

  async statValue(label: string): Promise<string> {
    return (
      (await this.profileCard
        .locator('.stat-box')
        .filter({ hasText: label })
        .locator('.stat-value')
        .textContent()) ?? ''
    );
  }

  async hasAboutSection(): Promise<boolean> {
    return this.profileCard.getByText('About', { exact: true }).isVisible();
  }

  async switchActivityFilter(label: 'All' | 'Stories' | 'Comments') {
    await this.activityFilter.getByRole('tab', { name: label }).click();
  }

  async loadedActivityCount(): Promise<number> {
    const muted = this.activityCard.locator('.activity-header .muted').first();
    const text = await muted.textContent().catch(() => '');
    const match = (text ?? '').match(/Loaded\s+([\d,]+)/);
    return match ? Number(match[1].replace(/,/g, '')) : -1;
  }

  async activityFilterLabel(): Promise<string> {
    const muted = this.activityCard.locator('.activity-header .muted').first();
    return (await muted.textContent().catch(() => '')) ?? '';
  }

  /**
   * Clicks the in-app link on an activity entry. A story entry's title link
   * can point off-site (external `url`, opened in a new tab), so this always
   * targets the entry's `/item/:id` link (e.g. the comments count or "View
   * thread" link), which every activity entry has regardless of type.
   */
  async clickItem(index: number) {
    await this.activityItems.nth(index).locator('a[href^="/item/"]').first().click();
  }
}
