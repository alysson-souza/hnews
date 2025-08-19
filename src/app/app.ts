// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarCommentsComponent } from './components/sidebar-comments/sidebar-comments.component';
import { ScrollToTopComponent } from './components/shared/scroll-to-top/scroll-to-top.component';
import { ThemeToggleComponent } from './components/shared/theme-toggle/theme-toggle.component';
import { CacheManagerService } from './services/cache-manager.service';
import { ThemeService } from './services/theme.service';
import { SidebarService } from './services/sidebar.service';
import { VERSION } from './version';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    SidebarCommentsComponent,
    ScrollToTopComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  title = 'HNews';
  searchQuery = '';
  router = inject(Router);
  cacheService = inject(CacheManagerService);
  themeService = inject(ThemeService);
  sidebarService = inject(SidebarService);
  version = VERSION;

  isOffline = signal(false);
  showOfflineMessage = signal(false);
  mobileMenuOpen = signal(false);
  showMobileSearch = signal(false);
  private offlineHandler?: () => void;
  private onlineHandler?: () => void;

  ngOnInit() {
    console.log(`HNews version: ${this.version}`);
    this.isOffline.set(!navigator.onLine);

    this.offlineHandler = () => {
      this.isOffline.set(true);
      this.showOfflineMessage.set(true);
      setTimeout(() => this.showOfflineMessage.set(false), 5000);
    };

    this.onlineHandler = () => {
      this.isOffline.set(false);
      this.showOfflineMessage.set(true);
      setTimeout(() => this.showOfflineMessage.set(false), 3000);
    };

    window.addEventListener('offline', this.offlineHandler);
    window.addEventListener('online', this.onlineHandler);
  }

  ngOnDestroy() {
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
    }
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
  }

  search() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
      this.searchQuery = '';
      this.showMobileSearch.set(false);
      this.mobileMenuOpen.set(false);
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((open) => !open);
    if (this.mobileMenuOpen()) {
      this.showMobileSearch.set(false);
    }
  }

  toggleMobileSearch() {
    this.showMobileSearch.update((show) => !show);
    if (this.showMobileSearch()) {
      this.mobileMenuOpen.set(false);
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.sidebarService.isOpen()) {
      this.sidebarService.closeSidebar();
    }
  }
}
