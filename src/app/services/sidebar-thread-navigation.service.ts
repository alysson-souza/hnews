// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { SidebarService } from './sidebar.service';

@Injectable({ providedIn: 'root' })
export class SidebarThreadNavigationService {
  private sidebar = inject(SidebarService);
  pushThread(
    id: number,
    options?: { selectFirstVisibleOnOpen?: boolean; scrollToFirstOnOpen?: boolean },
  ): void {
    const previousVisitedAt = this.sidebar.currentEntry()?.state.previousVisitedAt ?? null;
    this.sidebar.push(id);
    const entry = this.sidebar.currentEntry();
    if (entry) {
      entry.state.selectFirst = options?.selectFirstVisibleOnOpen ?? false;
      entry.state.scrollFirst = options?.scrollToFirstOnOpen ?? entry.state.selectFirst;
      entry.state.previousVisitedAt = previousVisitedAt;
    }
  }
  goBack(): void {
    this.sidebar.back();
  }
  closeSidebar(): void {
    this.sidebar.close();
  }
}
