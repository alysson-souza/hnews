// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="app-footer" role="contentinfo">
      <div class="container mx-auto px-4">
        <div class="text-center">
          <p class="footer-text">
            HNews —
            <a
              href="https://news.ycombinator.com"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-link"
              >Hacker News</a
            >
            Reader
          </p>
          <p class="footer-subtext">
            Built with
            <a
              href="https://angular.io"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-link"
              >Angular</a
            >
            &amp;
            <a
              href="https://tailwindcss.com"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-link"
              >Tailwind CSS</a
            >
            | Data from the
            <a
              href="https://github.com/HackerNews/API"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-link"
              >Official HN API</a
            >
            &amp;
            <a
              href="https://hn.algolia.com"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-link"
              >Algolia API</a
            >
          </p>
          <p class="footer-subtext">
            Version
            @if (commitUrl) {
              <a
                [href]="commitUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="footer-link"
                aria-label="View current commit on GitHub"
              >
                {{ commitShaShort }}
              </a>
            } @else {
              <span>{{ commitShaShort }}</span>
            }
          </p>
        </div>
      </div>
      <a
        href="https://github.com/alysson-souza/hnews"
        target="_blank"
        rel="noopener noreferrer"
        class="absolute top-1/2 -translate-y-1/2 right-4 text-gray-200 hover:text-white dark:text-blue-100 dark:hover:text-white transition-colors"
        aria-label="View Source Code On GitHub"
        title="View On GitHub"
      >
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clip-rule="evenodd"
          />
        </svg>
      </a>
    </footer>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .app-footer {
        @apply bg-gray-800 dark:bg-gradient-to-r dark:from-digg-blue-dark dark:to-digg-blue;
        @apply text-white py-8 mt-12 relative;
      }

      .footer-text {
        @apply text-sm;
      }

      .footer-subtext {
        @apply text-xs mt-2;
        @apply text-gray-400 dark:text-blue-200;
      }

      .footer-link {
        @apply underline decoration-dotted decoration-1 underline-offset-4;
        @apply text-gray-200 hover:text-white dark:text-blue-100 dark:hover:text-white;
      }
    `,
  ],
})
export class AppFooterComponent {
  @Input() commitShaShort = '';
  @Input() commitUrl: string | null = null;
}
