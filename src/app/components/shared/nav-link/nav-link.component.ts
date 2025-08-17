// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
    >
      <ng-content></ng-content>
    </a>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .nav-link {
        @apply text-white px-4 py-2 rounded;
        @apply hover:bg-blue-800 dark:hover:bg-blue-800;
        @apply transition-colors cursor-pointer;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white;
      }

      .nav-link-active {
        @apply bg-blue-800 dark:bg-blue-800;
      }

      .nav-link-mobile {
        @apply block text-white px-4 py-3 transition-colors;
        @apply hover:bg-blue-800 dark:hover:bg-blue-800;
      }
    `,
  ],
})
export class NavLinkComponent {
  @Input() route = '';
  @Input() mobile = false;
  @Input() isActive = false;

  getLinkClasses(): string {
    return this.mobile ? 'nav-link-mobile' : 'nav-link';
  }
}
