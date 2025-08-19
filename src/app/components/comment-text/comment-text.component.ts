// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { transformQuotesHtml } from './quote.transform';

@Component({
  selector: 'app-comment-text',
  standalone: true,
  imports: [CommonModule],
  template: ` <div class="comment-body" [innerHTML]="processedHtml"></div> `,
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
    this.processedHtml = transformQuotesHtml(this._html);
  }
  get html(): string {
    return this._html;
  }
}
