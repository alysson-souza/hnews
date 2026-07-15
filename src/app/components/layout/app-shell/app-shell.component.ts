// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, output, input } from '@angular/core';
import { RefreshStatus } from '@models/refresh';

import { AppHeaderComponent } from '../header/header.component';
import { AppFooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-shell',
  imports: [AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header
      [routerUrl]="routerUrl()"
      [searchQuery]="searchQuery()"
      [mobileMenuOpen]="mobileMenuOpen()"
      [showMobileSearch]="showMobileSearch()"
      [refreshStatus]="refreshStatus()"
      [canRefresh]="canRefresh()"
      (searchQueryChange)="searchQueryChange.emit($event)"
      (searchSubmit)="searchSubmit.emit()"
      (desktopSearchKeydown)="desktopSearchKeydown.emit($event)"
      (menuToggleRequested)="menuToggleRequested.emit()"
      (searchToggleRequested)="searchToggleRequested.emit()"
      (closeMenuRequested)="closeMenuRequested.emit()"
    />

    <main class="main-content" role="main" id="main-content">
      <ng-content select="[shellMain]" />
    </main>

    <app-footer [commitShaShort]="commitShaShort()" [commitUrl]="commitUrl()" />
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      :host {
        display: flex;
        flex-direction: column;
        min-height: calc(var(--vh, 1vh) * 100);
      }

      .main-content {
        flex: 1 0 auto;
        min-height: 0;
        padding-top: 4rem;
        background: transparent;
      }

      @media (display-mode: standalone) {
        .main-content {
          padding-top: calc(4rem + env(safe-area-inset-top, 0px));
        }
      }
    `,
  ],
})
export class AppShellComponent {
  readonly routerUrl = input('');
  readonly searchQuery = input('');
  readonly mobileMenuOpen = input(false);
  readonly showMobileSearch = input(false);
  readonly refreshStatus = input<RefreshStatus>('idle');
  readonly canRefresh = input(false);
  readonly commitShaShort = input('');
  readonly commitUrl = input<string | null>(null);

  readonly searchQueryChange = output<string>();
  readonly searchSubmit = output<void>();
  readonly desktopSearchKeydown = output<KeyboardEvent>();
  readonly menuToggleRequested = output<void>();
  readonly searchToggleRequested = output<void>();
  readonly closeMenuRequested = output<void>();
}
