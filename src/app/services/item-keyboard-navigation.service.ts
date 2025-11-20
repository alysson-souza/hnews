// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { BaseCommentNavigationService } from './base-comment-navigation.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ItemKeyboardNavigationService extends BaseCommentNavigationService {
  private router = inject(Router);

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
  }

  /**
   * View the thread of the selected comment (navigate deeper)
   */
  override viewThreadSelected(): void {
    const selectedId = this.selectedCommentId();
    if (selectedId !== null) {
      // On item page, view thread might mean navigating to that comment as a root
      this.router.navigate(['/item', selectedId]);
    }
  }
}
