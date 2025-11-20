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
