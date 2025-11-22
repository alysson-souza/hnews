// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, output, input } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  solarMagniferLinear,
  solarHamburgerMenuLinear,
  solarCloseCircleLinear,
} from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-header-mobile-controls',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [
    provideIcons({ solarMagniferLinear, solarHamburgerMenuLinear, solarCloseCircleLinear }),
  ],
  template: `
    <div class="flex items-center gap-2 lg:hidden">
      <button
        type="button"
        role="button"
        (click)="onToggleSearch()"
        class="mobile-menu-button"
        [attr.aria-expanded]="showMobileSearch()"
        aria-label="Toggle Search"
      >
        <ng-icon name="solarMagniferLinear" class="text-2xl" />
      </button>

      <button
        type="button"
        role="button"
        (click)="onToggleMenu()"
        class="mobile-menu-button"
        [attr.aria-expanded]="mobileMenuOpen()"
        aria-label="Toggle Menu"
      >
        @if (mobileMenuOpen()) {
          <ng-icon name="solarCloseCircleLinear" class="text-2xl" />
        } @else {
          <ng-icon name="solarHamburgerMenuLinear" class="text-2xl" />
        }
      </button>
    </div>
  `,
  styles: [
    `
      @reference '../../../../../styles.css';

      .mobile-menu-button {
        @apply p-2 text-gray-600 dark:text-slate-300 rounded-lg transition-colors;
        @apply hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-slate-800 dark:hover:text-white;
        @apply cursor-pointer flex items-center justify-center;
      }
    `,
  ],
})
export class HeaderMobileControlsComponent {
  readonly mobileMenuOpen = input(false);
  readonly showMobileSearch = input(false);
  readonly menuToggleRequested = output<void>();
  readonly searchToggleRequested = output<void>();

  onToggleMenu(): void {
    this.menuToggleRequested.emit();
  }

  onToggleSearch(): void {
    this.searchToggleRequested.emit();
  }
}
