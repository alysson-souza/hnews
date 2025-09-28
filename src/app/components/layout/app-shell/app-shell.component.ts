// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineBannerComponent } from '../offline-banner/offline-banner.component';
import { AppHeaderComponent } from '../header/header.component';
import { AppFooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, OfflineBannerComponent, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-offline-banner [visible]="showOfflineBanner" [offline]="offline"></app-offline-banner>

    <app-header
      [offline]="offline"
      [showOfflineBanner]="showOfflineBanner"
      [routerUrl]="routerUrl"
      [searchQuery]="searchQuery"
      [mobileMenuOpen]="mobileMenuOpen"
      [showMobileSearch]="showMobileSearch"
      (searchQueryChange)="searchQueryChange.emit($event)"
      (searchSubmit)="searchSubmit.emit()"
      (desktopSearchKeydown)="desktopSearchKeydown.emit($event)"
      (menuToggleRequested)="menuToggleRequested.emit()"
      (searchToggleRequested)="searchToggleRequested.emit()"
      (closeMenuRequested)="closeMenuRequested.emit()"
    ></app-header>

    <main class="main-content" role="main" id="main-content">
      <ng-content select="[shellMain]"></ng-content>
    </main>

    <app-footer [commitShaShort]="commitShaShort" [commitUrl]="commitUrl"></app-footer>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .main-content {
        @apply min-h-screen;
        @apply bg-gray-50 dark:bg-blue-950;
      }
    `,
  ],
})
export class AppShellComponent {
  @Input() offline = false;
  @Input() showOfflineBanner = false;
  @Input() routerUrl = '';
  @Input() searchQuery = '';
  @Input() mobileMenuOpen = false;
  @Input() showMobileSearch = false;
  @Input() commitShaShort = '';
  @Input() commitUrl: string | null = null;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<void>();
  @Output() desktopSearchKeydown = new EventEmitter<KeyboardEvent>();
  @Output() menuToggleRequested = new EventEmitter<void>();
  @Output() searchToggleRequested = new EventEmitter<void>();
  @Output() closeMenuRequested = new EventEmitter<void>();
}
