// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, output, model } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ThemeToggleComponent } from '../../../shared/theme-toggle/theme-toggle.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarMagniferLinear } from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-header-desktop-search',
  standalone: true,
  imports: [FormsModule, ThemeToggleComponent, NgIconComponent],
  viewProviders: [provideIcons({ solarMagniferLinear })],
  template: `
    <div class="hidden lg:flex items-center gap-4">
      <app-theme-toggle />
      <form (ngSubmit)="onSubmit()" class="relative" role="search">
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
          [(ngModel)]="searchQuery"
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
