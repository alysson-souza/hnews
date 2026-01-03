// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, computed, output, input } from '@angular/core';

import { SidebarKeyboardNavigationService } from '../../services/sidebar-keyboard-navigation.service';
import { ItemKeyboardNavigationService } from '../../services/item-keyboard-navigation.service';

@Component({
  selector: 'app-thread-gutter',
  template: `
    <div
      class="thread-container group"
      [class]="{
        'thread-indent': depth() > 0,
        collapsed: collapsed(),
      }"
      [attr.data-comment-id]="commentId()"
      role="treeitem"
      [attr.aria-level]="depth() + 1"
      [attr.aria-expanded]="clickable() ? !collapsed() : null"
      [attr.aria-selected]="isKeyboardFocused()"
      tabindex="-1"
    >
      <!-- Tree connector (T or L shape based on isLastChild) - always clickable -->
      @if (depth() > 0) {
        <button
          type="button"
          class="tree-connector"
          [class.connector-T]="!isLastChild()"
          [class.connector-L]="isLastChild()"
          [class.has-previous-sibling]="!isFirstChild()"
          (click)="toggleThread.emit()"
          [attr.aria-label]="collapsed() ? 'Expand comment' : 'Collapse comment'"
          [attr.aria-expanded]="!collapsed()"
        ></button>
      }

      <!-- Comment card -->
      <div
        class="comment-card"
        [class.keyboard-focused]="isKeyboardFocused()"
        [class.collapsed]="collapsed()"
      >
        <div class="header">
          <ng-content select="[header]" />
        </div>
        <div class="content relative">
          <div role="group">
            <ng-content select="[body]" />
          </div>
        </div>
      </div>

      <!-- Children/Replies -->
      <div class="children-wrapper">
        <ng-content select="[children]" />
      </div>
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      :host {
        display: block;
      }

      .thread-container {
        @apply relative;
      }

      .children-wrapper {
        @apply relative;
        display: flow-root; /* Prevent margin collapse */
      }

      .header {
        @apply relative z-10;
      }

      .content {
        @apply relative;
      }

      /* Keyboard focus ring for comment card */
      .comment-card.keyboard-focused {
        box-shadow:
          0 0 0 2px rgb(59 130 246),
          0 0 0 4px rgba(59, 130, 246, 0.2);
        border-color: rgb(59 130 246);
      }

      :host-context(.dark) .comment-card.keyboard-focused {
        box-shadow:
          0 0 0 2px rgb(96 165 250),
          0 0 0 4px rgba(96, 165, 250, 0.2);
        border-color: rgb(96 165 250);
      }
    `,
  ],
})
export class ThreadGutterComponent {
  readonly depth = input(0);
  readonly clickable = input(true);
  readonly collapsed = input(false);
  readonly commentId = input<number>();
  readonly hasChildren = input(false);
  readonly isLastChild = input(true);
  readonly isFirstChild = input(true);
  readonly toggleThread = output<void>();

  private sidebarKeyboardNav = inject(SidebarKeyboardNavigationService);
  private itemKeyboardNav = inject(ItemKeyboardNavigationService);

  // Check if this comment is keyboard-focused
  isKeyboardFocused = computed(() => {
    const commentId = this.commentId();
    if (!commentId) return false;
    return (
      this.sidebarKeyboardNav.isSelected()(commentId) ||
      this.itemKeyboardNav.isSelected()(commentId)
    );
  });
}
