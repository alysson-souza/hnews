// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="theme-selector">
      <h2 class="section-subtitle">Select Theme</h2>

      <div class="theme-options">
        <label class="theme-option">
          <input
            type="radio"
            name="theme"
            [checked]="themeService.theme() === 'light'"
            (change)="themeService.setTheme('light')"
            class="theme-radio"
          />
          <span class="theme-label"> ☀️ Light Mode </span>
        </label>

        <label class="theme-option">
          <input
            type="radio"
            name="theme"
            [checked]="themeService.theme() === 'dark'"
            (change)="themeService.setTheme('dark')"
            class="theme-radio"
          />
          <span class="theme-label"> 🌙 Dark Mode </span>
        </label>

        <label class="theme-option">
          <input
            type="radio"
            name="theme"
            [checked]="themeService.theme() === 'auto'"
            (change)="themeService.setTheme('auto')"
            class="theme-radio"
          />
          <span class="theme-label"> 🔄 Auto (follows system preference) </span>
        </label>
      </div>

      <div class="theme-status">
        <p class="theme-status-text">
          Current theme: <strong>{{ themeService.theme() }}</strong>
          @if (themeService.theme() === 'auto') {
            (currently <strong>{{ themeService.effectiveTheme() }}</strong> based on system)
          }
        </p>
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
        @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
      }

      .theme-options {
        @apply space-y-3;
      }

      .theme-option {
        @apply flex items-center gap-3 cursor-pointer;
      }

      .theme-radio {
        @apply w-4 h-4 text-blue-600 focus:ring-blue-500;
      }

      .theme-label {
        @apply text-gray-700 dark:text-gray-300;
      }

      .theme-status {
        @apply mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg;
      }

      .theme-status-text {
        @apply text-sm text-gray-600 dark:text-gray-400;
      }
    `,
  ],
})
export class ThemeSelectorComponent {
  themeService = inject(ThemeService);
}
