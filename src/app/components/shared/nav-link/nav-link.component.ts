// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
      (click)="handleClick($event)"
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

  private router = inject(Router);
  private scrollService = inject(ScrollService);

  handleClick(event: MouseEvent): void {
    // Always scroll to top when any navigation tab is clicked
    event.preventDefault();
    this.scrollService.scrollToTop();

    // Navigate to the target route after scrolling
    const targetUrl = this.route.startsWith('/') ? this.route : '/' + this.route;
    this.router.navigateByUrl(targetUrl);
  }

  getLinkClasses(): string {
    return this.mobile ? 'nav-link-mobile' : 'nav-link';
  }
}
