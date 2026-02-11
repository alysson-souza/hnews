// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { BaseCommentNavigationService } from './base-comment-navigation.service';
import { SidebarService } from './sidebar.service';
import { SidebarThreadNavigationService } from './sidebar-thread-navigation.service';

@Injectable({
  providedIn: 'root',
})
export class SidebarKeyboardNavigationService extends BaseCommentNavigationService {
  private sidebarService = inject(SidebarService);
  private sidebarThreadNavigation = inject(SidebarThreadNavigationService);

  constructor() {
    super();

    this.sidebarThreadNavigation.registerSelectionCallbacks({
      captureSelectedCommentId: () => this.selectedCommentId(),
      restoreSelectedCommentId: (commentId) => this.restoreSelectedComment(commentId),
      selectFirstVisibleComment: () => this.selectFirstVisibleComment({ scrollIntoView: false }),
    });
  }

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
      element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * View thread of selected comment - save state first
   */
  override viewThreadSelected(): void {
    const selectedId = this.selectedCommentId();
    if (selectedId !== null) {
      this.sidebarThreadNavigation.pushThread(selectedId, { selectFirstVisibleOnOpen: true });
    }
  }

  /**
   * Go back in sidebar history and restore selection
   */
  goBack(): void {
    if (this.sidebarService.canGoBack()) {
      void this.sidebarThreadNavigation.goBack();
    }
  }

  /**
   * Close sidebar and clear state
   */
  closeSidebar(): void {
    this.sidebarThreadNavigation.closeSidebar();
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

  private restoreSelectedComment(commentId: number | null): void {
    if (commentId === null) {
      this.clearSelection();
      return;
    }

    this.selectedCommentId.set(commentId);
    const element = this.findElementById(commentId);
    if (element && !this.isElementVisibleInSidebar(element)) {
      void this.scrollSelectedIntoView();
    }
  }

  private isElementVisibleInSidebar(element: HTMLElement): boolean {
    const container = document.querySelector(this.containerSelector) as HTMLElement | null;
    if (!container) {
      return true;
    }

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    return elementRect.bottom > containerRect.top && elementRect.top < containerRect.bottom;
  }
}
