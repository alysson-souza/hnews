// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, input } from '@angular/core';

import { RouterLink } from '@angular/router';
import { ScrollService } from '../../../../services/scroll.service';

@Component({
  selector: 'app-header-brand',
  imports: [RouterLink],
  template: `
    <div class="flex items-center">
      <a routerLink="/" (click)="scrollToTop()" class="flex items-center gap-2 sm:gap-3 p-2 lg:p-0">
        <div class="app-logo-container">
          <svg class="app-logo-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3L3 10h4v7h6v-7h4L10 3z" />
          </svg>
        </div>
        <span
          class="text-slate-900 dark:text-slate-50 text-xl sm:text-2xl font-bold lg:hidden xl:inline"
          >HNews</span
        >
      </a>
      @if (offline()) {
        <span class="ml-2 sm:ml-3 px-2 py-1 bg-yellow-500 text-white text-xs rounded">Offline</span>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../../../styles.css';

      .app-logo-container {
        @apply bg-gradient-to-br from-digg-blue-light to-digg-blue-dark rounded-xl p-2;
        box-shadow: 0 10px 24px rgba(21, 93, 252, 0.22);
        position: relative;
      }

      .app-logo-container::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 0.75rem;
        pointer-events: none;
        background: radial-gradient(
          80px 50px at 30% 18%,
          rgba(255, 255, 255, 0.35),
          transparent 60%
        );
        mix-blend-mode: soft-light;
      }

      .app-logo-icon {
        @apply w-6 h-6 sm:w-7 sm:h-7;
        @apply text-white;
      }
    `,
  ],
})
export class HeaderBrandComponent {
  readonly offline = input(false);

  private scrollService = inject(ScrollService);

  scrollToTop(): void {
    this.scrollService.scrollToTop();
  }
}
