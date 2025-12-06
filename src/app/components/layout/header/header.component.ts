// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, input, output } from '@angular/core';

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
            <app-header-brand [offline]="offline()" />
          </div>

          <!-- Desktop spacer 1: creates left padding for centered nav -->
          <div class="hidden lg:block lg:flex-1"></div>

          <!-- Desktop nav: centered between two spacers -->
          <app-header-desktop-nav [routerUrl]="routerUrl()" />

          <!-- Desktop spacer 2: creates right padding for centered nav -->
          <div class="hidden lg:block lg:flex-1"></div>

          <!-- Desktop search: right-aligned -->
          <app-header-desktop-search
            [searchQuery]="searchQuery()"
            (searchQueryChange)="searchQueryChange.emit($event)"
            (searchSubmit)="searchSubmit.emit()"
            (desktopSearchKeydown)="desktopSearchKeydown.emit($event)"
          />

          <!-- Mobile controls: pushed to right on mobile -->
          <div class="flex-1 lg:hidden flex justify-end">
            <app-header-mobile-controls
              [mobileMenuOpen]="mobileMenuOpen()"
              [showMobileSearch]="showMobileSearch()"
              (menuToggleRequested)="menuToggleRequested.emit()"
              (searchToggleRequested)="searchToggleRequested.emit()"
            />
          </div>
        </div>

        @if (showMobileSearch()) {
          <app-header-mobile-search
            [searchQuery]="searchQuery()"
            (searchQueryChange)="searchQueryChange.emit($event)"
            (searchSubmit)="searchSubmit.emit()"
          />
        }

        @if (mobileMenuOpen()) {
          <app-header-mobile-nav (closeMenuRequested)="closeMenuRequested.emit()" />
        }
      </div>
    </header>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .app-header {
        @apply sticky top-0 z-40;
        @apply glass;
      }

      @media (max-width: 1023.98px) {
        .app-header {
          background-color: #155dfc;
          border-top-width: 0;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }

        :host-context(.dark) .app-header {
          background-color: #3b5998;
        }
      }

      @media (display-mode: standalone) {
        .app-header {
          padding-top: env(safe-area-inset-top, 0px);
          border-top-width: 0;
          background-color: #155dfc;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }

        .app-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: calc(env(safe-area-inset-top, 0px) + 1px);
          background-color: #155dfc;
          z-index: -1;
        }

        :host-context(.dark) .app-header::before {
          background-color: #3b5998;
        }

        :host-context(.dark) .app-header {
          background-color: #3b5998;
        }
      }
    `,
  ],
})
export class AppHeaderComponent {
  readonly offline = input(false);
  readonly routerUrl = input('');
  readonly searchQuery = input('');
  readonly mobileMenuOpen = input(false);
  readonly showMobileSearch = input(false);

  readonly searchQueryChange = output<string>();
  readonly searchSubmit = output<void>();
  readonly desktopSearchKeydown = output<KeyboardEvent>();
  readonly menuToggleRequested = output<void>();
  readonly searchToggleRequested = output<void>();
  readonly closeMenuRequested = output<void>();
}
