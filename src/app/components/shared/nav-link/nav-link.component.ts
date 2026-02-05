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
        @apply text-slate-600 dark:text-slate-300/80 px-3 py-1.5 rounded-full font-medium text-sm;
        @apply hover:text-brand dark:hover:text-blue-300;
        @apply transition-colors duration-200 cursor-pointer;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }

      .nav-link-active {
        @apply text-brand dark:text-blue-300;
      }

      .nav-link-mobile {
        @apply block px-4 py-3 transition-colors font-medium;
        @apply text-slate-800 dark:text-slate-100;
        @apply border-l-4 border-transparent;
        @apply hover:bg-slate-900/5 dark:hover:bg-white/5;
      }

      .nav-link-mobile.nav-link-active {
        @apply border-brand;
        @apply text-slate-900 dark:text-white;
        background-color: rgba(21, 93, 252, 0.1);
      }

      :host-context(.dark) .nav-link-mobile.nav-link-active {
        background-color: rgba(21, 93, 252, 0.18);
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
