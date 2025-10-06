// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollService } from '../../../../services/scroll.service';

@Component({
  selector: 'app-header-brand',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex items-center flex-1 sm:flex-none">
      <a routerLink="/" (click)="scrollToTop()" class="flex items-center gap-2 sm:gap-3">
        <div class="app-logo-container">
          <svg class="app-logo-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3L3 10h4v7h6v-7h4L10 3z" />
          </svg>
        </div>
        <span class="text-white text-xl sm:text-2xl font-bold lg:hidden xl:inline">HNews</span>
      </a>
      @if (offline) {
        <span class="ml-2 sm:ml-3 px-2 py-1 bg-yellow-500 text-white text-xs rounded">Offline</span>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../../../styles.css';

      .app-logo-container {
        @apply bg-white dark:bg-slate-800 rounded p-2;
      }

      .app-logo-icon {
        @apply w-6 h-6 sm:w-8 sm:h-8;
        @apply text-blue-600 dark:text-blue-300;
      }
    `,
  ],
})
export class HeaderBrandComponent {
  @Input() offline = false;

  private router = inject(Router);
  private scrollService = inject(ScrollService);

  scrollToTop(): void {
    this.scrollService.scrollToTop();
  }
}
