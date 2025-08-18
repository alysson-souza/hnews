// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../services/theme.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSun, faMoon, faCircleHalfStroke } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="theme-selector">
      <h2 class="section-subtitle">Theme</h2>

      <div class="theme-options" role="radiogroup" aria-label="Theme selection">
        <label class="theme-option">
          <input
            type="radio"
            name="theme"
            [checked]="themeService.theme() === 'auto'"
            (change)="themeService.setTheme('auto')"
            class="theme-radio"
            aria-label="Auto theme"
          />
          <span class="theme-label">
            <fa-icon [icon]="faCircleHalfStroke"></fa-icon>
            <span class="ml-2">Auto (system)</span>
          </span>
        </label>

        <label class="theme-option">
          <input
            type="radio"
            name="theme"
            [checked]="themeService.theme() === 'light'"
            (change)="themeService.setTheme('light')"
            class="theme-radio"
            aria-label="Light theme"
          />
          <span class="theme-label">
            <fa-icon [icon]="faSun"></fa-icon>
            <span class="ml-2">Light</span>
          </span>
        </label>

        <label class="theme-option">
          <input
            type="radio"
            name="theme"
            [checked]="themeService.theme() === 'dark'"
            (change)="themeService.setTheme('dark')"
            class="theme-radio"
            aria-label="Dark theme"
          />
          <span class="theme-label">
            <fa-icon [icon]="faMoon"></fa-icon>
            <span class="ml-2">Dark</span>
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

      /* Removed redundant status block */
    `,
  ],
})
export class ThemeSelectorComponent {
  themeService = inject(ThemeService);
  protected faSun = faSun;
  protected faMoon = faMoon;
  protected faCircleHalfStroke = faCircleHalfStroke;
}
