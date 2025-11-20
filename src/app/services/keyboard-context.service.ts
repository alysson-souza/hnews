// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject, computed, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarService } from './sidebar.service';
import { KeyboardContext } from './keyboard-shortcut-config.service';

@Injectable({
  providedIn: 'root',
})
export class KeyboardContextService {
  private sidebarService = inject(SidebarService);
  private router = inject(Router);

  /**
   * Reactive signal for the current URL
   */
  private currentUrl = signal(this.router.url);

  /**
   * Current keyboard context based on sidebar state and route
   */
  currentContext = computed<KeyboardContext>(() => {
    // Sidebar context takes priority when sidebar is open
    if (this.sidebarService.isOpen()) {
      return 'sidebar';
    }

    // Item page context (when not in sidebar)
    if (this.isOnItemPage()) {
      return 'item-page';
    }

    // Default context (story list, etc.)
    return 'default';
  });

  /**
   * Check if we're on a story list page where story navigation shortcuts apply
   */
  isOnStoryList = computed(() => {
    const url = this.currentUrl();
    // Remove fragment and query params to get the base path
    const path = url.split('#')[0].split('?')[0];
    return ['/', '/top', '/best', '/newest', '/ask', '/show', '/jobs'].includes(path);
  });

  /**
   * Check if we're on an item page
   */
  isOnItemPage = computed(() => {
    return this.currentUrl().includes('/item/');
  });

  /**
   * Check if we're on a user page
   */
  isOnUserPage = computed(() => {
    const path = this.currentUrl();
    return path.startsWith('/user/') || path === '/user' || path.startsWith('/user?');
  });

  constructor() {
    // Update currentUrl signal on navigation end
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.currentUrl.set(this.router.url);
    });

    // Optional: Log context changes in development (disabled in production)
    // Uncomment for debugging:
    // effect(() => {
    //   console.log('[KeyboardContext] Context changed to:', this.currentContext());
    // });
  }
}
