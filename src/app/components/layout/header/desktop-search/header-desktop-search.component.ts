// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeToggleComponent } from '../../../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-header-desktop-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemeToggleComponent],
  template: `
    <div class="hidden lg:flex items-center gap-4">
      <app-theme-toggle></app-theme-toggle>
      <form (ngSubmit)="onSubmit()" class="relative" role="search">
        <input
          type="search"
          name="searchQuery"
          [ngModel]="searchQuery"
          (ngModelChange)="onQueryChange($event)"
          (keydown)="onKeydown($event)"
          placeholder="Search stories..."
          aria-label="Search Hacker News stories"
          aria-describedby="search-hint"
          [title]="'Search For Stories (Press / to focus)'"
          class="app-input app-input-sm search-input w-64 pr-10"
        />
        <button type="submit" class="search-button" aria-label="Submit Search" [title]="'Search'">
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      @reference '../../../../../styles.css';

      .search-button {
        @apply absolute right-2 top-2.5;
        @apply text-gray-500 dark:text-blue-300;
        @apply hover:text-gray-700 dark:hover:text-blue-200;
        @apply cursor-pointer;
      }
    `,
  ],
})
export class HeaderDesktopSearchComponent {
  private _searchQuery = '';

  @Input()
  set searchQuery(value: string) {
    this._searchQuery = value ?? '';
  }

  get searchQuery(): string {
    return this._searchQuery;
  }

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<void>();
  @Output() desktopSearchKeydown = new EventEmitter<KeyboardEvent>();

  onSubmit(): void {
    this.searchSubmit.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    this.desktopSearchKeydown.emit(event);
  }

  onQueryChange(value: string): void {
    this._searchQuery = value;
    this.searchQueryChange.emit(value);
  }
}
