// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
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
    <div class="theme-segmented" role="radiogroup" aria-label="Theme selection">
      <label
        class="theme-segment"
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
        <ng-icon name="solarMonitorSmartphoneLinear" class="segment-icon" />
        <span class="segment-label">Auto</span>
      </label>

      <label
        class="theme-segment"
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
        <ng-icon name="solarSunLinear" class="segment-icon" />
        <span class="segment-label">Light</span>
      </label>

      <label
        class="theme-segment"
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
        <ng-icon name="solarMoonLinear" class="segment-icon" />
        <span class="segment-label">Dark</span>
      </label>
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .theme-segmented {
        @apply inline-flex max-w-full gap-1 p-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800;
        @apply shadow-[inset_0_1px_3px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_3px_rgb(0_0_0/0.3)];
      }

      .theme-segment {
        @apply flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg cursor-pointer select-none;
        @apply text-gray-500 dark:text-gray-400;
        @apply hover:text-gray-700 dark:hover:text-gray-300;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }

      .theme-segment.selected {
        @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm;
      }

      .segment-icon {
        @apply text-base;
      }

      .segment-label {
        @apply text-sm font-medium;
      }
    `,
  ],
})
export class ThemeSelectorComponent {
  themeService = inject(ThemeService);
}
