// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header-mobile-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lg:hidden py-3 px-4 border-t border-blue-800">
      <form (ngSubmit)="onSubmit()" class="relative" role="search">
        <input
          type="search"
          name="mobileSearchQuery"
          [ngModel]="searchQuery"
          (ngModelChange)="onQueryChange($event)"
          placeholder="Search stories..."
          aria-label="Search Hacker News stories"
          aria-describedby="search-hint"
          class="app-input app-input-sm search-input-mobile w-full pr-10"
        />
        <button
          type="submit"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
          aria-label="Submit Search"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
})
export class HeaderMobileSearchComponent {
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

  onSubmit(): void {
    this.searchSubmit.emit();
  }

  onQueryChange(value: string): void {
    this._searchQuery = value;
    this.searchQueryChange.emit(value);
  }
}
