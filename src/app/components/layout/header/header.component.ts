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

      @media (display-mode: standalone) {
        .app-header {
          padding-top: env(safe-area-inset-top, 0px);
          /* Remove top border to blend seamlessly with the notch area */
          border-top: none;
          /* Disable backdrop blur for PWA - it doesn't play nice with app background */
          backdrop-filter: none;
          /* Use more opaque backgrounds without blur */
          background-color: rgb(255 255 255 / 0.95);
        }

        :host-context(.dark) .app-header {
          background-color: rgb(15 23 42 / 0.95);
        }

        /* Solid background for safe area */
        .app-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: env(safe-area-inset-top, 0px);
          /* Light mode: solid white to match glass bg-white/95 appearance */
          background-color: white;
          z-index: -1;
        }

        /* Dark mode safe area background */
        :host-context(.dark) .app-header::before {
          /* Dark mode: slate-900 to match glass bg-slate-900/95 appearance */
          background-color: #0f172a;
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
