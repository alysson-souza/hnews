// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, input } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';
import { ScrollService } from '../../../services/scroll.service';

@Component({
  selector: 'app-nav-link',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a
      [routerLink]="route()"
      routerLinkActive="nav-link-active"
      [class]="getLinkClasses()"
      [attr.aria-current]="isActive() ? 'page' : null"
      (click)="handleClick()"
    >
      <ng-content />
    </a>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .nav-link {
        @apply relative z-10;
        @apply text-gray-500 dark:text-slate-400 px-3 py-1.5 rounded-full font-medium text-sm;
        @apply hover:text-blue-600 dark:hover:text-blue-400;
        @apply transition-colors duration-200 cursor-pointer;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }

      .nav-link-active {
        @apply text-blue-600 dark:text-blue-400;
      }

      .nav-link-mobile {
        @apply block text-white/90 dark:text-slate-100 px-4 py-3 transition-colors font-medium border-l-4 border-transparent;
        @apply hover:bg-white/10 dark:hover:bg-black/30 hover:text-white dark:hover:text-white;
      }

      .nav-link-mobile.nav-link-active {
        @apply border-white/80 bg-white/10 text-white dark:text-white;
      }
    `,
  ],
})
export class NavLinkComponent {
  readonly route = input('');
  readonly mobile = input(false);
  readonly isActive = input(false);

  private scrollService = inject(ScrollService);

  handleClick(): void {
    this.scrollService.scrollToTop();
  }

  getLinkClasses(): string {
    return this.mobile() ? 'nav-link-mobile' : 'nav-link';
  }
}
