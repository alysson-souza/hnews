// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, output, model } from '@angular/core';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarMagniferLinear } from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-header-mobile-search',
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ solarMagniferLinear })],
  template: `
    <div class="lg:hidden py-3 px-4 border-t border-gray-200 dark:border-slate-700">
      <form (submit)="$event.preventDefault(); onSubmit()" class="relative" role="search">
        <button
          type="submit"
          role="button"
          class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 flex items-center justify-center cursor-pointer"
          aria-label="Submit Search"
        >
          <ng-icon name="solarMagniferLinear" class="text-xl" />
        </button>
        <input
          type="search"
          name="mobileSearchQuery"
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
          placeholder="Search stories..."
          aria-label="Search Hacker News stories"
          aria-describedby="search-hint"
          class="app-input app-input-sm search-input-mobile w-full !pl-10"
        />
      </form>
    </div>
  `,
})
export class HeaderMobileSearchComponent {
  readonly searchQuery = model('');
  readonly searchSubmit = output<void>();

  onSubmit(): void {
    this.searchSubmit.emit();
  }
}
