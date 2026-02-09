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
  selector: 'app-theme-selector',
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ solarSunLinear, solarMoonLinear, solarMonitorSmartphoneLinear })],
  template: `
    <div class="theme-selector">
      <h2 class="section-subtitle">Theme</h2>

      <div class="theme-options" role="radiogroup" aria-label="Theme selection">
        <label
          class="theme-option"
          [class.selected]="themeService.theme() === 'auto'"
          tabindex="0"
          (keydown.enter)="themeService.setTheme('auto')"
          (keydown.space)="themeService.setTheme('auto')"
        >
          <input
            type="radio"
            name="theme"
            [checked]="themeService.theme() === 'auto'"
            (change)="themeService.setTheme('auto')"
            class="sr-only"
            aria-label="Auto theme"
          />
          <span class="theme-label">
            <ng-icon name="solarMonitorSmartphoneLinear" class="text-xl" />
            <span class="ml-2 font-medium">Auto</span>
          </span>
        </label>

        <label
          class="theme-option"
          [class.selected]="themeService.theme() === 'light'"
          tabindex="0"
          (keydown.enter)="themeService.setTheme('light')"
          (keydown.space)="themeService.setTheme('light')"
        >
          <input
            type="radio"
            name="theme"
            [checked]="themeService.theme() === 'light'"
            (change)="themeService.setTheme('light')"
            class="sr-only"
            aria-label="Light theme"
          />
          <span class="theme-label">
            <ng-icon name="solarSunLinear" class="text-xl" />
            <span class="ml-2 font-medium">Light</span>
          </span>
        </label>

        <label
          class="theme-option"
          [class.selected]="themeService.theme() === 'dark'"
          tabindex="0"
          (keydown.enter)="themeService.setTheme('dark')"
          (keydown.space)="themeService.setTheme('dark')"
        >
          <input
            type="radio"
            name="theme"
            [checked]="themeService.theme() === 'dark'"
            (change)="themeService.setTheme('dark')"
            class="sr-only"
            aria-label="Dark theme"
          />
          <span class="theme-label">
            <ng-icon name="solarMoonLinear" class="text-xl" />
            <span class="ml-2 font-medium">Dark</span>
          </span>
        </label>
      </div>
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .theme-selector {
        @apply space-y-4;
      }

      .section-subtitle {
        @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4;
      }

      .theme-options {
        @apply grid grid-cols-1 sm:grid-cols-3 gap-3;
      }

      .theme-option {
        @apply flex items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200;
        @apply bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900;
      }

      .theme-option.selected {
        @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400;
      }

      .theme-option.selected .theme-label {
        @apply text-blue-700 dark:text-blue-300;
      }

      .theme-label {
        @apply text-gray-700 dark:text-gray-300 flex items-center gap-2;
      }
    `,
  ],
})
export class ThemeSelectorComponent {
  themeService = inject(ThemeService);
}
