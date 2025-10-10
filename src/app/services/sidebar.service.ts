// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject, signal, computed } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private router = inject(Router);

  isOpen = signal(false);
  currentItemId = signal<number | null>(null);
  animatingOut = signal(false);
  animationDirection = signal<'left' | 'right'>('right');
  isTransitioning = signal(false); // Only true during navigation transitions

  // Navigation history stack for back button functionality
  private navigationStack = signal<number[]>([]);

  // Computed signal to determine if back navigation is available
  canGoBack = computed(() => this.navigationStack().length > 1);

  constructor() {
    // Close sidebar on route changes
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      if (this.isOpen()) {
        this.closeSidebar();
      }
    });
  }

  openSidebar(itemId: number): void {
    this.currentItemId.set(itemId);
    this.isOpen.set(true);
    // Initialize navigation stack with the first item
    this.navigationStack.set([itemId]);
  }

  closeSidebar(): void {
    this.isOpen.set(false);
    // Keep currentItemId for animation purposes
    setTimeout(() => {
      if (!this.isOpen()) {
        this.currentItemId.set(null);
        this.navigationStack.set([]);
      }
    }, 300); // Match animation duration
  }

  toggleSidebar(itemId: number): void {
    if (this.currentItemId() === itemId && this.isOpen()) {
      this.closeSidebar();
    } else {
      this.openSidebar(itemId);
    }
  }

  openSidebarWithSlideAnimation(newItemId: number): void {
    const currentId = this.currentItemId();

    // If sidebar is closed, just open it normally
    if (!this.isOpen()) {
      this.openSidebar(newItemId);
      return;
    }

    // If same item, do nothing
    if (currentId === newItemId) {
      return;
    }

    // Add to navigation stack
    this.navigationStack.update((stack) => [...stack, newItemId]);

    // Animate: slide current content out left, then new content in from right
    this.isTransitioning.set(true);
    this.animatingOut.set(true);
    this.animationDirection.set('left');

    setTimeout(() => {
      this.currentItemId.set(newItemId);
      this.animatingOut.set(false);
      this.animationDirection.set('right');
      // Reset transitioning state after animation completes
      setTimeout(() => {
        this.isTransitioning.set(false);
      }, 150);
    }, 150); // Match CSS animation duration
  }

  goBack(): void {
    const stack = this.navigationStack();

    // Need at least 2 items to go back
    if (stack.length < 2) {
      return;
    }

    // Remove current item from stack
    const newStack = stack.slice(0, -1);
    const previousItemId = newStack[newStack.length - 1];

    // Animate: slide current content out right, then previous content in from left
    this.isTransitioning.set(true);
    this.animatingOut.set(true);
    this.animationDirection.set('right');

    setTimeout(() => {
      this.navigationStack.set(newStack);
      this.currentItemId.set(previousItemId);
      this.animatingOut.set(false);
      this.animationDirection.set('left');
      // Reset transitioning state after animation completes
      setTimeout(() => {
        this.isTransitioning.set(false);
      }, 150);
    }, 150); // Match CSS animation duration
  }
}
