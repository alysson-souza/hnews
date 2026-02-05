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
        @apply fixed top-0 left-0 right-0 z-40;
        @apply glass;
        /* Crisp edge so glass doesn't feel floaty */
        border-bottom-color: var(--app-border);
      }

      .app-header::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 2px;
        pointer-events: none;
        opacity: 0.55;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(21, 93, 252, 0.85),
          rgba(59, 89, 152, 0.65),
          transparent
        );
      }

      @media (display-mode: standalone) {
        .app-header {
          padding-top: env(safe-area-inset-top, 0px);
        }

        .app-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: calc(env(safe-area-inset-top, 0px) + 1px);
          background-color: rgb(255 255 255 / 0.92);
          z-index: -1;
        }

        :host-context(.dark) .app-header::before {
          background-color: rgb(2 6 23 / 0.92);
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
