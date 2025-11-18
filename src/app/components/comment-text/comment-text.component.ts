// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { transformQuotesHtml } from './quote.transform';
import { transformLinksToDomain } from './links.transform';
import { highlightCodeBlocks } from './code-highlight.transform';

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
        text-wrap: pretty;
      }
      .comment-body.dark {
        @apply prose-invert;
      }
      .comment-body > :first-child {
        margin-top: 0 !important;
      }

      /* Transformed external links inside comments */
      .comment-body a.ext-link {
        @apply text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 no-underline;
        font-size: 0.85em;
      }

      /* Code block syntax highlighting */
      .comment-body pre {
        @apply bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto;
      }
      .comment-body code {
        @apply font-mono text-xs sm:text-sm;
      }
      .comment-body pre code {
        @apply p-3 block;
      }

      /* Blockquote visual styles are defined globally in styles.css */
    `,
  ],
})
export class CommentTextComponent {
  private _html = '';
  private sanitizer = inject(DomSanitizer);
  processedHtml: SafeHtml = '';

  @Input()
  set html(value: string) {
    this._html = value || '';
    const withQuotes = transformQuotesHtml(this._html);
    const withLinks = transformLinksToDomain(withQuotes);
    const withHighlight = highlightCodeBlocks(withLinks);

    // Sanitize HTML to prevent XSS attacks while preserving formatting
    const sanitized = DOMPurify.sanitize(withHighlight, {
      ALLOWED_TAGS: ['p', 'blockquote', 'a', 'pre', 'code', 'br', 'i', 'em', 'b', 'strong', 'span'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
      KEEP_CONTENT: true,
    });

    this.processedHtml = this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }
  get html(): string {
    return this._html;
  }
}
