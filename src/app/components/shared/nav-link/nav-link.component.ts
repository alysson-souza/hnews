// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, inject } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';
import { ScrollService } from '../../../services/scroll.service';

@Component({
  selector: 'app-nav-link',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a
      [routerLink]="route"
      routerLinkActive="nav-link-active"
      [class]="getLinkClasses()"
      [attr.aria-current]="isActive ? 'page' : null"
      (click)="handleClick()"
    >
      <ng-content />
    </a>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .nav-link {
        @apply text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full font-medium text-sm;
        @apply hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400;
        @apply transition-all duration-200 cursor-pointer;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }

      .nav-link-active {
        @apply bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/50;
      }

      .nav-link-mobile {
        @apply block text-gray-600 dark:text-gray-300 px-4 py-3 transition-colors font-medium border-l-4 border-transparent;
        @apply hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400;
      }

      .nav-link-mobile.nav-link-active {
        @apply border-blue-500 bg-blue-50/50 dark:bg-slate-800 text-blue-600 dark:text-blue-400;
      }
    `,
  ],
})
export class NavLinkComponent {
  @Input() route = '';
  @Input() mobile = false;
  @Input() isActive = false;

  private scrollService = inject(ScrollService);

  handleClick(): void {
    this.scrollService.scrollToTop();
  }

  getLinkClasses(): string {
    return this.mobile ? 'nav-link-mobile' : 'nav-link';
  }
}
