// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, output } from '@angular/core';

import { NavLinkComponent } from '../../../shared/nav-link/nav-link.component';

@Component({
  selector: 'app-header-mobile-nav',
  imports: [NavLinkComponent],
  template: `
    <nav
      class="lg:hidden py-2 border-t border-gray-200 dark:border-slate-700"
      role="navigation"
      aria-label="Mobile Navigation"
    >
      <app-nav-link route="/top" [mobile]="true" (click)="onClose()"> Top </app-nav-link>
      <app-nav-link route="/best" [mobile]="true" (click)="onClose()"> Best </app-nav-link>
      <app-nav-link route="/newest" [mobile]="true" (click)="onClose()"> Newest </app-nav-link>
      <app-nav-link route="/ask" [mobile]="true" (click)="onClose()"> Ask HN </app-nav-link>
      <app-nav-link route="/show" [mobile]="true" (click)="onClose()"> Show HN </app-nav-link>
      <app-nav-link route="/jobs" [mobile]="true" (click)="onClose()"> Jobs </app-nav-link>
      <app-nav-link route="/settings" [mobile]="true" (click)="onClose()"> Settings </app-nav-link>
    </nav>
  `,
})
export class HeaderMobileNavComponent {
  readonly closeMenuRequested = output<void>();

  onClose(): void {
    this.closeMenuRequested.emit();
  }
}
