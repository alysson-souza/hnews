// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, ChangeDetectionStrategy, input, computed } from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { provideIcons } from '@ng-icons/core';
import { solarLinkLinear } from '@ng-icons/solar-icons/linear';
import { transformQuotesHtml } from './quote.transform';
import { highlightCodeBlocks } from './code-highlight.transform';
import { EnhanceLinksDirective } from './enhance-links.directive';

@Component({
  selector: 'app-comment-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EnhanceLinksDirective],
  viewProviders: [provideIcons({ solarLinkLinear })],
  template: ` <div class="comment-body" [innerHTML]="processedHtml()" appEnhanceLinks></div> `,
  styles: [
    `
      @reference '../../../styles.css';

      .comment-body {
        @apply prose prose-sm max-w-none text-gray-700 dark:text-slate-300 text-[15px] leading-7 tracking-normal text-pretty;
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
        @apply font-mono text-xs sm:text-sm text-gray-800 dark:text-slate-200;
      }
      .comment-body pre code {
        @apply p-4 block;
      }

      /* Blockquote visual styles are defined globally in styles.css */
    `,
  ],
})
export class CommentTextComponent {
  readonly html = input('');
  private sanitizer = inject(DomSanitizer);

  readonly processedHtml = computed(() => {
    const rawHtml = this.html() || '';
    const withQuotes = transformQuotesHtml(rawHtml);
    const withHighlight = highlightCodeBlocks(withQuotes);

    // Sanitize HTML to prevent XSS attacks while preserving formatting
    const sanitized = DOMPurify.sanitize(withHighlight, {
      ALLOWED_TAGS: ['p', 'blockquote', 'a', 'pre', 'code', 'br', 'i', 'em', 'b', 'strong', 'span'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
      KEEP_CONTENT: true,
    });

    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  });
}
