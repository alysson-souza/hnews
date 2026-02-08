// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, HostListener, signal, inject } from '@angular/core';

import { ScrollService } from '../../../services/scroll.service';

@Component({
  selector: 'app-scroll-to-top',
  imports: [],
  template: `
    @if (isVisible()) {
      <button
        (click)="scrollToTop()"
        class="scroll-to-top-btn fixed bottom-6 left-6 z-50 group cursor-pointer"
        aria-label="Scroll To Top"
        aria-controls="main-content"
        title="Scroll To Top"
      >
        <div
          class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600/90 dark:bg-blue-700/90 backdrop-blur-sm border border-blue-400/20 dark:border-blue-500/20 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 15l7-7 7 7"
            ></path>
          </svg>
          <span class="text-sm font-medium text-white">Top</span>
        </div>
      </button>
    }

    <style>
      .scroll-to-top-btn:focus-visible {
        outline: 2px solid rgb(59 130 246);
        outline-offset: 3px;
        border-radius: 0.375rem;
      }

      .scroll-to-top-btn:active > div {
        transform: scale(0.95);
      }

      @media (display-mode: standalone) {
        .scroll-to-top-btn {
          inset-block-end: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);
          inset-inline-start: calc(env(safe-area-inset-left, 0px) + 1.5rem);
        }
      }
    </style>
  `,
})
export class ScrollToTopComponent {
  isVisible = signal(false);

  private scrollService = inject(ScrollService);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollPosition =
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isVisible.set(scrollPosition > 300);
  }

  scrollToTop() {
    this.scrollService.scrollToTop();
  }
}
