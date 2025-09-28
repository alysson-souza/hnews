// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private router = inject(Router);

  isOpen = signal(false);
  currentItemId = signal<number | null>(null);

  constructor() {
    // Close sidebar on route changes
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      if (this.isOpen()) {
        this.closeSidebar();
      }
    });
  }

  openSidebar(itemId: number): void {
    this.currentItemId.set(itemId);
    this.isOpen.set(true);
  }

  closeSidebar(): void {
    this.isOpen.set(false);
    // Keep currentItemId for animation purposes
    setTimeout(() => {
      if (!this.isOpen()) {
        this.currentItemId.set(null);
      }
    }, 300); // Match animation duration
  }

  toggleSidebar(itemId: number): void {
    if (this.currentItemId() === itemId && this.isOpen()) {
      this.closeSidebar();
    } else {
      this.openSidebar(itemId);
    }
  }
}
