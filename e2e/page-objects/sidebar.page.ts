import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SidebarPage extends BasePage {
  readonly panel: Locator;
  readonly overlay: Locator;
  readonly commentsPanel: Locator;
  readonly backButton: Locator;
  readonly sortDropdown: Locator;
  readonly commentThreads: Locator;
  readonly loadMoreButton: Locator;
  readonly viewThreadButtons: Locator;
  readonly storySummary: Locator;

  constructor(page: Page) {
    super(page);
    this.panel = page.locator('.sidebar-panel');
    this.overlay = page.locator('.sidebar-overlay');
    this.commentsPanel = page.locator('.sidebar-comments-panel');
    this.backButton = page.locator('button[aria-label="Go back to previous view"]');
    this.sortDropdown = page.locator('select[aria-label="Sort comments"]');
    this.commentThreads = page.locator('.sidebar-comments-panel app-comment-thread');
    this.loadMoreButton = page.locator('.sidebar-comments-panel .load-more-btn');
    this.viewThreadButtons = page.locator(
      '.sidebar-comments-panel button[title="View this thread"]',
    );
    this.storySummary = page.locator('app-sidebar-story-summary');
  }

  async isOpen(): Promise<boolean> {
    return await this.panel.evaluate((el) => !el.classList.contains('translate-x-full'));
  }

  async isClosed(): Promise<boolean> {
    return await this.panel.evaluate((el) => el.classList.contains('translate-x-full'));
  }
}
