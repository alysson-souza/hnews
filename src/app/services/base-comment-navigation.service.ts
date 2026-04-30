// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, signal, computed, inject } from '@angular/core';
import { SidebarCommentsInteractionService } from './sidebar-comments-interaction.service';
import { CommandRegistryService } from './command-registry.service';
import { ScrollService } from './scroll.service';
import { CommentThreadContext, CommentThreadIndexService } from './comment-thread-index.service';
import { CommentStateService } from './comment-state.service';

@Injectable()
export abstract class BaseCommentNavigationService {
  private readonly EXPAND_ALL_LIMIT = 100;

  // Currently selected comment ID
  selectedCommentId = signal<number | null>(null);

  protected interactionService = inject(SidebarCommentsInteractionService);
  protected commandRegistry = inject(CommandRegistryService);
  protected scrollService = inject(ScrollService);
  protected commentIndex = inject(CommentThreadIndexService);
  protected commentState = inject(CommentStateService);

  /**
   * CSS selector for the container element where comments are located.
   * e.g., '.sidebar-comments-panel' or '.comments-card'
   */
  protected abstract get containerSelector(): string;

  /**
   * Comment index context used by the concrete page/surface.
   */
  protected abstract get context(): CommentThreadContext;

  constructor() {
    this.registerCommands();
  }

  /**
   * Register keyboard commands specific to the implementation
   */
  protected abstract registerCommands(): void;

  // Check if a specific comment is selected
  isSelected = computed(() => {
    const id = this.selectedCommentId();
    return (commentId: number) => id === commentId;
  });

  /**
   * Get all visible comment elements and load more buttons in the container in DOM order (depth-first)
   */
  protected getVisibleCommentElements(): HTMLElement[] {
    const elements: HTMLElement[] = [];

    // Find all thread containers that are not collapsed AND load more buttons
    const allCandidates = document.querySelectorAll(
      `${this.containerSelector} [role="treeitem"], ${this.containerSelector} .load-more-btn`,
    ) as NodeListOf<HTMLElement>;

    allCandidates.forEach((container) => {
      // Skip if this is inside a collapsed thread
      let parent = container.parentElement;
      let isCollapsed = false;
      while (parent) {
        if (
          parent.classList.contains('thread-container') &&
          parent.classList.contains('collapsed')
        ) {
          isCollapsed = true;
          break;
        }
        parent = parent.parentElement;
      }

      if (!isCollapsed) {
        elements.push(container);
      }
    });

    return elements;
  }

  /**
   * Get comment ID from element
   */
  protected getCommentId(element: HTMLElement): number | null {
    const id = element.getAttribute('data-comment-id');
    return id ? parseInt(id, 10) : null;
  }

  /**
   * Find element by comment ID
   */
  protected findElementById(commentId: number): HTMLElement | null {
    return document.querySelector(
      `${this.containerSelector} [data-comment-id="${commentId}"]`,
    ) as HTMLElement;
  }

  /**
   * Select next comment in depth-first order
   */
  selectNext(): void {
    const visibleElements = this.getVisibleCommentElements();
    if (visibleElements.length === 0) return;

    const currentId = this.selectedCommentId();

    // If nothing selected, select first comment
    if (currentId === null) {
      const firstComment = visibleElements.find((el) => this.getCommentId(el) !== null);
      if (firstComment) {
        const id = this.getCommentId(firstComment);
        if (id !== null) {
          this.selectedCommentId.set(id);
          this.scrollSelectedIntoView();
        }
      }
      return;
    }

    // Find current comment index
    const currentIndex = visibleElements.findIndex((el) => this.getCommentId(el) === currentId);

    if (currentIndex === -1) {
      // Current selection not found, select first comment
      const firstComment = visibleElements.find((el) => this.getCommentId(el) !== null);
      if (firstComment) {
        const id = this.getCommentId(firstComment);
        if (id !== null) {
          this.selectedCommentId.set(id);
          this.scrollSelectedIntoView();
        }
      }
    } else if (currentIndex < visibleElements.length - 1) {
      // Check next element
      const nextElement = visibleElements[currentIndex + 1];

      if (nextElement.classList.contains('load-more-btn')) {
        // It's a button, click it
        if (nextElement.tagName.toLowerCase() === 'app-button') {
          const innerBtn = nextElement.querySelector('button');
          innerBtn?.click();
        } else {
          nextElement.click();
        }
        // Do not change selection
      } else {
        // It's a comment
        const id = this.getCommentId(nextElement);
        if (id !== null) {
          this.selectedCommentId.set(id);
          this.scrollSelectedIntoView();
        }
      }
    }
  }

  /**
   * Select previous comment
   */
  selectPrevious(): void {
    const visibleElements = this.getVisibleCommentElements();
    if (visibleElements.length === 0) return;

    const currentId = this.selectedCommentId();

    // If nothing selected, select first comment
    if (currentId === null) {
      const firstComment = visibleElements.find((el) => this.getCommentId(el) !== null);
      if (firstComment) {
        const id = this.getCommentId(firstComment);
        if (id !== null) {
          this.selectedCommentId.set(id);
          this.scrollSelectedIntoView();
        }
      }
      return;
    }

    // Find current comment index
    const currentIndex = visibleElements.findIndex((el) => this.getCommentId(el) === currentId);

    if (currentIndex === -1) {
      // Current selection not found, select first comment
      const firstComment = visibleElements.find((el) => this.getCommentId(el) !== null);
      if (firstComment) {
        const id = this.getCommentId(firstComment);
        if (id !== null) {
          this.selectedCommentId.set(id);
          this.scrollSelectedIntoView();
        }
      }
    } else if (currentIndex > 0) {
      // Find previous element that is a comment (skip buttons)
      let prevIndex = currentIndex - 1;
      while (prevIndex >= 0) {
        const el = visibleElements[prevIndex];
        if (!el.classList.contains('load-more-btn')) {
          const id = this.getCommentId(el);
          if (id !== null) {
            this.selectedCommentId.set(id);
            this.scrollSelectedIntoView();
            return;
          }
        }
        prevIndex--;
      }
    }
  }

