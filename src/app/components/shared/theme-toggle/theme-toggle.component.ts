// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject } from '@angular/core';

import { ThemeService } from '../../../services/theme.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  solarSunLinear,
  solarMoonLinear,
  solarMonitorSmartphoneLinear,
} from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ solarSunLinear, solarMoonLinear, solarMonitorSmartphoneLinear })],
  template: `
    <button
      (click)="themeService.toggleTheme()"
      class="theme-toggle"
      [attr.aria-label]="'Switch to ' + themeService.getNextThemeLabel() + ' mode'"
      [title]="getTooltip()"
    >
      @if (themeService.theme() === 'auto') {
        <ng-icon name="solarMonitorSmartphoneLinear" />
      } @else if (themeService.effectiveTheme() === 'dark') {
        <ng-icon name="solarMoonLinear" />
      } @else {
        <ng-icon name="solarSunLinear" />
      }
    </button>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .theme-toggle {
        @apply p-2 rounded-lg transition-colors flex items-center;
        @apply text-gray-500 hover:bg-gray-100 hover:text-gray-900;
        @apply dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200;
        @apply cursor-pointer;
      }
    `,
  ],
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  getTooltip(): string {
    const current = this.themeService.theme();
    if (current === 'auto') {
      return 'Auto Mode. Click For Light Mode';
    } else if (current === 'light') {
      return 'Light Mode. Click For Dark Mode';
    } else {
      return 'Dark Mode. Click For Auto Mode';
    }
  }
}
