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
        @apply prose prose-sm max-w-none text-gray-700 dark:text-gray-300 text-[15px] leading-7 tracking-normal;
        text-wrap: pretty;
      }
      .comment-body.dark {
        @apply prose-invert;
      }
      .comment-body > :first-child {
        margin-top: 0 !important;
      }
      .comment-body p {
        margin-bottom: 0.75em;
      }

      /* Transformed external links inside comments */
      .comment-body a.ext-link {
        @apply text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline decoration-2 underline-offset-2 transition-colors;
      }

      /* Code block syntax highlighting */
      .comment-body pre {
        @apply bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700/60 overflow-x-auto my-4 shadow-sm;
      }
      .comment-body code {
        @apply font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200;
      }
      .comment-body pre code {
        @apply p-4 block;
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
