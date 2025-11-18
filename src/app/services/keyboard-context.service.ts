// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from './sidebar.service';
import { KeyboardContext } from './keyboard-shortcut-config.service';

@Injectable({
  providedIn: 'root',
})
export class KeyboardContextService {
  private sidebarService = inject(SidebarService);
  private router = inject(Router);

  /**
   * Current keyboard context based on sidebar state and route
   */
  currentContext = computed<KeyboardContext>(() => {
    // Sidebar context takes priority when sidebar is open
    if (this.sidebarService.isOpen()) {
      return 'sidebar';
    }

    // Default context (story list, item page, etc.)
    return 'default';
  });

  /**
   * Check if we're on a story list page where story navigation shortcuts apply
   */
  isOnStoryList = computed(() => {
    const path = this.router.url;
    return ['/', '/top', '/best', '/newest', '/ask', '/show', '/jobs'].some(
      (p) => path === p || path.startsWith(p + '?'),
    );
  });

  /**
   * Check if we're on an item page
   */
  isOnItemPage = computed(() => {
    return this.router.url.includes('/item/');
  });

  /**
   * Check if we're on a user page
   */
  isOnUserPage = computed(() => {
    const path = this.router.url;
    return path.startsWith('/user/') || path === '/user' || path.startsWith('/user?');
  });

  constructor() {
    // Optional: Log context changes in development (disabled in production)
    // Uncomment for debugging:
    // effect(() => {
    //   console.log('[KeyboardContext] Context changed to:', this.currentContext());
    // });
  }
}
