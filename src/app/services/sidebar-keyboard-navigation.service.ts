// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BaseCommentNavigationService } from './base-comment-navigation.service';
import { SidebarService } from './sidebar.service';
import { SidebarThreadNavigationService } from './sidebar-thread-navigation.service';

@Injectable({
  providedIn: 'root',
})
export class SidebarKeyboardNavigationService extends BaseCommentNavigationService {
  private sidebarService = inject(SidebarService);
  private sidebarThreadNavigation = inject(SidebarThreadNavigationService);
  private router = inject(Router);
  private pendingKeyboardSelect = false;

  constructor() {
    super();

    this.sidebarThreadNavigation.registerSelectionCallbacks({
      captureSelectedCommentId: () => this.selectedCommentId(),
      restoreSelectedCommentId: (commentId) => this.restoreSelectedComment(commentId),
      selectFirstVisibleComment: () => {
        this.scrollSidebarToFirstVisible();
        if (this.pendingKeyboardSelect) {
          this.pendingKeyboardSelect = false;
          this.selectFirstVisibleComment({ scrollIntoView: false });
        }
      },
    });
  }

  protected get containerSelector(): string {
    return '.sidebar-comments-panel';
  }

  protected get context() {
    return 'sidebar' as const;
  }

  protected registerCommands(): void {
    this.commandRegistry.register('sidebar.nextComment', () => this.selectNext());
    this.commandRegistry.register('sidebar.previousComment', () => this.selectPrevious());
    this.commandRegistry.register('sidebar.toggleExpand', () => this.toggleExpandSelected());
    this.commandRegistry.register('sidebar.expandReplies', () => this.expandRepliesSelected());
    this.commandRegistry.register('sidebar.viewThread', () => this.viewThreadSelected());
    this.commandRegistry.register('sidebar.back', () => this.goBack());
    this.commandRegistry.register('sidebar.close', () => this.closeSidebar());
    this.commandRegistry.register('sidebar.openFullView', () => this.openFullView());
    this.commandRegistry.register('sidebar.backOrClose', () => this.handleBackOrClose());
    this.commandRegistry.register('sidebar.nextUnreadComment', () =>
      this.selectNextUnreadComment(),
    );
    this.commandRegistry.register('sidebar.nextOPComment', () => this.selectNextOPComment());
    this.commandRegistry.register('sidebar.expandAllComments', () => this.expandAllComments());
    this.commandRegistry.register('sidebar.collapseAllComments', () => this.collapseAllComments());
  }

  /**
   * Scroll selected comment into view
   * Overridden to use the sidebar's scroll container with toolbar offset
   */
  protected override async scrollSelectedIntoView(): Promise<void> {
    const selectedId = this.selectedCommentId();
    if (selectedId === null) return;

    const element = this.findElementById(selectedId);
    if (!element) return;

    const container = document.querySelector(this.containerSelector) as HTMLElement | null;
    if (!container) {
      element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const target = this.computeSidebarScrollTarget(element, container);
    this.ensureScrollTarget(container, target);

    container.scrollTo({
      top: target,
      behavior: 'smooth',
    });
  }

  /**
   * View thread of selected comment - save state first
   */
  override viewThreadSelected(): void {
    const selectedId = this.selectedCommentId();
    if (selectedId !== null && this.commentIndex.hasChildren(this.context, selectedId)) {
      this.pendingKeyboardSelect = true;
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
   * Open the current item in full view
   */
  openFullView(): void {
    const itemId = this.sidebarService.currentItemId();
    if (itemId === null) return;

    this.closeSidebar();
    void this.router.navigate(['/item', itemId]);
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

  /**
   * Ensure the sidebar container has enough scrollable space to reach the target.
   * Adds a temporary spacer if needed, removed after the next scroll.
   */
  private ensureScrollTarget(container: HTMLElement, targetScrollTop: number): void {
    const scrollTop = container.scrollTop;
    this.cleanupScrollSpacers(container);

    const clientHeight = container.clientHeight;

    let contentHeight = 0;
    for (const child of Array.from(container.children)) {
      contentHeight += (child as HTMLElement).offsetHeight;
    }

    const neededHeight = clientHeight + targetScrollTop;
    const shortfall = neededHeight - contentHeight;

    if (shortfall > 0) {
      const spacer = document.createElement('div');
      spacer.style.height = `${shortfall}px`;
      spacer.setAttribute('data-scroll-spacer', '');
      container.appendChild(spacer);
    }

    container.scrollTop = scrollTop;
  }

  /**
   * Clean up any temporary scroll spacers.
   */
  private cleanupScrollSpacers(container: HTMLElement): void {
    container.querySelectorAll('[data-scroll-spacer]').forEach((el) => el.remove());
  }

  /**
   * Compute target scrollTop so element is visible below the sticky toolbar.
   */
  private computeSidebarScrollTarget(element: HTMLElement, container: HTMLElement): number {
    const toolbar = container.querySelector('.comments-heading') as HTMLElement | null;
    const toolbarHeight = toolbar?.getBoundingClientRect().height ?? 0;
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const targetScrollTop =
      container.scrollTop + (elementRect.top - containerRect.top) - toolbarHeight - 16;

    return Math.max(0, targetScrollTop);
  }

  /**
   * Scroll sidebar container to the first visible comment, accounting for sticky toolbar.
   * Retries up to 20 times (2s total) for async comment rendering.
   * Does NOT set keyboard selection — only scrolls for visibility.
   */
  private scrollSidebarToFirstVisible(retries = 20): void {
    const container = document.querySelector(this.containerSelector) as HTMLElement | null;
    if (!container) return;

    const firstComment = container.querySelector('[role="treeitem"]') as HTMLElement | null;
    if (!firstComment) {
      if (retries > 0) {
        setTimeout(() => this.scrollSidebarToFirstVisible(retries - 1), 100);
      }
      return;
    }

    const target = this.computeSidebarScrollTarget(firstComment, container);
    this.ensureScrollTarget(container, target);

    container.scrollTo({
      top: target,
      behavior: 'smooth',
    });
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
