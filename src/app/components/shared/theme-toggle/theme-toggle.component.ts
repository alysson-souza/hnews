// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="themeService.toggleTheme()"
      class="theme-toggle"
      [attr.aria-label]="'Switch to ' + themeService.getNextThemeLabel() + ' mode'"
      [title]="getTooltip()"
    >
      @if (themeService.effectiveTheme() === 'dark') {
        <!-- Sun Icon -->
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clip-rule="evenodd"
          />
        </svg>
      } @else {
        <!-- Moon Icon -->
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      }
      @if (themeService.theme() === 'auto') {
        <span class="ml-1 text-xs">A</span>
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
      }
    `,
  ],
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  getTooltip(): string {
    const current = this.themeService.theme();
    const effective = this.themeService.effectiveTheme();

    if (current === 'auto') {
      return `Auto mode (currently ${effective}). Click for light mode`;
    } else if (current === 'light') {
      return 'Light mode. Click for dark mode';
    } else {
      return 'Dark mode. Click for auto mode';
    }
  }
}
