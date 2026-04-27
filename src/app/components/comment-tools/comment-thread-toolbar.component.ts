// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-comment-thread-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="comment-tools" aria-label="Comment tools">
      <button type="button" class="tool-btn" (click)="nextUnread.emit()">Next unread</button>
      <button type="button" class="tool-btn" (click)="nextOP.emit()">Next OP</button>
      <button type="button" class="tool-btn" (click)="expandAll.emit()">Expand all</button>
      <button type="button" class="tool-btn" (click)="collapseAll.emit()">Collapse all</button>
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .comment-tools {
        @apply flex flex-wrap items-center gap-1;
      }

      .tool-btn {
        @apply rounded-lg border border-slate-200 dark:border-slate-700;
        @apply bg-white/70 dark:bg-slate-900/60;
        @apply px-2.5 py-1 text-xs font-medium;
        @apply text-slate-600 dark:text-slate-300;
        @apply hover:border-blue-300 dark:hover:border-blue-600;
        @apply hover:text-blue-700 dark:hover:text-blue-300;
        @apply hover:bg-blue-50 dark:hover:bg-blue-950/30;
        @apply transition-colors duration-150;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
        @apply cursor-pointer;
      }
    `,
  ],
})
export class CommentThreadToolbarComponent {
  readonly nextUnread = output<void>();
  readonly nextOP = output<void>();
  readonly expandAll = output<void>();
  readonly collapseAll = output<void>();
}
