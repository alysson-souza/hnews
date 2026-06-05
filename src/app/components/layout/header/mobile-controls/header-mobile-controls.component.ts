// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, inject, output, input } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { CommandRegistryService } from '@services/command-registry.service';
import {
  solarMagniferLinear,
  solarHamburgerMenuLinear,
  solarCloseCircleLinear,
  solarRefreshLinear,
} from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-header-mobile-controls',
  imports: [NgIconComponent],
  viewProviders: [
    provideIcons({
      solarMagniferLinear,
      solarHamburgerMenuLinear,
      solarCloseCircleLinear,
      solarRefreshLinear,
    }),
  ],
  template: `
    <div class="flex items-center gap-2 lg:hidden">
      @if (canRefresh()) {
        <button
          type="button"
          role="button"
          (click)="onRefreshApp()"
          [disabled]="refreshing()"
          class="mobile-menu-button pwa-refresh-button"
          [attr.aria-label]="refreshing() ? 'Refreshing app' : 'Refresh app'"
          [attr.aria-busy]="refreshing()"
          [title]="refreshing() ? 'Refreshing app' : 'Refresh app'"
        >
          <ng-icon name="solarRefreshLinear" class="text-2xl" [class.animate-spin]="refreshing()" />
        </button>
      }

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
        @apply p-2 rounded-lg transition-colors;
        @apply text-slate-700 hover:text-slate-900;
        @apply dark:text-slate-200 dark:hover:text-white;
        @apply hover:bg-slate-900/5 dark:hover:bg-white/5;
        @apply cursor-pointer flex items-center justify-center;
      }

      .mobile-menu-button:disabled {
        @apply cursor-wait opacity-70;
      }

      .pwa-refresh-button {
        display: none;
      }

      @media (display-mode: standalone) {
        .pwa-refresh-button {
          display: flex;
        }
      }
    `,
  ],
})
export class HeaderMobileControlsComponent {
  readonly commandRegistry = inject(CommandRegistryService);
  readonly mobileMenuOpen = input(false);
  readonly showMobileSearch = input(false);
  readonly refreshing = input(false);
  readonly canRefresh = input(false);
  readonly menuToggleRequested = output<void>();
  readonly searchToggleRequested = output<void>();

  onToggleMenu(): void {
    this.menuToggleRequested.emit();
  }

  onToggleSearch(): void {
    this.searchToggleRequested.emit();
  }

  onRefreshApp(): Promise<void> {
    return this.commandRegistry.execute('story.refresh');
  }
}
