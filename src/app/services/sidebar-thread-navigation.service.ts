// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { SidebarService } from './sidebar.service';

interface SidebarThreadState {
  itemId: number;
  selectedCommentId: number | null;
  scrollPosition: number;
}

interface SidebarThreadSelectionCallbacks {
  captureSelectedCommentId: () => number | null;
  restoreSelectedCommentId: (commentId: number | null) => void;
  selectFirstVisibleComment: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class SidebarThreadNavigationService {
  private sidebarService = inject(SidebarService);
  private stateStack: SidebarThreadState[] = [];
  private pendingSelectFirstVisible = false;

  private callbacks: SidebarThreadSelectionCallbacks = {
    captureSelectedCommentId: () => null,
    restoreSelectedCommentId: () => {},
    selectFirstVisibleComment: () => {},
  };

  registerSelectionCallbacks(callbacks: SidebarThreadSelectionCallbacks): void {
    this.callbacks = callbacks;
  }

  pushThread(nextItemId: number, options?: { selectFirstVisibleOnOpen?: boolean }): void {
    const currentItemId = this.sidebarService.currentItemId();
    const currentScrollTop = this.getSidebarContainer()?.scrollTop ?? 0;

    if (currentItemId !== null) {
      this.stateStack.push({
        itemId: currentItemId,
        selectedCommentId: this.callbacks.captureSelectedCommentId(),
        scrollPosition: currentScrollTop,
      });
    }

    if (options?.selectFirstVisibleOnOpen) {
      this.pendingSelectFirstVisible = true;
    }

    this.callbacks.restoreSelectedCommentId(null);
    this.sidebarService.openSidebarWithSlideAnimation(nextItemId);
  }

  async goBack(): Promise<void> {
    if (!this.sidebarService.canGoBack()) {
      return;
    }

    const previousState = this.stateStack.pop() ?? null;
    this.sidebarService.goBack();

    if (!previousState) {
      this.callbacks.restoreSelectedCommentId(null);
      return;
    }

    await this.waitForSidebarTransition();

    const sidebarContainer = this.getSidebarContainer();
    if (sidebarContainer) {
      sidebarContainer.scrollTop = previousState.scrollPosition;
    }

    this.callbacks.restoreSelectedCommentId(previousState.selectedCommentId);
  }

  closeSidebar(): void {
    this.sidebarService.closeSidebar();
    this.stateStack = [];
    this.pendingSelectFirstVisible = false;
    this.callbacks.restoreSelectedCommentId(null);
  }

  applyPendingFirstVisibleSelection(): void {
    if (!this.pendingSelectFirstVisible) {
      return;
    }

    this.pendingSelectFirstVisible = false;
    this.callbacks.selectFirstVisibleComment();
  }

  private getSidebarContainer(): HTMLElement | null {
    return document.querySelector('.sidebar-comments-panel');
  }

  private waitForSidebarTransition(): Promise<void> {
    // Sidebar transitions use 150ms out + 150ms in animations.
    return new Promise((resolve) => setTimeout(resolve, 350));
  }
}
