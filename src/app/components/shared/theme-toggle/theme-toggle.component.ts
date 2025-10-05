// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSun, faMoon, faCircleHalfStroke } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <button
      (click)="themeService.toggleTheme()"
      class="theme-toggle"
      [attr.aria-label]="'Switch to ' + themeService.getNextThemeLabel() + ' mode'"
      [title]="getTooltip()"
    >
      @if (themeService.theme() === 'auto') {
        <fa-icon [icon]="faCircleHalfStroke"></fa-icon>
      } @else if (themeService.effectiveTheme() === 'dark') {
        <fa-icon [icon]="faMoon"></fa-icon>
      } @else {
        <fa-icon [icon]="faSun"></fa-icon>
      }
    </button>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .theme-toggle {
        @apply p-2 rounded-lg transition-colors flex items-center;
        @apply text-white hover:bg-blue-800;
        @apply dark:text-white dark:hover:bg-blue-800;
        @apply cursor-pointer;
      }
    `,
  ],
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
  // Use public fields to ensure AOT/templates always see defined icon inputs in tests
  faSun = faSun;
  faMoon = faMoon;
  faCircleHalfStroke = faCircleHalfStroke;

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
