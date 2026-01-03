// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-comment-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="thread-container" [class.thread-indent]="depth() > 0">
      <div class="comment-card skeleton">
        <div class="h-4 bg-gray-300 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
        <div class="h-3 bg-gray-300 dark:bg-slate-700 rounded w-3/4"></div>
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
    `,
  ],
})
export class CommentSkeletonComponent {
  readonly depth = input(0);
}
