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
      [ngClass]="depth > 0 ? 'thread-indent' : ''"
      role="treeitem"
      [attr.aria-level]="depth + 1"
      [attr.aria-expanded]="clickable ? !collapsed : null"
      aria-selected="false"
      tabindex="-1"
    >
      <div class="header">
        <ng-content select="[header]"></ng-content>
      </div>
      <div class="content relative">
        @if (clickable) {
          <button
            type="button"
            class="thread-overlay"
            (click)="toggleThread.emit()"
            [ngClass]="depth > 0 ? '-left-2 sm:-left-4' : 'left-0'"
            [attr.aria-label]="collapsed ? 'Expand Thread' : 'Collapse Thread'"
            [attr.aria-expanded]="!collapsed"
            title="Toggle Thread"
          ></button>
        }
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
      }
      .thread-indent {
        @apply ml-2 sm:ml-4 border-l-2 border-gray-200 dark:border-slate-700 pl-2 sm:pl-4 transition-colors;
      }
      .thread-indent:hover {
        @apply border-blue-300 dark:border-blue-500;
      }
      .thread-overlay {
        @apply absolute top-0 h-full w-3 sm:w-5 cursor-pointer bg-transparent hover:bg-blue-50/30 dark:hover:bg-slate-700/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }
      .header {
        @apply relative z-10;
      }
      .content {
        @apply relative pt-1;
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
