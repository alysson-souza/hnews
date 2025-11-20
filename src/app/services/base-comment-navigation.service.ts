// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal, computed, inject } from '@angular/core';
import { SidebarCommentsInteractionService } from './sidebar-comments-interaction.service';
import { CommandRegistryService } from './command-registry.service';
import { ScrollService } from './scroll.service';

@Injectable()
export abstract class BaseCommentNavigationService {
  // Currently selected comment ID
  selectedCommentId = signal<number | null>(null);

  protected interactionService = inject(SidebarCommentsInteractionService);
  protected commandRegistry = inject(CommandRegistryService);
  protected scrollService = inject(ScrollService);

  /**
   * CSS selector for the container element where comments are located.
   * e.g., '.sidebar-comments-panel' or '.comments-card'
   */
  protected abstract get containerSelector(): string;

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
   * Get all visible comment elements in the container in DOM order (depth-first)
   */
  protected getVisibleCommentElements(): HTMLElement[] {
    const comments: HTMLElement[] = [];

    // Find all thread containers that are not collapsed
    const threadContainers = document.querySelectorAll(
      `${this.containerSelector} [role="treeitem"]`,
    ) as NodeListOf<HTMLElement>;

    threadContainers.forEach((container) => {
      // Skip if this is inside a collapsed thread
      let parent = container.parentElement;
      while (parent) {
        if (
          parent.classList.contains('thread-container') &&
          parent.classList.contains('collapsed')
        ) {
          return; // Skip this comment
        }
        parent = parent.parentElement;
      }

      comments.push(container);
    });

    return comments;
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
    const visibleComments = this.getVisibleCommentElements();
    if (visibleComments.length === 0) return;

    const currentId = this.selectedCommentId();
    let nextId: number | null = null;

    // If nothing selected, select first
    if (currentId === null) {
      const firstId = this.getCommentId(visibleComments[0]);
      if (firstId !== null) {
        nextId = firstId;
      }
    } else {
      // Find current comment index
      const currentIndex = visibleComments.findIndex((el) => this.getCommentId(el) === currentId);

      if (currentIndex === -1) {
        // Current selection not found, select first
        const firstId = this.getCommentId(visibleComments[0]);
        if (firstId !== null) {
          nextId = firstId;
        }
      } else if (currentIndex < visibleComments.length - 1) {
        // Select next if available
        const id = this.getCommentId(visibleComments[currentIndex + 1]);
        if (id !== null) {
          nextId = id;
        }
      }
    }

    if (nextId !== null) {
      this.selectedCommentId.set(nextId);
      this.scrollSelectedIntoView();
    }
  }

  /**
   * Select previous comment
   */
  selectPrevious(): void {
    const visibleComments = this.getVisibleCommentElements();
    if (visibleComments.length === 0) return;

    const currentId = this.selectedCommentId();
    let prevId: number | null = null;

    // If nothing selected, select first
    if (currentId === null) {
      const firstId = this.getCommentId(visibleComments[0]);
      if (firstId !== null) {
        prevId = firstId;
      }
    } else {
      // Find current comment index
      const currentIndex = visibleComments.findIndex((el) => this.getCommentId(el) === currentId);

      if (currentIndex === -1) {
        // Current selection not found, select first
        const firstId = this.getCommentId(visibleComments[0]);
        if (firstId !== null) {
          prevId = firstId;
        }
      } else if (currentIndex > 0) {
        // Select previous if available
        const id = this.getCommentId(visibleComments[currentIndex - 1]);
        if (id !== null) {
          prevId = id;
        }
      }
    }

    if (prevId !== null) {
      this.selectedCommentId.set(prevId);
      this.scrollSelectedIntoView();
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
   * Upvote the selected comment
   */
  upvoteSelected(): void {
    const selectedId = this.selectedCommentId();
    if (selectedId !== null) {
      this.interactionService.dispatchAction(selectedId, 'upvote');
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

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedCommentId.set(null);
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
      // Add a small offset (e.g., 16px) for better visibility
      await this.scrollService.scrollToHTMLElement(element, { offset: 16, behavior: 'smooth' });
    }
  }
}
