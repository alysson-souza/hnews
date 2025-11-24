// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { BaseCommentNavigationService } from './base-comment-navigation.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

interface ItemPageState {
  itemId: string;
  selectedCommentId: number | null;
  scrollPosition: number;
}

@Injectable({
  providedIn: 'root',
})
export class ItemKeyboardNavigationService
  extends BaseCommentNavigationService
  implements OnDestroy
{
  private router = inject(Router);
  private location = inject(Location);

  private stateStack: ItemPageState[] = [];
  private isNavigatingBack = false;
  private routerSubscription: Subscription;

  constructor() {
    super();
    // Listen for navigation events to detect back navigation
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isNavigatingBack) {
          this.restoreStateAfterBack();
          this.isNavigatingBack = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  protected get containerSelector(): string {
    return '.comments-card';
  }

  protected registerCommands(): void {
    this.commandRegistry.register('item.nextComment', () => this.selectNext());
    this.commandRegistry.register('item.previousComment', () => this.selectPrevious());
    this.commandRegistry.register('item.toggleExpand', () => this.toggleExpandSelected());
    this.commandRegistry.register('item.upvote', () => this.upvoteSelected());
    this.commandRegistry.register('item.expandReplies', () => this.expandRepliesSelected());
    this.commandRegistry.register('item.viewThread', () => this.viewThreadSelected());
    this.commandRegistry.register('item.back', () => this.goBack());
  }

  /**
   * Save current state before navigating deeper into a thread
   */
  private saveCurrentState(): void {
    const itemId = this.getCurrentItemId();
    if (!itemId) return;

    const container = document.querySelector(this.containerSelector);
    this.stateStack.push({
      itemId,
      selectedCommentId: this.selectedCommentId(),
      scrollPosition: container?.scrollTop ?? window.scrollY,
    });
  }

  /**
   * Restore state after navigating back
   */
  private async restoreStateAfterBack(): Promise<void> {
    const state = this.stateStack.pop();
    if (!state) return;

    // Wait for DOM to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Restore comment selection
    if (state.selectedCommentId !== null) {
      this.selectedCommentId.set(state.selectedCommentId);
      await this.scrollSelectedIntoView();
    }
  }

  /**
   * Get current item ID from URL
   */
  private getCurrentItemId(): string | null {
    const match = this.router.url.match(/\/item\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Navigate back in browser history and restore state
   */
  goBack(): void {
    this.isNavigatingBack = true;
    this.location.back();
  }

  /**
   * View the thread of the selected comment (navigate deeper)
   */
  override viewThreadSelected(): void {
    const selectedId = this.selectedCommentId();
    if (selectedId !== null) {
      // Save current state before navigating
      this.saveCurrentState();
      this.router.navigate(['/item', selectedId]);
    }
  }
}
