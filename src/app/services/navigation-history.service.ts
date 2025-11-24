// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, take, timeout } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

export interface NavigationState {
  url: string;
  selectedIndex: number | null;
  storyType?: string; // For story list pages
}

/**
 * Callback interface for restoring selection and scroll state after navigation.
 * Allows the caller to provide custom restoration logic.
 */
export interface StateRestorationCallbacks {
  setSelectedIndex: (index: number) => void;
  scrollSelectedIntoView: () => Promise<void>;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationHistoryService {
  private router = inject(Router);
  private navigationStack: NavigationState[] = [];
  private readonly maxStackSize = 10;
  private isProgrammaticNavigation = false;
  private lastUrl: string | null = null;

  constructor() {
    // Track all navigation events to maintain history
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Only add to stack if this was a user-initiated navigation
        // and we're not already doing programmatic navigation
        if (!this.isProgrammaticNavigation && this.lastUrl && this.lastUrl !== event.url) {
          // Don't add to stack if we're navigating FROM an /item/ page TO another /item/ page
          // unless it was triggered by our keyboard shortcuts
          const fromItem = this.lastUrl.includes('/item/');
          const toItem = event.url.includes('/item/');

          // Skip adding to stack for item-to-item navigation that wasn't programmatic
          if (fromItem && toItem) {
            // Stack is already managed by pushCurrentUrl for keyboard navigation
          }
        }

        this.lastUrl = event.url;
        this.isProgrammaticNavigation = false;
      });
  }

  /**
   * Push current URL and selected index to stack before navigating to a new page
   * Used when navigating via keyboard shortcuts
   */
  pushCurrentState(selectedIndex: number | null, storyType?: string): void {
    const currentUrl = this.router.url;

    // Don't push if it's already at the top of the stack with the same URL
    if (this.navigationStack.length > 0) {
      const top = this.navigationStack[this.navigationStack.length - 1];
      if (top.url === currentUrl) {
        // Update the selected index for the current URL
        top.selectedIndex = selectedIndex;
        top.storyType = storyType;
        return;
      }
    }

    this.navigationStack.push({ url: currentUrl, selectedIndex, storyType });

    // Limit stack size
    if (this.navigationStack.length > this.maxStackSize) {
      this.navigationStack.shift();
    }
  }

  /**
   * Navigate back to previous URL and restore selected index
   * Returns the selected index that should be restored
   */
  goBack(): NavigationState | null {
    if (this.navigationStack.length === 0) {
      return null;
    }

    const previousState = this.navigationStack.pop()!;
    this.isProgrammaticNavigation = true;
    this.router.navigateByUrl(previousState.url);
    return previousState;
  }

  /**
   * Check if we have a previous URL to go back to
   */
  canGoBack(): boolean {
    return this.navigationStack.length > 0;
  }

  /**
   * Clear the navigation stack
   */
  clearStack(): void {
    this.navigationStack = [];
  }

  /**
   * Get the previous state without removing it
   */
  peekPreviousState(): NavigationState | null {
    return this.navigationStack.length > 0
      ? this.navigationStack[this.navigationStack.length - 1]
      : null;
  }

  /**
   * Navigate back and restore selection/scroll state.
   * Waits for NavigationEnd before restoring state to ensure DOM is ready.
   * @param callbacks - Functions to call for state restoration
   * @returns The previous state, or null if no history
   */
  async navigateBackWithRestore(
    callbacks: StateRestorationCallbacks,
  ): Promise<NavigationState | null> {
    if (!this.canGoBack()) {
      return null;
    }

    const previousState = this.navigationStack.pop()!;
    this.isProgrammaticNavigation = true;

    // Start navigation
    this.router.navigateByUrl(previousState.url);

    // Wait for NavigationEnd with a timeout fallback
    try {
      await firstValueFrom(
        this.router.events.pipe(
          filter((event) => event instanceof NavigationEnd),
          take(1),
          timeout(500),
        ),
      );
    } catch {
      // Timeout reached - proceed anyway, DOM should be ready
    }

    // Restore state if we have a selected index
    if (previousState.selectedIndex !== null) {
      // Small delay to ensure component has rendered
      await new Promise((resolve) => setTimeout(resolve, 50));
      callbacks.setSelectedIndex(previousState.selectedIndex);
      await callbacks.scrollSelectedIntoView();
    }

    return previousState;
  }
}
