// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, signal, HostListener, inject, computed } from '@angular/core';

import { KeyboardShortcutConfigService } from '../../services/keyboard-shortcut-config.service';
import { KeyboardContextService } from '../../services/keyboard-context.service';

@Component({
  selector: 'app-keyboard-shortcuts',
  standalone: true,
  imports: [],
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
                @if (contextLabel()) {
                  <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                    - {{ contextLabel() }}
                  </span>
                }
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
              @for (category of categories(); track category) {
                <div class="mb-6 last:mb-0">
                  <h3
                    class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3"
                  >
                    {{ category }}
                  </h3>
                  <div class="space-y-2">
                    @for (
                      shortcut of shortcutsByCategory().get(category);
                      track shortcut.key + shortcut.description
                    ) {
                      <div class="shortcut-row">
                        <kbd class="shortcut-key">{{ shortcut.label || shortcut.key }}</kbd>
                        <span class="shortcut-desc">{{ shortcut.description }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
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
  private shortcutConfig = inject(KeyboardShortcutConfigService);
  private keyboardContext = inject(KeyboardContextService);

  isOpen = signal(false);

  // Get current context for displaying relevant shortcuts
  currentContext = this.keyboardContext.currentContext;

  // Get shortcuts grouped by category for the current context
  shortcutsByCategory = computed(() => {
    return this.shortcutConfig.getShortcutsByCategory(this.currentContext());
  });

  // Get ordered list of categories
  categories = computed(() => {
    return this.shortcutConfig.getCategories(this.currentContext());
  });

  // Context label for the modal header
  contextLabel = computed(() => {
    const context = this.currentContext();
    if (context === 'sidebar') {
      return 'Comments Sidebar';
    }
    return null;
  });

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
