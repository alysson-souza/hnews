// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, HostListener, signal, inject } from '@angular/core';

import { ScrollService } from '@services/scroll.service';
import { AppButtonComponent } from '@components/shared/app-button/app-button.component';

@Component({
  selector: 'app-scroll-to-top',
  imports: [AppButtonComponent],
  template: `
    @if (isVisible()) {
      <div class="scroll-to-top-btn fixed bottom-6 left-6 z-50">
        <app-button (clicked)="scrollToTop()" variant="primary" size="sm" ariaLabel="Scroll To Top">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 15l7-7 7 7"
            ></path>
          </svg>
          <span class="scroll-to-top-label">Top</span>
        </app-button>
      </div>
    }

    <style>
      @media (display-mode: standalone) {
        .scroll-to-top-btn {
          inset-block-end: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);
          inset-inline-start: calc(env(safe-area-inset-left, 0px) + 1.5rem);
        }
      }

      /* Mobile: icon-only circle */
      @media (max-width: 1024px) {
        .scroll-to-top-label {
          display: none;
        }
      }

      /* Landscape mobile: tighter positioning */
      @media (orientation: landscape) and (max-height: 500px) {
        .scroll-to-top-btn {
          bottom: 0.5rem;
          left: 0.5rem;
        }
      }

      @media (display-mode: standalone) and (orientation: landscape) and (max-height: 500px) {
        .scroll-to-top-btn {
          left: calc(env(safe-area-inset-left, 0px) + 0.375rem);
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
