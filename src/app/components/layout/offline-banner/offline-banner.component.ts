// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div
        class="offline-banner"
        [class.offline-banner-yellow]="offline"
        [class.offline-banner-green]="!offline"
        role="status"
        [attr.aria-live]="offline ? 'polite' : 'assertive'"
      >
        <div
          class="container mx-auto px-4 py-2 text-center text-white font-medium text-sm sm:text-base"
        >
          @if (offline) {
            <span>You are offline</span>
          } @else {
            <span>Back online</span>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .offline-banner {
        @apply fixed top-0 left-0 right-0 z-50 transition-all duration-300;
      }

      @media (display-mode: standalone) {
        .offline-banner {
          --safe-area-top: env(safe-area-inset-top, 0px);
          top: var(--safe-area-top);
          padding-top: var(--safe-area-top);
        }
      }

      .offline-banner-yellow {
        @apply bg-yellow-500 dark:bg-yellow-600;
      }

      .offline-banner-green {
        @apply bg-green-500 dark:bg-green-600;
      }
    `,
  ],
})
export class OfflineBannerComponent {
  @Input() visible = false;
  @Input() offline = false;
}
