import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class StoriesPage extends BasePage {
  readonly storyItems: Locator;
  readonly loadMoreButton: Locator;
  readonly refreshButton: Locator;
  readonly newStoriesBadge: Locator;
  readonly navigationLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.storyItems = page.locator('app-story-item');
    this.loadMoreButton = page.locator('button:has-text("Load More")');
    this.refreshButton = page.locator('button[aria-label*="Refresh"]');
    this.newStoriesBadge = page.locator('.new-stories-badge');
    this.navigationLinks = page.locator('nav a');
  }

  async navigateToTop() {
    await this.navigate('/top');
    await this.waitForNetworkIdle();
  }

  async navigateToNew() {
    await this.navigate('/newest');
    await this.waitForNetworkIdle();
  }

  async navigateToBest() {
    await this.navigate('/best');
    await this.waitForNetworkIdle();
  }

  async navigateToAsk() {
    await this.navigate('/ask');
    await this.waitForNetworkIdle();
  }

  async navigateToShow() {
    await this.navigate('/show');
    await this.waitForNetworkIdle();
  }

  async navigateToJobs() {
    await this.navigate('/jobs');
    await this.waitForNetworkIdle();
  }

  async getStoryCount(): Promise<number> {
    await this.storyItems.first().waitFor({ timeout: 10000 });
    return await this.storyItems.count();
  }

  async clickStoryByIndex(index: number) {
    const storyLink = this.storyItems.nth(index).locator('a[href*="/item/"]').first();
    await storyLink.click();
  }

  async getStoryTitle(index: number): Promise<string> {
    const titleElement = this.storyItems.nth(index).locator('.story-title');
    return (await titleElement.textContent()) ?? '';
  }

  async loadMoreStories() {
    await this.loadMoreButton.click();
    await this.waitForNetworkIdle();
  }

  async refreshStories() {
    await this.refreshButton.click();
    await this.waitForNetworkIdle();
  }

  async hasNewStoriesBadge(): Promise<boolean> {
    return await this.newStoriesBadge.isVisible();
  }

  async clickNavigationLink(text: string) {
    await this.navigationLinks.filter({ hasText: text }).click();
    await this.waitForNetworkIdle();
  }

  async upvoteStory(index: number) {
    const upvoteButton = this.storyItems.nth(index).locator('app-upvote-button');
    await upvoteButton.click();
  }

  async shiftClickCommentsLink(index: number): Promise<Page> {
    const storyItem = this.storyItems.nth(index);
    const commentsLink = storyItem.locator('.story-comments');

    // Wait for the comments link to be visible
    await commentsLink.waitFor({ timeout: 10000 });

    // Get the href attribute before clicking
    const href = await commentsLink.getAttribute('href');
    if (!href || href === '#') {
      throw new Error(`Invalid comments link href: ${href}`);
    }

    // Open new page via shift+click
    const pagePromise = this.page.context().waitForEvent('page');
    await commentsLink.click({ modifiers: ['Shift'] });
    const newPage = await pagePromise;
    await newPage.waitForLoadState('networkidle');

    return newPage;
  }

  async getCommentsLinkText(index: number): Promise<string> {
    const storyItem = this.storyItems.nth(index);
    const commentsLink = storyItem.locator('.story-comments');
    return (await commentsLink.textContent()) ?? '';
  }
}
