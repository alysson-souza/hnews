// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, input } from '@angular/core';

import { RouterLink } from '@angular/router';
import { ScrollService } from '../../../../services/scroll.service';

@Component({
  selector: 'app-header-brand',
  standalone: true,
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
          class="text-gray-900 dark:text-white text-xl sm:text-2xl font-bold lg:hidden xl:inline"
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
        @apply bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 rounded-xl p-2 shadow-lg shadow-blue-500/20;
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
