// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-thread-gutter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="thread-container group"
      [ngClass]="{
        'thread-indent': depth > 0,
        collapsed: collapsed,
      }"
      role="treeitem"
      [attr.aria-level]="depth + 1"
      [attr.aria-expanded]="clickable ? !collapsed : null"
      aria-selected="false"
      tabindex="-1"
    >
      <div
        class="header"
        [class.clickable-header]="clickable"
        [attr.role]="clickable ? 'button' : null"
        [attr.tabindex]="clickable ? '0' : null"
        [attr.aria-label]="clickable ? (collapsed ? 'Expand comment' : 'Collapse comment') : null"
        (click)="clickable ? toggleThread.emit() : null"
        (keydown.enter)="clickable ? toggleThread.emit() : null"
        (keydown.space)="
          clickable ? toggleThread.emit() : null; clickable ? $event.preventDefault() : null
        "
      >
        <ng-content select="[header]"></ng-content>
      </div>
      <div class="content relative">
        <div role="group">
          <ng-content select="[body]"></ng-content>
        </div>
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

      .thread-indent {
        @apply ml-2 sm:ml-4 pl-2 sm:pl-4 relative;
        border-left: none; /* Remove simple border, use ::before instead */
      }

      /* Enhanced vertical thread line - contiguous without gaps */
      .thread-indent::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: var(--line-width);
        height: calc(100% + 12px); /* Extend to bridge gap between comments */
        background-color: rgb(209 213 219); /* gray-300 */
        transition:
          background-color 200ms ease,
          opacity 200ms ease;
      }

      /* Dark mode line color */
      :host-context(.dark) .thread-indent::before {
        background-color: rgb(71 85 105); /* slate-600 */
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

      .content {
        @apply relative;
      }
    `,
  ],
})
export class ThreadGutterComponent {
  @Input() depth = 0;
  @Input() clickable = true;
  @Input() collapsed = false;
  @Output() toggleThread = new EventEmitter<void>();
}
