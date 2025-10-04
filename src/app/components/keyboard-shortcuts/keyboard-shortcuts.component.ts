// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PwaUpdateService } from '../../services/pwa-update.service';

@Component({
  selector: 'app-keyboard-shortcuts',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <!-- Backdrop with fade-in -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fade-in"
        (click)="close()"
        (keydown.enter)="close()"
        (keydown.space)="close()"
        role="button"
        tabindex="0"
        aria-label="Close dialog"
      >
        <!-- Dialog centered with fade-in and scale -->
        <div class="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div
            class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-fade-in-scale"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
            role="dialog"
            aria-labelledby="shortcuts-title"
            aria-modal="true"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700"
            >
              <h2
                id="shortcuts-title"
                class="text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                Keyboard Shortcuts
              </h2>
              <button
                (click)="close()"
                (keydown.enter)="close()"
                (keydown.space)="close()"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none p-1 cursor-pointer"
                role="button"
                tabindex="0"
                aria-label="Close keyboard shortcuts dialog"
              >
                ×
              </button>
            </div>

            <!-- Content -->
            <div class="px-6 py-4 overflow-y-auto">
              <!-- Context-specific shortcuts -->
              @if (isOnStoryList) {
                <!-- Story List Navigation -->
                <div class="mb-6">
                  <h3
                    class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3"
                  >
                    Navigation
                  </h3>
                  <div class="space-y-2">
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">j</kbd>
                      <span class="shortcut-desc">Next story</span>
                    </div>
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">k</kbd>
                      <span class="shortcut-desc">Previous story</span>
                    </div>
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">h</kbd>
                      <span class="shortcut-desc">Previous tab</span>
                    </div>
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">l</kbd>
                      <span class="shortcut-desc">Next tab</span>
                    </div>
                  </div>
                </div>

                <!-- Story Actions -->
                <div class="mb-6">
                  <h3
                    class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3"
                  >
                    Story Actions
                  </h3>
                  <div class="space-y-2">
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">o</kbd>
                      <span class="shortcut-desc">Open story</span>
                    </div>
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">c</kbd>
                      <span class="shortcut-desc">Open comments in sidebar</span>
                    </div>
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">Shift+C</kbd>
                      <span class="shortcut-desc">Open comments page</span>
                    </div>
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">r</kbd>
                      <span class="shortcut-desc">Refresh stories</span>
                    </div>
                  </div>
                </div>
              }

              @if (isOnItemPage) {
                <!-- Item Page Navigation -->
                <div class="mb-6">
                  <h3
                    class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3"
                  >
                    Navigation
                  </h3>
                  <div class="space-y-2">
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">Esc</kbd>
                      <span class="shortcut-desc">Go back to stories</span>
                    </div>
                  </div>
                </div>
              }

              @if (isOnUserPage) {
                <!-- User Page Navigation -->
                <div class="mb-6">
                  <h3
                    class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3"
                  >
                    Navigation
                  </h3>
                  <div class="space-y-2">
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">Esc</kbd>
                      <span class="shortcut-desc">Go to top of page</span>
                    </div>
                  </div>
                </div>
              }

              <!-- Always available -->
              <div>
                <h3
                  class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3"
                >
                  General
                </h3>
                <div class="space-y-2">
                  <div class="shortcut-row">
                    <kbd class="shortcut-key">/</kbd>
                    <span class="shortcut-desc">Search</span>
                  </div>
                  <div class="shortcut-row">
                    <kbd class="shortcut-key">t</kbd>
                    <span class="shortcut-desc">Toggle theme</span>
                  </div>
                  @if (updateAvailable()) {
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">R</kbd>
                      <span class="shortcut-desc">Apply app update</span>
                    </div>
                  }
                  <div class="shortcut-row">
                    <kbd class="shortcut-key">?</kbd>
                    <span class="shortcut-desc">Show help</span>
                  </div>
                  @if (!isOnItemPage && !isOnUserPage) {
                    <div class="shortcut-row">
                      <kbd class="shortcut-key">Esc</kbd>
                      <span class="shortcut-desc">Close / Clear / Top</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .shortcut-row {
        @apply flex items-center gap-3;
      }

      .shortcut-key {
        @apply inline-block min-w-[2.5rem] px-2 py-1 text-center text-sm font-mono;
        @apply bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600;
        @apply rounded text-gray-800 dark:text-gray-200;
      }

      .shortcut-desc {
        @apply text-gray-700 dark:text-gray-300;
      }
    `,
  ],
})
export class KeyboardShortcutsComponent {
  private router = inject(Router);
  private pwaUpdate = inject(PwaUpdateService);
  isOpen = signal(false);

  // Expose update available signal to template
  updateAvailable = this.pwaUpdate.updateAvailable;

  get isOnStoryList(): boolean {
    const path = this.router.url;
    return ['/', '/top', '/best', '/newest', '/ask', '/show', '/jobs'].some(
      (p) => path === p || path.startsWith(p + '?'),
    );
  }

  get isOnItemPage(): boolean {
    return this.router.url.includes('/item/');
  }

  get isOnUserPage(): boolean {
    const path = this.router.url;
    return path.startsWith('/user/') || path === '/user' || path.startsWith('/user?');
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.stopPropagation();
      event.preventDefault();
      this.close();
    }
  }
}
