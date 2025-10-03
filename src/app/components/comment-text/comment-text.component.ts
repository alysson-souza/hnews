// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { transformQuotesHtml } from './quote.transform';
import { transformLinksToDomain } from './links.transform';

@Component({
  selector: 'app-comment-text',
  standalone: true,
  imports: [CommonModule],
  template: ` <div class="comment-body" [innerHTML]="processedHtml"></div> `,
  styles: [
    `
      @reference '../../../styles.css';

      .comment-body {
        @apply prose prose-sm max-w-none text-gray-800 dark:text-gray-200 text-sm sm:text-base;
      }
      .comment-body.dark {
        @apply prose-invert;
      }
      .comment-body > :first-child {
        margin-top: 0 !important;
      }

      /* Transformed external links inside comments */
      .comment-body a.ext-link {
        /* Use Tailwind tokens and force smaller size to win over prose defaults */
        @apply text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 underline;
        font-size: 0.75rem !important; /* ~text-xs */
        line-height: 1.15rem !important;
      }

      /* Blockquote visual styles are defined globally in styles.css */
    `,
  ],
})
export class CommentTextComponent {
  private _html = '';
  processedHtml = '';

  @Input()
  set html(value: string) {
    this._html = value || '';
    const withQuotes = transformQuotesHtml(this._html);
    this.processedHtml = transformLinksToDomain(withQuotes);
  }
  get html(): string {
    return this._html;
  }
}
