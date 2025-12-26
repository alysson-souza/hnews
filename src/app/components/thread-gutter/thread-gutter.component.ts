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
        'thread-top-level': depth() === 0,
        collapsed: collapsed(),
      }"
      [attr.data-comment-id]="commentId()"
      role="treeitem"
      [attr.aria-level]="depth() + 1"
      [attr.aria-expanded]="clickable() ? !collapsed() : null"
      [attr.aria-selected]="isKeyboardFocused()"
      tabindex="-1"
    >
      <!-- Tree connector for nested comments -->
      @if (depth() > 0) {
        <div class="tree-connector" aria-hidden="true">
          <div class="tree-branch"></div>
        </div>
      }

      <!-- Wrapper for the comment itself (header + text) -->
      <div class="comment-node" [class.keyboard-focused]="isKeyboardFocused()">
        <div class="comment-bubble">
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
        @apply relative;
        --line-width: 2px;
        --line-color: rgb(209 213 219); /* gray-300 */
        --line-color-dark: rgb(71 85 105); /* slate-600 */
        --gutter-width: 20px;
        --branch-length: 12px;
      }

      /* Top-level comments: clean spacing without dividers */
      .thread-top-level {
        @apply mb-4;
      }

      /* Nested comments: tree structure with gutter lines */
      .thread-indent {
        @apply relative;
        margin-left: var(--gutter-width);
        padding-top: 8px;
      }

      /* Vertical trunk line connecting siblings */
      .thread-indent::before {
        content: '';
        position: absolute;
        left: calc(var(--gutter-width) * -1 + var(--line-width) / 2);
        top: 0;
        width: var(--line-width);
        height: 100%;
        background-color: var(--line-color);
        transition: background-color 200ms ease;
      }

      /* Dark mode line color */
      :host-context(.dark) .thread-indent::before {
        background-color: var(--line-color-dark);
      }

      /* Hide vertical line for last sibling (it shouldn't extend past itself) */
      .thread-indent:last-child::before {
        height: calc(var(--branch-length) + 8px);
      }

      /* Tree connector container */
      .tree-connector {
        position: absolute;
        left: calc(var(--gutter-width) * -1);
        top: 8px;
        width: var(--gutter-width);
        height: var(--branch-length);
        pointer-events: none;
      }

      /* Horizontal branch connecting to comment bubble */
      .tree-branch {
        position: absolute;
        top: 50%;
        left: calc(var(--line-width) / 2);
        width: calc(var(--gutter-width) - var(--line-width) / 2);
        height: var(--line-width);
        background-color: var(--line-color);
        transform: translateY(-50%);
        border-radius: 0 1px 1px 0;
      }

      :host-context(.dark) .tree-branch {
        background-color: var(--line-color-dark);
      }

      /* Comment bubble/card styling */
      .comment-bubble {
        @apply rounded-lg border transition-colors duration-150;
        @apply bg-gray-50/50 border-gray-200/80;
        @apply px-3 py-2;
      }

      :host-context(.dark) .comment-bubble {
        @apply bg-slate-800/40 border-slate-700/60;
      }

      /* Subtle hover effect on bubbles */
      .comment-bubble:hover {
        @apply bg-gray-50 border-gray-200;
      }

      :host-context(.dark) .comment-bubble:hover {
        @apply bg-slate-800/60 border-slate-700/80;
      }

      /* Collapsed state - dim the line */
      .thread-container.collapsed .thread-indent::before,
      .thread-container.collapsed .tree-branch {
        opacity: 0.4;
      }

      .header {
        @apply relative z-10;
      }

      /* Clickable header for comments */
      .clickable-header {
        cursor: pointer;
        transition: background-color 150ms ease;
        border-radius: 4px;
        margin: 0 -4px;
        padding: 0 4px;
      }

      .clickable-header:hover {
        background-color: rgba(59, 130, 246, 0.08);
      }

      :host-context(.dark) .clickable-header:hover {
        background-color: rgba(96, 165, 250, 0.1);
      }

      .clickable-header:focus-visible {
        outline: 2px solid rgb(59 130 246);
        outline-offset: 2px;
      }

      /* Keyboard focus indicator - highlight the bubble */
      .comment-node.keyboard-focused .comment-bubble {
        @apply ring-2 ring-blue-500 ring-offset-1;
      }

      :host-context(.dark) .comment-node.keyboard-focused .comment-bubble {
        @apply ring-blue-400 ring-offset-slate-900;
      }

      .content {
        @apply relative;
      }

      /* Children wrapper spacing */
      .children-wrapper {
        @apply mt-1;
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
