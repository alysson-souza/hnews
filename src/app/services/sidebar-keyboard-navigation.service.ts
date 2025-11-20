// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { BaseCommentNavigationService } from './base-comment-navigation.service';
import { SidebarService } from './sidebar.service';

@Injectable({
  providedIn: 'root',
})
export class SidebarKeyboardNavigationService extends BaseCommentNavigationService {
  private sidebarService = inject(SidebarService);

  protected get containerSelector(): string {
    return '.sidebar-comments-panel';
  }

  protected registerCommands(): void {
    this.commandRegistry.register('sidebar.nextComment', () => this.selectNext());
    this.commandRegistry.register('sidebar.previousComment', () => this.selectPrevious());
    this.commandRegistry.register('sidebar.toggleExpand', () => this.toggleExpandSelected());
    this.commandRegistry.register('sidebar.upvote', () => this.upvoteSelected());
    this.commandRegistry.register('sidebar.expandReplies', () => this.expandRepliesSelected());
    this.commandRegistry.register('sidebar.viewThread', () => this.viewThreadSelected());
    this.commandRegistry.register('sidebar.back', () => this.goBack());
    this.commandRegistry.register('sidebar.close', () => this.closeSidebar());
    this.commandRegistry.register('sidebar.backOrClose', () => this.handleBackOrClose());
  }

  /**
   * Scroll selected comment into view
   * Overridden to use native scrollIntoView since sidebar has its own scroll container
   */
  protected override async scrollSelectedIntoView(): Promise<void> {
    const selectedId = this.selectedCommentId();
    if (selectedId === null) return;

    const element = this.findElementById(selectedId);
    if (element) {
      // For sidebar, we can use native scrollIntoView because the header is not fixed *over* the content
      // The content area itself scrolls, and the header is a sibling
      element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Go back in sidebar history
   */
  goBack(): void {
    if (this.sidebarService.canGoBack()) {
      this.sidebarService.goBack();
      // Clear comment selection when navigating back
      setTimeout(() => {
        this.clearSelection();
      }, 200);
    }
  }

  /**
   * Close sidebar
   */
  closeSidebar(): void {
    this.sidebarService.closeSidebar();
    this.clearSelection();
  }

  /**
   * Go back or close sidebar
   */
  handleBackOrClose(): void {
    if (this.sidebarService.canGoBack()) {
      this.goBack();
    } else {
      this.closeSidebar();
    }
  }
}
