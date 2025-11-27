// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommandRegistryService } from './command-registry.service';
import { ScrollService } from './scroll.service';
import { NavigationHistoryService } from './navigation-history.service';
import { StoryListStore } from '../stores/story-list.store';

@Injectable({
  providedIn: 'root',
})
export class KeyboardNavigationService {
  selectedIndex = signal<number | null>(null);
  totalItems = signal<number>(0);

  private commandRegistry = inject(CommandRegistryService);
  private scrollService = inject(ScrollService);
  private router = inject(Router);
  private navigationHistory = inject(NavigationHistoryService);
  private storyListStore = inject(StoryListStore);

  constructor() {
    this.registerCommands();
  }

  private registerCommands() {
    this.commandRegistry.register('story.next', () => this.selectNextStory());
    this.commandRegistry.register('story.previous', () => this.selectPreviousStory());
    this.commandRegistry.register('story.open', () => this.openSelectedStory());
    this.commandRegistry.register('story.openFull', () => this.openSelectedStoryFullPage());
    this.commandRegistry.register('story.openComments', () => this.openSelectedComments());
    this.commandRegistry.register('story.openCommentsPage', () => this.navigateToItemPage());
    this.commandRegistry.register('navigation.previousTab', () => this.navigateToPreviousTab());
    this.commandRegistry.register('navigation.nextTab', () => this.navigateToNextTab());
    // Toggle actions menu for currently selected story
    this.commandRegistry.register('story.actions.toggle', () =>
      this.toggleSelectedStoryActionsMenu(),
    );
    this.commandRegistry.register('story.toggleFilter', () => this.toggleStoryFilter());
  }

  isSelected = computed(() => {
    const index = this.selectedIndex();
    return (itemIndex: number) => index === itemIndex;
  });

  setTotalItems(count: number): void {
    this.totalItems.set(count);
    const current = this.selectedIndex();
    if (current !== null && current >= count) {
      this.selectedIndex.set(count > 0 ? count - 1 : null);
    }
  }

  selectNext(): boolean {
    const current = this.selectedIndex();
    const total = this.totalItems();

    if (total === 0) return false;

    if (current === null) {
      this.selectedIndex.set(0);
      return true;
    }

    if (current < total - 1) {
      this.selectedIndex.set(current + 1);
      return true;
    }

    return false;
  }

  selectPrevious(): boolean {
    const current = this.selectedIndex();
    const total = this.totalItems();

    if (total === 0) return false;

    if (current === null) {
      this.selectedIndex.set(0);
      return true;
    }

    if (current > 0) {
      this.selectedIndex.set(current - 1);
      return true;
    }

    return false;
  }

  selectFirst(): void {
    if (this.totalItems() > 0) {
      this.selectedIndex.set(0);
    }
  }

  selectLast(): void {
    const total = this.totalItems();
    if (total > 0) {
      this.selectedIndex.set(total - 1);
    }
  }

  clearSelection(): void {
    this.selectedIndex.set(null);
  }

  setSelection(index: number): void {
    if (index >= 0 && index < this.totalItems()) {
      this.selectedIndex.set(index);
    }
  }

  setSelectedIndex(index: number | null): void {
    if (index === null || (index >= 0 && index < this.totalItems())) {
      this.selectedIndex.set(index);
    }
  }

  isAtLastItem(): boolean {
    const current = this.selectedIndex();
    const total = this.totalItems();
    return current !== null && current === total - 1;
  }

  isAtFirstItem(): boolean {
    const current = this.selectedIndex();
    return current === 0;
  }

  // Command Handlers

  private selectNextStory(): void {
    this.blurActiveElement();
    if (this.isAtLastItem()) {
      const loadMoreBtn = document.querySelector('.load-more-btn') as HTMLElement;
      loadMoreBtn?.click();
    } else {
      this.selectNext();
      this.scrollSelectedStoryIntoView();
    }
  }

  private selectPreviousStory(): void {
    this.blurActiveElement();
    this.selectPrevious();
    this.scrollSelectedStoryIntoView();
  }

  private async scrollSelectedStoryIntoView(): Promise<void> {
    const selectedIndex = this.selectedIndex();
    if (selectedIndex !== null) {
      const element = document.querySelector(`[data-story-index="${selectedIndex}"]`);
      if (element) {
        await this.scrollService.scrollElementIntoView(element, { block: 'center' });
      }
    }
  }

