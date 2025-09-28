// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-mobile-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2 lg:hidden">
      <button
        (click)="onToggleSearch()"
        class="mobile-menu-button"
        [attr.aria-expanded]="showMobileSearch"
        aria-label="Toggle Search"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </button>

      <button
        (click)="onToggleMenu()"
        class="mobile-menu-button"
        [attr.aria-expanded]="mobileMenuOpen"
        aria-label="Toggle Menu"
      >
        @if (mobileMenuOpen) {
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        } @else {
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        }
      </button>
    </div>
  `,
  styles: [
    `
      @reference '../../../../../styles.css';

      .mobile-menu-button {
        @apply p-2 text-white rounded-lg transition-colors;
        @apply hover:bg-blue-800 dark:hover:bg-blue-800;
      }
    `,
  ],
})
export class HeaderMobileControlsComponent {
  @Input() mobileMenuOpen = false;
  @Input() showMobileSearch = false;
  @Output() menuToggleRequested = new EventEmitter<void>();
  @Output() searchToggleRequested = new EventEmitter<void>();

  onToggleMenu(): void {
    this.menuToggleRequested.emit();
  }

  onToggleSearch(): void {
    this.searchToggleRequested.emit();
  }
}
