// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ScrollService } from '../../../services/scroll.service';

@Component({
  selector: 'app-nav-link',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <a
      [routerLink]="route"
      routerLinkActive="nav-link-active"
      [class]="getLinkClasses()"
      [attr.aria-current]="isActive ? 'page' : null"
      (click)="handleClick()"
    >
      <ng-content></ng-content>
    </a>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .nav-link {
        @apply text-gray-600 dark:text-gray-300 px-3 py-2 rounded-md font-medium text-sm;
        @apply hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-slate-800 dark:hover:text-white;
        @apply transition-all cursor-pointer;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }

      .nav-link-active {
        @apply bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400;
      }

      .nav-link-mobile {
        @apply block text-gray-700 dark:text-gray-200 px-4 py-3 transition-colors font-medium;
        @apply hover:bg-gray-50 dark:hover:bg-slate-800;
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
