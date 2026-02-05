// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, output, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  solarAltArrowLeftLinear,
  solarMaximizeSquare3Linear,
  solarCloseCircleLinear,
} from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-sidebar-comments-header',
  imports: [RouterLink, NgIconComponent],
  viewProviders: [
    provideIcons({
      solarAltArrowLeftLinear,
      solarMaximizeSquare3Linear,
      solarCloseCircleLinear,
    }),
  ],
  template: `
    <div class="header" [class.mac-layout]="isMac()">
      <!-- macOS: Close button on left, back and open on right -->
      <!-- Windows/Linux: Back button on left, close and open on right -->
      @if (isMac()) {
        <!-- macOS Layout -->
        <div class="left-controls">
          <button
            type="button"
            (click)="dismiss.emit()"
            class="close-btn"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <ng-icon name="solarCloseCircleLinear" class="icon" />
          </button>
        </div>
        <h2 class="title">Comments</h2>
        <div class="right-controls">
          @if (canGoBack()) {
            <button
              type="button"
              (click)="back.emit()"
              class="back-btn"
              aria-label="Go back to previous view"
              title="Go back to previous view"
            >
              <ng-icon name="solarAltArrowLeftLinear" class="icon" />
            </button>
          }
          @if (itemId()) {
            <a
              [routerLink]="['/item', itemId()]"
              target="_blank"
              rel="noopener noreferrer"
              role="link"
              class="action-btn"
              aria-label="Open in full view"
              title="Open in full view"
            >
              <ng-icon name="solarMaximizeSquare3Linear" class="icon" />
            </a>
          }
        </div>
      } @else {
        <!-- Windows/Linux Layout -->
        <div class="left-controls">
          @if (canGoBack()) {
            <button
              type="button"
              (click)="back.emit()"
              class="back-btn"
              aria-label="Go back to previous view"
              title="Go back to previous view"
            >
              <ng-icon name="solarAltArrowLeftLinear" class="icon" />
            </button>
          }
        </div>
        <h2 class="title">Comments</h2>
        <div class="right-controls">
          @if (itemId()) {
            <a
              [routerLink]="['/item', itemId()]"
              target="_blank"
              rel="noopener noreferrer"
              role="link"
              class="action-btn"
              aria-label="Open in full view"
              title="Open in full view"
            >
              <ng-icon name="solarMaximizeSquare3Linear" class="icon" />
            </a>
          }
          <button
            type="button"
            (click)="dismiss.emit()"
            class="close-btn"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <ng-icon name="solarCloseCircleLinear" class="icon" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .header {
        @apply sticky top-0 z-10 p-3 sm:p-4 flex items-center justify-between gap-2;
        background-color: var(--app-surface);
        border-bottom: 1px solid var(--app-border);
        box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
      }
      .left-controls {
        @apply flex items-center gap-1;
      }
      .title {
        @apply text-lg sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 flex-1 text-center;
      }
      .right-controls {
        @apply flex items-center gap-1;
      }
      .back-btn {
        @apply p-1 sm:p-2 text-slate-600 dark:text-slate-300/80 rounded transition-colors cursor-pointer;
        @apply hover:text-brand dark:hover:text-blue-300;
        @apply hover:bg-slate-900/5 dark:hover:bg-white/5;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
        @apply flex items-center justify-center;
      }
      .action-btn {
        @apply p-1 sm:p-2 text-slate-600 dark:text-slate-300/80 rounded transition-colors cursor-pointer;
        @apply hover:text-brand dark:hover:text-blue-300;
        @apply hover:bg-slate-900/5 dark:hover:bg-white/5;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
        @apply flex items-center justify-center;
      }
      .close-btn {
        @apply p-1 sm:p-2 text-slate-600 dark:text-slate-300/80 rounded transition-colors cursor-pointer;
        @apply hover:text-brand dark:hover:text-blue-300;
        @apply hover:bg-slate-900/5 dark:hover:bg-white/5;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
        @apply flex items-center justify-center;
      }
      .icon {
        @apply w-5 h-5;
      }
    `,
  ],
})
export class SidebarCommentsHeaderComponent {
  readonly canGoBack = input(false);
  readonly itemId = input<number | undefined>(undefined);
  readonly dismiss = output<void>();
  readonly back = output<void>();

  isMac = computed(() => {
    return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  });
}
