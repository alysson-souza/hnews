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
      <!-- Wrapper for the comment itself (header + text) -->
      <div class="comment-node" [class.keyboard-focused]="isKeyboardFocused()">
        <div
          class="header"
          [class.clickable-header]="clickable()"
          [attr.role]="clickable() ? 'button' : null"
          [attr.tabindex]="clickable() ? '0' : null"
          [attr.aria-label]="
            clickable() ? (collapsed() ? 'Expand comment' : 'Collapse comment') : null
          "
          (click)="clickable() ? toggleThread.emit() : null"
          (keydown.enter)="clickable() ? toggleThread.emit() : null"
          (keydown.space)="
            clickable() ? toggleThread.emit() : null; clickable() ? $event.preventDefault() : null
          "
        >
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

      .thread-container {
        @apply relative mb-3;
        --line-width: 2px;
        --avatar-size: 32px;
        --header-height: 28px;
      }

      /* Top-level comment separator and background */
      .thread-container[aria-level='1'] {
        @apply mb-6 pb-6 border-b border-gray-200 dark:border-slate-700;
        @apply bg-gray-50/30 dark:bg-slate-800/20 rounded-lg p-3;
      }

      .thread-indent {
        @apply ml-2 sm:ml-4 pl-2 sm:pl-4 relative;
        border-left: none; /* Remove simple border, use ::before instead */
      }

      /* Enhanced vertical thread line - contiguous without gaps */
      .thread-indent::before {
        content: '';
        position: absolute;
        left: 0;
        top: -6px; /* Start 6px above to connect with previous comment */
        width: var(--line-width);
        height: calc(100% + 6px); /* Total: extends 6px above, stops at content baseline */
        background-color: rgb(209 213 219); /* gray-300 - more visible */
        transition:
          background-color 200ms ease,
          opacity 200ms ease;
      }

      /* Dark mode line color - more visible */
      :host-context(.dark) .thread-indent::before {
        background-color: rgb(71 85 105); /* slate-600 - more visible */
      }

      /* Collapsed state - dim the line */
      .thread-container.collapsed .thread-indent::before {
        opacity: 0.5;
      }

      .header {
        @apply relative z-10;
      }

      /* Clickable header for top-level comments */
      .clickable-header {
        cursor: pointer;
        transition: background-color 150ms ease;
        border-radius: 4px;
        margin: 0 -4px;
        padding: 0 4px;
      }

      .clickable-header:hover {
        background-color: rgba(59, 130, 246, 0.05);
      }

      :host-context(.dark) .clickable-header:hover {
        background-color: rgba(96, 165, 250, 0.08);
      }

      .clickable-header:focus-visible {
        outline: 2px solid rgb(59 130 246);
        outline-offset: 2px;
      }

      /* Keyboard focus indicator */
      .comment-node.keyboard-focused {
        @apply relative;
      }

      .comment-node.keyboard-focused::after {
        content: '';
        position: absolute;
        inset: -4px;
        border: 2px solid rgb(59 130 246); /* blue-500 */
        border-radius: 6px;
        pointer-events: none;
        z-index: 1;
        transition: opacity 200ms ease;
      }

      :host-context(.dark) .comment-node.keyboard-focused::after {
        border-color: rgb(96 165 250); /* blue-400 */
      }

      .content {
        @apply relative;
      }
    `,
  ],
})
export class ThreadGutterComponent {
  readonly depth = input(0);
  readonly clickable = input(true);
  readonly collapsed = input(false);
  readonly commentId = input<number>();
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
