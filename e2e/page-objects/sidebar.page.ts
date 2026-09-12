import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SidebarPage extends BasePage {
  readonly panel: Locator;
  readonly overlay: Locator;
  readonly commentsPanel: Locator;
  readonly backButton: Locator;
  readonly sortDropdown: Locator;
  readonly commentThreads: Locator;
  /**
   * Only the top-level threads. `commentThreads` matches nested replies too, and
   * those mount and unmount as the tree renders progressively, so its count is a
   * moving target; the top-level list is what a restored view must match.
   */
  readonly topLevelCommentThreads: Locator;
  readonly loadMoreButton: Locator;
  readonly viewThreadButtons: Locator;
  readonly storySummary: Locator;

  constructor(page: Page) {
    super(page);
    this.panel = page.locator('.sidebar-panel');
    this.overlay = page.locator('.sidebar-overlay');
    this.commentsPanel = page.locator(
      'app-discussion-view[data-active="true"] .sidebar-comments-panel',
    );
    this.backButton = page.locator(
      'app-discussion-view[data-active="true"] button[aria-label="Go back to previous view"]',
    );
    this.sortDropdown = page.locator(
      'app-discussion-view[data-active="true"] select[aria-label="Sort comments"]',
    );
    this.commentThreads = page.locator(
      'app-discussion-view[data-active="true"] .sidebar-comments-panel app-comment-thread',
    );
    this.topLevelCommentThreads = page.locator(
      'app-discussion-view[data-active="true"] .sidebar-comments-panel .comments-list > app-comment-thread',
    );
    this.loadMoreButton = page.locator(
      'app-discussion-view[data-active="true"] .sidebar-comments-panel .load-more-btn',
    );
    this.viewThreadButtons = page.locator(
      'app-discussion-view[data-active="true"] .sidebar-comments-panel button[title="View this thread"]',
    );
    this.storySummary = page.locator(
      'app-discussion-view[data-active="true"] app-sidebar-story-summary',
    );
  }

  async isOpen(): Promise<boolean> {
    return await this.panel.evaluate((el) => el.classList.contains('open'));
  }

  async isClosed(): Promise<boolean> {
    return await this.panel.evaluate((el) => !el.classList.contains('open'));
  }
}
