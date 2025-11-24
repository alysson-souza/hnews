// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { BaseCommentNavigationService } from './base-comment-navigation.service';
import { SidebarService } from './sidebar.service';

interface SidebarState {
  itemId: number;
  selectedCommentId: number | null;
  scrollPosition: number;
}

@Injectable({
  providedIn: 'root',
})
export class SidebarKeyboardNavigationService extends BaseCommentNavigationService {
  private sidebarService = inject(SidebarService);
  private stateStack: SidebarState[] = [];

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
   * Save current state before navigating deeper
   */
  private saveCurrentState(): void {
    const currentItemId = this.sidebarService.currentItemId();
    if (currentItemId === null) return;

    const container = document.querySelector(this.containerSelector);
    this.stateStack.push({
      itemId: currentItemId,
      selectedCommentId: this.selectedCommentId(),
      scrollPosition: container?.scrollTop ?? 0,
    });
  }

  /**
   * Restore state after navigating back
   */
  private async restoreState(): Promise<void> {
    const state = this.stateStack.pop();
    if (!state) {
      this.clearSelection();
      return;
    }

    // Wait for animation and DOM update
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (state.selectedCommentId !== null) {
      this.selectedCommentId.set(state.selectedCommentId);
      await this.scrollSelectedIntoView();
    } else {
      this.clearSelection();
    }
  }

  /**
   * View thread of selected comment - save state first
   */
  override viewThreadSelected(): void {
    const selectedId = this.selectedCommentId();
    if (selectedId !== null) {
      this.saveCurrentState();
      this.sidebarService.openSidebarWithSlideAnimation(selectedId);
    }
  }

  /**
   * Go back in sidebar history and restore selection
   */
  goBack(): void {
    if (this.sidebarService.canGoBack()) {
      this.sidebarService.goBack();
      this.restoreState();
    }
  }

  /**
   * Close sidebar and clear state
   */
  closeSidebar(): void {
    this.sidebarService.closeSidebar();
    this.clearSelection();
    this.stateStack = [];
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