  private openSelectedStory(): void {
    const selectedIndex = this.selectedIndex();
    if (selectedIndex !== null) {
      const element = document.querySelector(
        `[data-story-index="${selectedIndex}"] .story-link-trigger`,
      ) as HTMLAnchorElement;
      if (element && element.href && element.href.includes('/item/')) {
        this.openSelectedComments();
      } else {
        element?.click();
      }
    }
  }

  private openSelectedComments(): void {
    const selectedIndex = this.selectedIndex();
    if (selectedIndex !== null) {
      const element = document.querySelector(
        `[data-story-index="${selectedIndex}"] .story-comments-trigger`,
      ) as HTMLElement;
      element?.click();
    }
  }

  private openSelectedStoryFullPage(): void {
    const selectedIndex = this.selectedIndex();
    if (selectedIndex !== null) {
      const element = document.querySelector(
        `[data-story-index="${selectedIndex}"] .story-link-trigger`,
      ) as HTMLAnchorElement;
      if (element && element.href && element.href.includes('/item/')) {
        const match = element.href.match(/\/item\/(\d+)/);
        if (match && match[1]) {
          this.pushNavigationState();
          this.router.navigate(['/item', match[1]]);
        }
      } else {
        element?.click();
      }
    }
  }

  private navigateToItemPage(): void {
    const selectedIndex = this.selectedIndex();
    if (selectedIndex !== null) {
      const storyElement = document.querySelector(`[data-story-index="${selectedIndex}"]`);
      if (storyElement) {
        const storyId = storyElement.getAttribute('data-story-id');
        if (storyId) {
          this.pushNavigationState();
          this.router.navigate(['/item', storyId]);
        }
      }
    }
  }

  private navigateToPreviousTab(): void {
    this.blurActiveElement();
    this.navigateToTab('prev');
  }

  private navigateToNextTab(): void {
    this.blurActiveElement();
    this.navigateToTab('next');
  }

  private navigateToTab(direction: 'next' | 'prev'): void {
    const tabs = ['top', 'best', 'newest', 'ask', 'show', 'jobs', 'settings'];
    const currentPath = this.router.url.split('/')[1]?.split('?')[0] || 'top';
    const currentIndex = tabs.indexOf(currentPath);

    if (currentIndex === -1) return;

    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % tabs.length;
      this.router.navigate(['/' + tabs[nextIndex]]);
    } else {
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      this.router.navigate(['/' + tabs[prevIndex]]);
    }

    this.clearSelection();
  }

  private pushNavigationState(): void {
    const currentPath = this.router.url.split('/')[1]?.split('?')[0] || 'top';
    const storyType = currentPath === '' ? 'top' : currentPath;
    this.navigationHistory.pushCurrentState(this.selectedIndex(), storyType);
  }

  private blurActiveElement(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  }

  private toggleStoryFilter(): void {
    this.storyListStore.toggleFilterMode();
    this.clearSelection();
  }

  /**
   * Toggle the actions ("More") menu for the selected story. If no story is selected,
   * selects the first story automatically. When opening, focuses the first menu item
   * for immediate keyboard navigation. When closing, refocuses the story title link.
   */
  private toggleSelectedStoryActionsMenu(): void {
    // Ensure we have a selected index
    let selectedIndex = this.selectedIndex();
    if (selectedIndex === null) {
      // Select first story if available
      if (this.totalItems() === 0) return;
      this.selectedIndex.set(0);
      selectedIndex = 0;
      // Scroll into view for visual reference
      this.scrollSelectedStoryIntoView();
    }

    const storyElement = document.querySelector(`[data-story-index="${selectedIndex}"]`);
    if (!storyElement) return;

    const actionsButton = storyElement.querySelector(
      '.story-actions-btn',
    ) as HTMLButtonElement | null;
    if (!actionsButton) return;

    const container = actionsButton.closest('.story-actions-container');
    const existingMenu = container?.querySelector('.story-actions-menu');

    // If menu exists, toggle (close) via button click to reuse existing logic
    if (existingMenu) {
      actionsButton.click();
      // Refocus story title for continuity
      const titleLink = storyElement.querySelector('.story-title-link') as HTMLElement | null;
      titleLink?.focus();
      return;
    }

    // Open menu via button click
    actionsButton.click();

    // After rendering, focus first item
    setTimeout(() => {
      const firstItem = container?.querySelector('.story-actions-item') as HTMLElement | null;
      firstItem?.focus();
    }, 0);
  }
}
