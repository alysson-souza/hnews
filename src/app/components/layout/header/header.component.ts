// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderBrandComponent } from './brand/header-brand.component';
import { HeaderDesktopNavComponent } from './desktop-nav/header-desktop-nav.component';
import { HeaderDesktopSearchComponent } from './desktop-search/header-desktop-search.component';
import { HeaderMobileControlsComponent } from './mobile-controls/header-mobile-controls.component';
import { HeaderMobileSearchComponent } from './mobile-search/header-mobile-search.component';
import { HeaderMobileNavComponent } from './mobile-nav/header-mobile-nav.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    HeaderBrandComponent,
    HeaderDesktopNavComponent,
    HeaderDesktopSearchComponent,
    HeaderMobileControlsComponent,
    HeaderMobileSearchComponent,
    HeaderMobileNavComponent,
  ],
  template: `
    <header class="app-header" role="banner">
      <div class="max-w-5xl mx-auto px-2 sm:px-4">
        <div class="flex items-center h-16">
          <!-- Brand: always visible, left-aligned -->
          <div class="flex-shrink-0">
            <app-header-brand [offline]="offline"></app-header-brand>
          </div>

          <!-- Desktop spacer 1: creates left padding for centered nav -->
          <div class="hidden lg:block lg:flex-1"></div>

          <!-- Desktop nav: centered between two spacers -->
          <app-header-desktop-nav [routerUrl]="routerUrl"></app-header-desktop-nav>

          <!-- Desktop spacer 2: creates right padding for centered nav -->
          <div class="hidden lg:block lg:flex-1"></div>

          <!-- Desktop search: right-aligned -->
          <app-header-desktop-search
            [searchQuery]="searchQuery"
            (searchQueryChange)="searchQueryChange.emit($event)"
            (searchSubmit)="searchSubmit.emit()"
            (desktopSearchKeydown)="desktopSearchKeydown.emit($event)"
          ></app-header-desktop-search>

          <!-- Mobile controls: pushed to right on mobile -->
          <div class="flex-1 lg:hidden flex justify-end">
            <app-header-mobile-controls
              [mobileMenuOpen]="mobileMenuOpen"
              [showMobileSearch]="showMobileSearch"
              (menuToggleRequested)="menuToggleRequested.emit()"
              (searchToggleRequested)="searchToggleRequested.emit()"
            ></app-header-mobile-controls>
          </div>
        </div>

        @if (showMobileSearch) {
          <app-header-mobile-search
            [searchQuery]="searchQuery"
            (searchQueryChange)="searchQueryChange.emit($event)"
            (searchSubmit)="searchSubmit.emit()"
          ></app-header-mobile-search>
        }

        @if (mobileMenuOpen) {
          <app-header-mobile-nav
            (closeMenuRequested)="closeMenuRequested.emit()"
          ></app-header-mobile-nav>
        }
      </div>
    </header>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .app-header {
        @apply sticky top-0 z-40 shadow-lg;
        @apply bg-blue-600;
        @apply dark:bg-digg-blue;
      }

      @media (display-mode: standalone) {
        .app-header {
          padding-top: env(safe-area-inset-top, 0px);
        }
      }
    `,
  ],
})
export class AppHeaderComponent {
  @Input() offline = false;
  @Input() routerUrl = '';
  @Input() searchQuery = '';
  @Input() mobileMenuOpen = false;
  @Input() showMobileSearch = false;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<void>();
  @Output() desktopSearchKeydown = new EventEmitter<KeyboardEvent>();
  @Output() menuToggleRequested = new EventEmitter<void>();
  @Output() searchToggleRequested = new EventEmitter<void>();
  @Output() closeMenuRequested = new EventEmitter<void>();
}
