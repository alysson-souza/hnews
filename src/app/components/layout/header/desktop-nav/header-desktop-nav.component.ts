// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavLinkComponent } from '../../../shared/nav-link/nav-link.component';

@Component({
  selector: 'app-header-desktop-nav',
  standalone: true,
  imports: [CommonModule, NavLinkComponent],
  template: `
    <nav
      class="hidden lg:flex items-center space-x-1"
      role="navigation"
      aria-label="Main Navigation"
    >
      <app-nav-link route="/top" [isActive]="routerUrl === '/top'"> Top </app-nav-link>
      <app-nav-link route="/best"> Best </app-nav-link>
      <app-nav-link route="/newest"> Newest </app-nav-link>
      <app-nav-link route="/ask"> Ask HN </app-nav-link>
      <app-nav-link route="/show"> Show HN </app-nav-link>
      <app-nav-link route="/jobs"> Jobs </app-nav-link>
      <app-nav-link route="/settings"> Settings </app-nav-link>
    </nav>
  `,
})
export class HeaderDesktopNavComponent {
  @Input() routerUrl = '';
}
