// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, computed, signal, inject, effect } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { highlightCodeBlocks } from '../../components/comment-text/code-highlight.transform';
import { CardComponent } from '../../components/shared/card/card.component';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  solarCopyLinear,
  solarCheckCircleLinear,
  solarDownloadLinear,
} from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-userscript',
  imports: [CardComponent, PageContainerComponent, AppButtonComponent, NgIconComponent],
  viewProviders: [
    provideIcons({
      solarCopyLinear,
      solarCheckCircleLinear,
      solarDownloadLinear,
    }),
  ],
  templateUrl: './userscript.component.html',
  styles: [
    `
      @reference '../../../styles.css';

      /* ── Spacing scale (mirrors settings) ──
       * Tight:   2 (0.5rem)  — inline gaps, minor spacing
       * Base:    4 (1rem)    — row padding, standard margins, content gaps
       * Section: 6 (1.5rem)  — section insets (mobile), label-to-content
       * Wide:    8 (2rem)    — section insets (desktop)
       */

      /* Section layout */
      .us-section {
        @apply relative px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6;
      }

      .section-divider {
        @apply border-t border-gray-200 dark:border-gray-700/60 m-0;
      }

      .us-category-label {
        @apply text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4;
      }

      /* Code section header with action buttons */
      .us-code-header {
        @apply flex flex-col sm:flex-row sm:items-center justify-between gap-4;
      }

      .us-code-header .us-category-label {
        @apply mb-0;
      }

      .us-button-group {
        @apply flex flex-wrap items-center justify-center sm:justify-end gap-2;
      }

      .btn-primary {
        @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap border border-transparent;
        @apply bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm;
        @apply hover:from-blue-700 hover:to-blue-800 hover:shadow-md;
        @apply dark:from-blue-500 dark:to-blue-600;
        @apply dark:hover:from-blue-600 dark:hover:to-blue-700;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500;
        @apply dark:focus-visible:ring-offset-gray-800;
      }

      .info-text {
        @apply text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4;
      }

      .instructions-list {
        @apply space-y-3 pl-6;
        counter-reset: step-counter;
      }

      .instruction-item {
        @apply text-sm text-gray-700 dark:text-gray-300 relative;
      }

      .instruction-item::before {
        @apply absolute -left-6 font-semibold text-blue-600 dark:text-blue-400;
        counter-increment: step-counter;
        content: counter(step-counter) '.';
      }

      .code-block {
        @apply relative bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700/60 overflow-hidden mt-4 shadow-sm;
        max-height: 500px;
        overflow-y: auto;
      }

      .code-block ::ng-deep .hljs-highlighted {
        margin: 0;
        padding: 1rem !important;
      }

      .code-block ::ng-deep code.hljs {
        font-size: 0.625rem;
      }

      @media (min-width: 640px) {
        .code-block ::ng-deep code.hljs {
          font-size: 0.6875rem;
        }
      }

      .external-link {
        @apply text-blue-600 dark:text-blue-400 hover:underline;
      }

      .feature-list {
        @apply space-y-2;
      }

      .feature-item {
        @apply flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300;
      }

      .feature-icon {
        @apply text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5;
      }
    `,
  ],
})
export class UserscriptComponent {
  private sanitizer = inject(DomSanitizer);
  private copiedSignal = signal(false);
  isCopied = computed(() => this.copiedSignal());

  // Get the base URL of the app (for deployment flexibility)
  readonly baseUrl = computed(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      // Extract base path (e.g., /hnews/ from /hnews/userscript)
      const basePath = pathname.split('/').slice(0, -1).join('/') || '';
      return `${origin}${basePath}`;
    }
    return 'https://alysson-souza.github.io/hnews';
  });

  readonly installUrl = computed(() => {
    return `${this.baseUrl()}/hnews-redirect.user.js`;
  });

  readonly isLoading = signal(true);
  readonly userscriptContent = signal('');
  readonly highlightedUserscript = signal<SafeHtml>('');

  constructor() {
    // Fetch the actual generated file so preview and clipboard always match the download
    fetch(this.installUrl())
      .then((res) => res.text())
      .then((content) => {
        this.userscriptContent.set(content);
        this.isLoading.set(false);
      })
      .catch((err) => {
        console.error('Failed to load userscript:', err);
        this.isLoading.set(false);
      });

    effect(() => {
      const code = this.userscriptContent();
      if (!code) return;
      const html = `<pre><code class="language-javascript">${code}</code></pre>`;

      // Show unhighlighted code immediately
      this.highlightedUserscript.set(this.sanitizer.bypassSecurityTrustHtml(html));

      // Then apply syntax highlighting asynchronously
      highlightCodeBlocks(html).then((highlighted) => {
        this.highlightedUserscript.set(this.sanitizer.bypassSecurityTrustHtml(highlighted));
      });
    });
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.userscriptContent());
      this.copiedSignal.set(true);
      setTimeout(() => this.copiedSignal.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}