  /**
   * Toggle expand/collapse for the selected comment
   */
  toggleExpandSelected(): void {
    const selectedId = this.selectedCommentId();
    if (selectedId !== null) {
      this.interactionService.dispatchAction(selectedId, 'collapse');
    }
  }

  /**
   * Expand replies for the selected comment
   */
  expandRepliesSelected(): void {
    const selectedId = this.selectedCommentId();
    if (selectedId !== null) {
      this.interactionService.dispatchAction(selectedId, 'expandReplies');
    }
  }

  /**
   * View the thread of the selected comment (navigate deeper)
   */
  viewThreadSelected(): void {
    const selectedId = this.selectedCommentId();
    if (selectedId !== null) {
      this.interactionService.dispatchAction(selectedId, 'viewThread');
    }
  }

  selectNextUnreadComment(): void {
    this.selectNextMatchingComment((commentId) =>
      this.commentIndex.isUnread(this.context, commentId),
    );
  }

  selectNextOPComment(): void {
    this.selectNextMatchingComment((commentId) =>
      this.commentIndex.isOPReply(this.context, commentId),
    );
  }

  collapseAllComments(): void {
    const ids = this.getVisibleCommentIds();
    this.commentState.setCollapsedMany(ids, true);
    ids.forEach((id) => this.interactionService.dispatchAction(id, 'collapseAll'));
  }

  expandAllComments(): void {
    const ids = this.getVisibleCommentIds().slice(0, this.EXPAND_ALL_LIMIT);
    this.commentState.setCollapsedMany(ids, false);
    ids.forEach((id) => this.interactionService.dispatchAction(id, 'expandAll'));
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedCommentId.set(null);
  }

  /**
   * Select first visible comment in the current container.
   * Falls back to first comment in DOM order if none are visible.
   */
  selectFirstVisibleComment(options?: { scrollIntoView?: boolean }): void {
    const shouldScroll = options?.scrollIntoView ?? true;
    const visibleElements = this.getVisibleCommentElements();
    if (visibleElements.length === 0) return;

    const visibleComment =
      visibleElements.find((element) => {
        const commentId = this.getCommentId(element);
        return commentId !== null && this.isElementVisibleInViewport(element);
      }) ?? visibleElements.find((element) => this.getCommentId(element) !== null);

    if (!visibleComment) return;

    const commentId = this.getCommentId(visibleComment);
    if (commentId === null) return;

    this.selectedCommentId.set(commentId);
    if (shouldScroll) {
      void this.scrollSelectedIntoView();
    }
  }

  /**
   * Scroll selected comment into view
   */
  protected async scrollSelectedIntoView(): Promise<void> {
    const selectedId = this.selectedCommentId();
    if (selectedId === null) return;

    const element = this.findElementById(selectedId);
    if (element) {
      // Use scrollToHTMLElement to account for the fixed header
      // and the sticky comment toolbar.
      await this.scrollService.scrollToHTMLElement(element, {
        offset: this.getStickyToolbarHeight() + 16,
        behavior: 'smooth',
      });
    }
  }

  protected getVisibleCommentIds(): number[] {
    return this.getVisibleCommentElements()
      .map((element) => this.getCommentId(element))
      .filter((commentId): commentId is number => commentId !== null);
  }

  private selectNextMatchingComment(matches: (commentId: number) => boolean): void {
    const visibleIds = this.getVisibleCommentIds();
    if (visibleIds.length === 0) {
      return;
    }

    const matchingIds = visibleIds.filter(matches);
    if (matchingIds.length === 0) {
      return;
    }

    const currentId = this.selectedCommentId();
    const currentIndex = currentId === null ? -1 : visibleIds.indexOf(currentId);
    const nextId =
      matchingIds.find((commentId) => visibleIds.indexOf(commentId) > currentIndex) ??
      matchingIds[0];

    for (const ancestorId of this.commentIndex.getParentPath(this.context, nextId)) {
      this.interactionService.dispatchAction(ancestorId, 'expandAll');
    }

    this.selectedCommentId.set(nextId);
    void this.scrollSelectedIntoView();
  }

  protected getStickyToolbarHeight(): number {
    const toolbar = document.querySelector(
      `${this.containerSelector} .comments-heading`,
    ) as HTMLElement | null;

    return toolbar?.getBoundingClientRect().height ?? 0;
  }

  private isElementVisibleInViewport(element: HTMLElement): boolean {
    const container = document.querySelector(this.containerSelector) as HTMLElement | null;
    const elementRect = element.getBoundingClientRect();

    if (container && this.isScrollableContainer(container)) {
      const containerRect = container.getBoundingClientRect();
      return elementRect.bottom > containerRect.top && elementRect.top < containerRect.bottom;
    }

    return elementRect.bottom > 0 && elementRect.top < window.innerHeight;
  }

  private isScrollableContainer(container: HTMLElement): boolean {
    const styles = window.getComputedStyle(container);
    return ['auto', 'scroll'].includes(styles.overflowY);
  }
}
