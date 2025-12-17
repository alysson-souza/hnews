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
        @apply relative mb-4;
        --line-width: 3px;
        --avatar-size: 32px;
        --header-height: 28px;
      }

      /* Top-level comment separator */
      .thread-container:not(.thread-indent) {
        @apply pb-4;
      }

      .thread-container:not(.thread-indent)::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgb(229 231 235) 10%,
          rgb(229 231 235) 90%,
          transparent 100%
        );
      }

      :host-context(.dark) .thread-container:not(.thread-indent)::after {
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgb(51 65 85) 10%,
          rgb(51 65 85) 90%,
          transparent 100%
        );
      }

      .thread-indent {
        @apply ml-3 sm:ml-5 pl-3 sm:pl-4 relative;
        border-left: none; /* Remove simple border, use ::before instead */
      }

      /* Enhanced vertical thread line - contiguous without gaps */
      .thread-indent::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: var(--line-width);
        height: calc(100% + 16px); /* Extend to bridge gap between comments */
        border-radius: 2px;
        transition:
          background-color 200ms ease,
          opacity 200ms ease;
      }

      /* Depth-based thread line colors for visual hierarchy */
      .thread-indent::before {
        background-color: rgb(191 219 254); /* blue-200 */
      }

      .thread-indent .thread-indent::before {
        background-color: rgb(196 181 253); /* violet-200 */
      }

      .thread-indent .thread-indent .thread-indent::before {
        background-color: rgb(253 186 116); /* orange-200 */
      }

      .thread-indent .thread-indent .thread-indent .thread-indent::before {
        background-color: rgb(134 239 172); /* green-200 */
      }

      .thread-indent .thread-indent .thread-indent .thread-indent .thread-indent::before {
        background-color: rgb(252 165 165); /* red-200 */
      }

      /* Dark mode line colors */
      :host-context(.dark) .thread-indent::before {
        background-color: rgb(30 58 138); /* blue-900 */
      }

      :host-context(.dark) .thread-indent .thread-indent::before {
        background-color: rgb(76 29 149); /* violet-900 */
      }

      :host-context(.dark) .thread-indent .thread-indent .thread-indent::before {
        background-color: rgb(124 45 18); /* orange-900 */
      }

      :host-context(.dark) .thread-indent .thread-indent .thread-indent .thread-indent::before {
        background-color: rgb(20 83 45); /* green-900 */
      }

      :host-context(.dark)
        .thread-indent
        .thread-indent
        .thread-indent
        .thread-indent
        .thread-indent::before {
        background-color: rgb(127 29 29); /* red-900 */
      }

      /* Collapsed state - dim the line */
      .thread-container.collapsed .thread-indent::before {
        opacity: 0.4;
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

      /* Subtle hover effect on comment node */
      .comment-node {
        @apply rounded-lg transition-colors duration-150;
        padding: 4px 8px;
        margin: -4px -8px;
      }

      .comment-node:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }

      :host-context(.dark) .comment-node:hover {
        background-color: rgba(255, 255, 255, 0.02);
      }

      /* Don't apply hover when keyboard focused (already has border) */
      .comment-node.keyboard-focused:hover {
        background-color: transparent;
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
