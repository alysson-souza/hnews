// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, inject, output, model } from '@angular/core';

import { ThemeToggleComponent } from '../../../shared/theme-toggle/theme-toggle.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarMagniferLinear, solarKeyboardLinear } from '@ng-icons/solar-icons/linear';
import { CommandRegistryService } from '@services/command-registry.service';

@Component({
  selector: 'app-header-desktop-search',
  imports: [ThemeToggleComponent, NgIconComponent],
  viewProviders: [provideIcons({ solarMagniferLinear, solarKeyboardLinear })],
  template: `
    <div class="hidden lg:flex items-center gap-4">
      <div class="keyboard-hint-only">
        <button
          tabindex="0"
          (click)="commandRegistry.execute('global.showHelp')"
          class="shortcuts-button"
          aria-label="Show keyboard shortcuts"
          title="Keyboard Shortcuts (?)"
        >
          <ng-icon name="solarKeyboardLinear" />
        </button>
      </div>
      <app-theme-toggle />
      <form (submit)="$event.preventDefault(); onSubmit()" class="relative" role="search">
        <button
          type="submit"
          role="button"
          class="search-button"
          aria-label="Submit Search"
          [title]="'Search'"
        >
          <ng-icon name="solarMagniferLinear" class="text-xl" />
        </button>
        <input
          type="search"
          name="searchQuery"
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
          (keydown)="onKeydown($event)"
          placeholder="Search stories..."
          aria-label="Search Hacker News stories"
          aria-describedby="search-hint"
          [title]="'Search For Stories (Press / to focus)'"
          class="app-input app-input-sm search-input w-64 !pl-10"
        />
      </form>
    </div>
  `,
  styles: [
    `
      @reference '../../../../../styles.css';

      .keyboard-hint-only {
        display: none;
      }

      @media (hover: hover) and (pointer: fine) {
        .keyboard-hint-only {
          display: flex;
        }
      }

      .shortcuts-button {
        @apply p-2 rounded-lg transition-colors flex items-center;
        @apply text-gray-500 hover:bg-gray-100 hover:text-gray-900;
        @apply dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200;
        @apply cursor-pointer;
        @apply focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2;
      }

      .search-button {
        @apply absolute left-2 top-1/2 -translate-y-1/2;
        @apply flex items-center justify-center;
        @apply text-gray-500 dark:text-slate-400;
        @apply hover:text-gray-700 dark:hover:text-blue-400;
        @apply cursor-pointer;
      }
    `,
  ],
})
export class HeaderDesktopSearchComponent {
  readonly commandRegistry = inject(CommandRegistryService);
  readonly searchQuery = model('');
  readonly searchSubmit = output<void>();
  readonly desktopSearchKeydown = output<KeyboardEvent>();

  onSubmit(): void {
    this.searchSubmit.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    this.desktopSearchKeydown.emit(event);
  }
}
