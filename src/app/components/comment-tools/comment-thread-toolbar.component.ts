// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-comment-thread-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="comment-tools" aria-label="Comment tools">
      <button
        type="button"
        class="tool-btn"
        aria-label="Jump to next unread comment"
        (click)="nextUnread.emit()"
      >
        <span class="label-full">Next unread</span>
        <span class="label-short">Unread</span>
      </button>
      <button
        type="button"
        class="tool-btn"
        aria-label="Jump to next OP reply"
        (click)="nextOP.emit()"
      >
        <span class="label-full">Next OP</span>
        <span class="label-short">OP</span>
      </button>
      <button
        type="button"
        class="tool-btn"
        aria-label="Expand all visible comments"
        (click)="expandAll.emit()"
      >
        <span class="label-full">Expand all</span>
        <span class="label-short">Expand</span>
      </button>
      <button
        type="button"
        class="tool-btn"
        aria-label="Collapse all visible comments"
        (click)="collapseAll.emit()"
      >
        <span class="label-full">Collapse all</span>
        <span class="label-short">Collapse</span>
      </button>
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      :host {
        @apply block w-full max-w-full;
      }

      .comment-tools {
        @apply grid w-full grid-cols-4 items-center gap-1 overflow-visible;
        @apply [-webkit-overflow-scrolling:touch] [scrollbar-width:none];
      }

      .comment-tools::-webkit-scrollbar {
        display: none;
      }

      .tool-btn {
        @apply inline-flex min-w-0 items-center justify-center text-center;
        @apply rounded-lg border border-slate-200 dark:border-slate-700;
        @apply bg-white/70 dark:bg-slate-900/60;
        @apply px-2.5 py-1 text-xs font-medium whitespace-nowrap;
        @apply text-slate-600 dark:text-slate-300;
        @apply hover:border-blue-300 dark:hover:border-blue-600;
        @apply hover:text-blue-700 dark:hover:text-blue-300;
        @apply hover:bg-blue-50 dark:hover:bg-blue-950/30;
        @apply transition-colors duration-150;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
        @apply cursor-pointer;
      }

      .label-short {
        @apply hidden;
      }

      @media (max-width: 414px) {
        .tool-btn {
          @apply min-w-0 px-2 py-1 text-[0.8rem];
        }

        .label-full {
          @apply hidden;
        }

        .label-short {
          @apply inline;
        }
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
