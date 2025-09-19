// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SidebarCommentsComponent } from './components/sidebar-comments/sidebar-comments.component';
import { ScrollToTopComponent } from './components/shared/scroll-to-top/scroll-to-top.component';
import { ThemeToggleComponent } from './components/shared/theme-toggle/theme-toggle.component';
import { KeyboardShortcutsComponent } from './components/keyboard-shortcuts/keyboard-shortcuts.component';
import { CacheManagerService } from './services/cache-manager.service';
import { ThemeService } from './services/theme.service';
import { SidebarService } from './services/sidebar.service';
import { KeyboardNavigationService } from './services/keyboard-navigation.service';
import { NavigationHistoryService } from './services/navigation-history.service';
import { StoryListStateService } from './services/story-list-state.service';
import { VERSION, COMMIT_SHA, COMMIT_SHA_SHORT } from './version';
import { PwaUpdateService } from './services/pwa-update.service';

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
    KeyboardShortcutsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  @ViewChild(KeyboardShortcutsComponent) keyboardShortcuts!: KeyboardShortcutsComponent;
  @ViewChild(RouterOutlet) outlet!: RouterOutlet;

  title = 'HNews';
  searchQuery = '';
  router = inject(Router);
  cacheService = inject(CacheManagerService);
  themeService = inject(ThemeService);
  sidebarService = inject(SidebarService);
  keyboardNavService = inject(KeyboardNavigationService);
  navigationHistory = inject(NavigationHistoryService);
  storyListStateService = inject(StoryListStateService);
  http = inject(HttpClient);
  private readonly _pwaUpdate = inject(PwaUpdateService);
  version = VERSION;
  commitSha = COMMIT_SHA;
  commitShaShort = COMMIT_SHA_SHORT;
  commitUrl =
    this.commitSha !== 'unknown'
      ? `https://github.com/alysson-souza/hnews/commit/${this.commitSha}`
      : null;

  isOffline = signal(false);
  showOfflineMessage = signal(false);
  mobileMenuOpen = signal(false);
  showMobileSearch = signal(false);
  private offlineHandler?: () => void;
  private onlineHandler?: () => void;
  private lastRefreshTime = 0;

  private async loadBuildInfo(): Promise<void> {
    try {
      const info = await firstValueFrom(
        this.http.get<{
          version: string;
          buildTime: string;
          commitSha: string;
          commitShaShort: string;
        }>('version.json', {
          headers: { 'Cache-Control': 'no-cache' },
        }),
      );

      this.version = info.version ?? this.version;
      this.commitSha = info.commitSha ?? this.commitSha;
      this.commitShaShort = info.commitShaShort ?? this.commitShaShort;
      this.commitUrl =
        this.commitSha && this.commitSha !== 'unknown'
          ? `https://github.com/alysson-souza/hnews/commit/${this.commitSha}`
          : null;
    } catch (error) {
      console.warn('Failed to load build info', error);
    }
  }

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

    this.loadBuildInfo();
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
    // Don't hijack browser shortcuts when modifier keys are pressed
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement;
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true';
    const isSearchInput =
      target.classList.contains('search-input') ||
      target.classList.contains('search-input-mobile') ||
      (target as HTMLInputElement).type === 'search';

    // Don't process if help dialog is open
    if (this.keyboardShortcuts && this.keyboardShortcuts.isOpen()) {
      return;
    }

    // Handle Escape key specially
    if (event.key === 'Escape') {
      // Allow Escape to work in search inputs to close mobile search
      if (isSearchInput && this.showMobileSearch()) {
        if (this.searchQuery.trim()) {
          this.searchQuery = '';
        } else {
          this.showMobileSearch.set(false);
          (target as HTMLInputElement).blur();
        }
        return;
      }

      // Handle other Escape scenarios
      if (!isInputField) {
        // Check if we're on an item page and can go back
        const currentPath = this.router.url;
        const isOnItemPage = currentPath.includes('/item/');

        if (isOnItemPage && this.navigationHistory.canGoBack()) {
          const previousState = this.navigationHistory.goBack();
          if (previousState) {
            // The cached state will be restored automatically by StoryList
            // Just restore the selected index after navigation completes
            if (previousState.selectedIndex !== null) {
              setTimeout(() => {
                this.keyboardNavService.setSelectedIndex(previousState.selectedIndex);
                this.scrollSelectedIntoView();
              }, 100);
            }
          }
        } else if (this.sidebarService.isOpen()) {
          this.sidebarService.closeSidebar();
        } else if (this.showMobileSearch()) {
          this.showMobileSearch.set(false);
        } else if (this.mobileMenuOpen()) {
          this.mobileMenuOpen.set(false);
        } else if (this.keyboardNavService.selectedIndex() !== null) {
          this.keyboardNavService.clearSelection();
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      return;
    }

    // For other keys, don't process if in an input field
    if (isInputField) {
      return;
    }

    const currentPath = this.router.url;
    const isOnStoryList = ['/', '/top', '/best', '/newest', '/ask', '/show', '/jobs'].some(
      (path) => currentPath === path || currentPath.startsWith(path + '?'),
    );

    // Allow global shortcuts (/, ?, t) on all pages, but restrict story-specific shortcuts to story lists
    const globalShortcuts = ['/', '?', 't'];
    if (!isOnStoryList && !globalShortcuts.includes(event.key)) {
      return;
    }

    switch (event.key) {
      case 'j':
        if (isOnStoryList) {
          event.preventDefault();
          this.blurActiveElement();
          if (this.keyboardNavService.isAtLastItem()) {
            const loadMoreBtn = document.querySelector('.load-more-btn') as HTMLElement;
            loadMoreBtn?.click();
          } else {
            this.keyboardNavService.selectNext();
            this.scrollSelectedIntoView();
          }
        }
        break;
      case 'k':
        if (isOnStoryList) {
          event.preventDefault();
          this.blurActiveElement();
          this.keyboardNavService.selectPrevious();
          this.scrollSelectedIntoView();
        }
        break;
      case 'o':
        if (isOnStoryList) {
          event.preventDefault();
          this.openSelectedStory();
        }
        break;
      case 'O': // Shift+O
        if (isOnStoryList) {
          event.preventDefault();
          this.openSelectedStoryFullPage();
        }
        break;
      case 'c':
        if (isOnStoryList) {
          event.preventDefault();
          this.openSelectedComments();
        }
        break;
      case 'C': // Shift+C
        if (isOnStoryList) {
          event.preventDefault();
          this.navigateToItemPage();
        }
        break;
      case 'h':
        if (isOnStoryList) {
          event.preventDefault();
          this.blurActiveElement();
          this.navigateToTab('prev');
        }
        break;
      case 'l':
        if (isOnStoryList) {
          event.preventDefault();
          this.blurActiveElement();
          this.navigateToTab('next');
        }
        break;
      case '?':
        event.preventDefault();
        this.showKeyboardShortcuts();
        break;
      case '/':
        event.preventDefault();
        this.focusSearch();
        break;
      case 't':
        event.preventDefault();
        this.themeService.toggleTheme();
        break;
      case 'r':
        if (isOnStoryList) {
          event.preventDefault();
          this.refreshCurrentStoryList();
        }
        break;
    }
  }

  private scrollSelectedIntoView(): void {
    setTimeout(() => {
      const selectedIndex = this.keyboardNavService.selectedIndex();
      if (selectedIndex !== null) {
        const element = document.querySelector(`[data-story-index="${selectedIndex}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  }

  private openSelectedStory(): void {
    const selectedIndex = this.keyboardNavService.selectedIndex();
    if (selectedIndex !== null) {
      const element = document.querySelector(
        `[data-story-index="${selectedIndex}"] .story-link-trigger`,
      ) as HTMLAnchorElement;
      // Check if this is a text post by looking at the href content
      // RouterLink creates href="/item/xxx" while external links have full URLs
      if (element && element.href && element.href.includes('/item/')) {
        // Text post (Ask HN, etc.) - open comments sidebar instead
        this.openSelectedComments();
      } else {
        // Regular story with external URL - open the link
        element?.click();
      }
    }
  }

  private openSelectedComments(): void {
    const selectedIndex = this.keyboardNavService.selectedIndex();
    if (selectedIndex !== null) {
      const element = document.querySelector(
        `[data-story-index="${selectedIndex}"] .story-comments-trigger`,
      ) as HTMLElement;
      element?.click();
    }
  }

  private openSelectedStoryFullPage(): void {
    const selectedIndex = this.keyboardNavService.selectedIndex();
    if (selectedIndex !== null) {
      const element = document.querySelector(
        `[data-story-index="${selectedIndex}"] .story-link-trigger`,
      ) as HTMLAnchorElement;
      // For text posts (Shift+O), navigate to the item page
      if (element && element.href && element.href.includes('/item/')) {
        // Extract item ID and navigate to item page
        const match = element.href.match(/\/item\/(\d+)/);
        if (match && match[1]) {
          const currentPath = this.router.url.split('/')[1]?.split('?')[0] || 'top';
          const storyType = currentPath === '' ? 'top' : currentPath;
          this.navigationHistory.pushCurrentState(
            this.keyboardNavService.selectedIndex(),
            storyType,
          );
          this.router.navigate(['/item', match[1]]);
        }
      } else {
        // Regular story - just open the external link
        element?.click();
      }
    }
  }

  private navigateToItemPage(): void {
    const selectedIndex = this.keyboardNavService.selectedIndex();
    if (selectedIndex !== null) {
      // Get the story ID from the data attribute
      const storyElement = document.querySelector(`[data-story-index="${selectedIndex}"]`);
      if (storyElement) {
        const storyId = storyElement.getAttribute('data-story-id');
        if (storyId) {
          const currentPath = this.router.url.split('/')[1]?.split('?')[0] || 'top';
          const storyType = currentPath === '' ? 'top' : currentPath;
          this.navigationHistory.pushCurrentState(
            this.keyboardNavService.selectedIndex(),
            storyType,
          );
          this.router.navigate(['/item', storyId]);
        }
      }
    }
  }

  private navigateToTab(direction: 'next' | 'prev'): void {
    const tabs = ['top', 'best', 'newest', 'ask', 'show', 'jobs'];
    const currentPath = this.router.url.split('/')[1]?.split('?')[0] || 'top';
    const currentIndex = tabs.indexOf(currentPath);

    if (currentIndex === -1) return;

    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % tabs.length;
      this.router.navigate(['/' + tabs[nextIndex]]);
    } else {
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      this.router.navigate(['/' + tabs[prevIndex]]);
    }

    this.keyboardNavService.clearSelection();
  }

  private showKeyboardShortcuts(): void {
    if (this.keyboardShortcuts) {
      this.keyboardShortcuts.open();
    }
  }

  private focusSearch(): void {
    // On mobile, open the search bar first
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    if (isMobile && !this.showMobileSearch()) {
      this.showMobileSearch.set(true);
      this.mobileMenuOpen.set(false);
      // Wait for Angular to render the search input
      setTimeout(() => {
        this.focusVisibleSearchInput();
      }, 50);
    } else {
      this.focusVisibleSearchInput();
    }
  }

  private refreshCurrentStoryList(): void {
    // Prevent refresh spam - require at least 1 second between refreshes
    const now = Date.now();
    if (now - this.lastRefreshTime < 1000) {
      return;
    }
    this.lastRefreshTime = now;

    // Clear selection and scroll to top for immediate feedback
    this.keyboardNavService.clearSelection();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Get the activated component from the router outlet
    if (this.outlet && this.outlet.component) {
      const activatedComponent = this.outlet.component as { refresh?: () => void };
      // Check if it's a StoriesComponent (has a refresh method)
      if (activatedComponent && typeof activatedComponent.refresh === 'function') {
        activatedComponent.refresh();
      }
    }
  }

  handleDesktopSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      const target = event.target as HTMLInputElement;
      if (this.searchQuery.trim()) {
        this.searchQuery = '';
      } else {
        target.blur();
      }
      event.preventDefault();
    }
  }

  private blurActiveElement(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  }

  private focusVisibleSearchInput(): void {
    // Try to find any visible search input
    const searchInputs = document.querySelectorAll(
      '.search-input, .search-input-mobile, input[type="search"]',
    ) as NodeListOf<HTMLInputElement>;

    for (const input of searchInputs) {
      // Check if the input is visible
      const rect = input.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;

      if (isVisible) {
        input.focus();
        input.select();
        break;
      }
    }
  }
}
