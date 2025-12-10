// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, computed, signal, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { highlightCodeBlocks } from '../../components/comment-text/code-highlight.transform';
import { CardComponent } from '../../components/shared/card/card.component';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { SectionTitleComponent } from '../../components/shared/section-title/section-title.component';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  solarCodeLinear,
  solarCopyLinear,
  solarCheckCircleLinear,
  solarDownloadLinear,
  solarDocumentLinear,
  solarLinkLinear,
} from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-userscript',
  standalone: true,
  imports: [
    CardComponent,
    PageContainerComponent,
    SectionTitleComponent,
    AppButtonComponent,
    NgIconComponent,
  ],
  viewProviders: [
    provideIcons({
      solarCodeLinear,
      solarCopyLinear,
      solarCheckCircleLinear,
      solarDownloadLinear,
      solarDocumentLinear,
      solarLinkLinear,
    }),
  ],
  templateUrl: './userscript.component.html',
  styles: [
    `
      @reference '../../../styles.css';

      .section-header {
        @apply flex items-center gap-3 mb-6;
      }

      .section-icon {
        @apply text-lg text-gray-500 dark:text-gray-400 flex-shrink-0 inline-flex items-center justify-center;
      }

      .info-section {
        @apply space-y-4;
      }

      .info-text {
        @apply text-gray-700 dark:text-gray-300 leading-relaxed;
      }

      .instructions-list {
        @apply space-y-3 my-4 pl-6;
        counter-reset: step-counter;
      }

      .instruction-item {
        @apply text-gray-700 dark:text-gray-300 relative;
      }

      .instruction-item::before {
        @apply absolute -left-6 font-semibold text-blue-600 dark:text-blue-400;
        counter-increment: step-counter;
        content: counter(step-counter) '.';
      }

      .code-block {
        @apply relative bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700/60 overflow-hidden my-4 shadow-sm;
        max-height: 500px;
        overflow-y: auto;
      }

      .code-block ::ng-deep .hljs-highlighted {
        margin: 0;
        padding: 1rem !important;
      }

      @media (min-width: 640px) {
        .code-block ::ng-deep code.hljs {
          font-size: 0.875rem;
        }
      }

      .section-header-wrapper {
        @apply flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6;
      }

      .section-header-wrapper .section-header {
        @apply mb-0;
      }

      .section-header {
        @apply flex items-center gap-3 mb-6;
      }

      .button-group {
        @apply flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto;
      }

      .responsive-btn {
        @apply w-full sm:w-auto;
      }

      .responsive-btn ::ng-deep button {
        @apply w-full sm:w-auto justify-center;
      }

      .external-link {
        @apply text-blue-600 dark:text-blue-400 hover:underline;
      }

      .warning-box {
        @apply p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30 mb-4;
      }

      .feature-list {
        @apply space-y-2 my-4;
      }

      .feature-item {
        @apply flex items-start gap-3 text-gray-700 dark:text-gray-300;
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

  readonly userscriptContent = computed(() => {
    const baseUrl = this.baseUrl();
    return `// ==UserScript==
// @name         HNews Redirect
// @namespace    https://github.com/alysson-souza/hnews
// @version      1.0.0
// @description  Automatically redirect Hacker News to HNews alternative frontend
// @author       Alysson Souza
// @match        https://news.ycombinator.com/*
// @icon         https://news.ycombinator.com/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const BASE_URL = '${baseUrl}';
    const currentUrl = window.location.href;
    const hnUrl = 'https://news.ycombinator.com';

    // Parse the current HN URL and convert to HNews URL
    const url = new URL(currentUrl);
    const pathname = url.pathname;
    const search = url.search;

    // Map HN routes to HNews routes
    let newPath = pathname;
    let newSearch = '';

    // Handle item pages: /item?id=123 -> /item/123
    if (pathname === '/item' && search) {
        const params = new URLSearchParams(search);
        const id = params.get('id');
        if (id) {
            newPath = \`/item/\${id}\`;
        }
    }
    // Handle user pages: /user?id=username -> /user/username
    else if (pathname === '/user' && search) {
        const params = new URLSearchParams(search);
        const id = params.get('id');
        if (id) {
            newPath = \`/user/\${id}\`;
        }
    }
    // Handle story list pages
    else if (pathname === '/news' || pathname === '/') {
        newPath = '/top';
    } else if (pathname === '/newest') {
        newPath = '/newest';
    } else if (pathname === '/best') {
        newPath = '/best';
    } else if (pathname === '/ask') {
        newPath = '/ask';
    } else if (pathname === '/show') {
        newPath = '/show';
    } else if (pathname === '/jobs') {
        newPath = '/jobs';
    }

    // Redirect to HNews
    const hnewsUrl = \`\${BASE_URL}\${newPath}\${newSearch}\`;
    window.location.replace(hnewsUrl);
})();`;
  });

  readonly highlightedUserscript = computed(() => {
    const code = this.userscriptContent();
    const html = `<pre><code class="language-javascript">${code}</code></pre>`;
    const highlighted = highlightCodeBlocks(html);
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  });

  readonly installUrl = computed(() => {
    return `${this.baseUrl()}/hnews-redirect.user.js`;
  });

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
