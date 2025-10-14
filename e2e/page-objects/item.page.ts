import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ItemPage extends BasePage {
  readonly storyTitle: Locator;
  readonly storyUrl: Locator;
  readonly storyMeta: Locator;
  readonly storyText: Locator;
  readonly commentThreads: Locator;
  readonly commentText: Locator;
  readonly commentHeader: Locator;
  readonly loadMoreCommentsButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.storyTitle = page.locator('h1.story-title').first();
    this.storyUrl = page.locator('.story-url a');
    this.storyMeta = page.locator('.story-meta, .story-info, [class*="meta"]');
    this.storyText = page.locator('.story-text');
    this.commentThreads = page.locator('app-comment-thread');
    this.commentText = page.locator('app-comment-text');
    this.commentHeader = page.locator('app-comment-header');
    this.loadMoreCommentsButton = page.locator('button:has-text("Load More")');
    this.backButton = page.locator('button:has-text("Back")');
  }

  async navigateToItem(id: number) {
    await this.navigate(`/item/${id}`);
    await this.waitForNetworkIdle();
  }

  async getStoryTitle(): Promise<string> {
    return (await this.storyTitle.textContent()) ?? '';
  }

  async getStoryUrl(): Promise<string> {
    return (await this.storyUrl.getAttribute('href')) ?? '';
  }

  async hasStoryText(): Promise<boolean> {
    return await this.storyText.isVisible();
  }

  async getCommentCount(): Promise<number> {
    return await this.commentThreads.count();
  }

  async expandComment(index: number) {
    const commentHeader = this.commentThreads.nth(index).locator('app-comment-header');
    await commentHeader.click();
  }

  async collapseComment(index: number) {
    const commentHeader = this.commentThreads.nth(index).locator('app-comment-header');
    await commentHeader.click();
  }

  async getCommentAuthor(index: number): Promise<string> {
    const author = this.commentThreads.nth(index).locator('app-comment-header .author');
    return (await author.textContent()) ?? '';
  }

  async loadMoreComments() {
    if (await this.loadMoreCommentsButton.isVisible()) {
      await this.loadMoreCommentsButton.click();
      await this.waitForNetworkIdle();
    }
  }

  async goBack() {
    await this.backButton.click();
  }

  async clickCommentAuthor(index: number) {
    const authorLink = this.commentThreads.nth(index).locator('app-comment-header .author');
    await authorLink.click();
  }
}
