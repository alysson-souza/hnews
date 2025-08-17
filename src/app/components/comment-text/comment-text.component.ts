// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comment-text',
  standalone: true,
  imports: [CommonModule],
  template: ` <div class="comment-body" [innerHTML]="html"></div> `,
  styles: [
    `
      @reference '../../../styles.css';

      .comment-body {
        @apply prose prose-sm max-w-none text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 text-sm sm:text-base;
      }
      .comment-body.dark {
        @apply prose-invert;
      }
      .comment-body > :first-child {
        margin-top: 0 !important;
      }
      .comment-body a {
        @apply text-blue-600 dark:text-blue-300 underline hover:text-blue-800 dark:hover:text-blue-200;
      }
    `,
  ],
})
export class CommentTextComponent {
  @Input() html = '';
}
