// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  isOpen = signal(false);
  currentItemId = signal<number | null>(null);

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
