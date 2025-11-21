// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  HostListener,
  ViewChild,
  viewChild,
} from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SidebarCommentsComponent } from './components/sidebar-comments/sidebar-comments.component';
import { ScrollToTopComponent } from './components/shared/scroll-to-top/scroll-to-top.component';
import { KeyboardShortcutsComponent } from './components/keyboard-shortcuts/keyboard-shortcuts.component';
import { CacheManagerService } from './services/cache-manager.service';
import { ThemeService } from './services/theme.service';
import { SidebarService } from './services/sidebar.service';
import { KeyboardNavigationService } from './services/keyboard-navigation.service';
import { NavigationHistoryService } from './services/navigation-history.service';
import { StoryListStateService } from './services/story-list-state.service';
import { NetworkStateService } from './services/network-state.service';
import { ScrollService } from './services/scroll.service';
import { VERSION, COMMIT_SHA, COMMIT_SHA_SHORT } from './version';
import { PwaUpdateService } from './services/pwa-update.service';
import { AppShellComponent } from './components/layout/app-shell/app-shell.component';
import { CommandRegistryService } from './services/command-registry.service';
import { KeyboardContextService } from './services/keyboard-context.service';
import { SidebarKeyboardNavigationService } from './services/sidebar-keyboard-navigation.service';
import { KeyboardShortcutConfigService } from './services/keyboard-shortcut-config.service';
import { ItemKeyboardNavigationService } from './services/item-keyboard-navigation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarCommentsComponent,
    ScrollToTopComponent,
    KeyboardShortcutsComponent,
    AppShellComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  @ViewChild(KeyboardShortcutsComponent) keyboardShortcuts!: KeyboardShortcutsComponent;
  readonly outlet = viewChild.required(RouterOutlet);

  title = 'HNews';
  searchQuery = '';
  router = inject(Router);
  cacheService = inject(CacheManagerService);
  themeService = inject(ThemeService);
  sidebarService = inject(SidebarService);
  keyboardNavService = inject(KeyboardNavigationService);
  navigationHistory = inject(NavigationHistoryService);
  storyListStateService = inject(StoryListStateService);
  networkState = inject(NetworkStateService);
  private scrollService = inject(ScrollService);
  http = inject(HttpClient);
  private pwaUpdate = inject(PwaUpdateService);
  private keyboardConfig = inject(KeyboardShortcutConfigService);
  private keyboardContext = inject(KeyboardContextService);
  // Injected to ensure it initializes and registers commands
  private sidebarKeyboardNav = inject(SidebarKeyboardNavigationService);
  private itemKeyboardNav = inject(ItemKeyboardNavigationService);
  private commandRegistry = inject(CommandRegistryService);
  private location = inject(Location);

  // Expose PWA update signals to template
  updateAvailable = this.pwaUpdate.updateAvailable;
  updateVersionInfo = this.pwaUpdate.updateVersionInfo;
  version = VERSION;
  commitSha = COMMIT_SHA;
  commitShaShort = COMMIT_SHA_SHORT;
  commitUrl =
    this.commitSha !== 'unknown'
      ? `https://github.com/alysson-souza/hnews/commit/${this.commitSha}`
      : null;

  // Network state from NetworkStateService
  isOffline = computed(() => !this.networkState.isOnline());
  mobileMenuOpen = signal(false);
  showMobileSearch = signal(false);
  private lastRefreshTime = 0;

  constructor() {
    this.registerGlobalCommands();
  }

  private registerGlobalCommands() {
    this.commandRegistry.register('global.showHelp', () => this.showKeyboardShortcuts());
    this.commandRegistry.register('global.search', () => this.focusSearch());
    this.commandRegistry.register('global.toggleTheme', () => this.toggleTheme());
    this.commandRegistry.register('global.applyUpdate', () => this.applyPwaUpdate());
    this.commandRegistry.register('global.escape', () => this.handleEscapeDefault());
    this.commandRegistry.register('story.refresh', () => this.refreshCurrentStoryList());
  }

  private async loadBuildInfo(): Promise<void> {
    try {
      const info = await firstValueFrom(
        this.http.get<{
          version: string;
          buildTime: string;
          commitSha: string;
          commitShaShort: string;
        }>('version.json', {
          headers: {
            'Cache-Control': 'max-age=300, stale-while-revalidate=600',
          },
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
    this.loadBuildInfo();
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

    // Special handling for Escape in search inputs
    if (event.key === 'Escape' && isSearchInput && this.showMobileSearch()) {
      if (this.searchQuery.trim()) {
        this.searchQuery = '';
      } else {
        this.showMobileSearch.set(false);
        (target as HTMLInputElement).blur();
      }
      return;
    }

    // For non-Escape keys, don't process if in an input field
    if (event.key !== 'Escape' && isInputField) {
      return;
    }

    // Get current context (sidebar or default)
    const context = this.keyboardContext.currentContext();
    const isOnStoryList = this.keyboardContext.isOnStoryList();

    // For default context, only allow story shortcuts on story list pages
    // (global shortcuts always work)
    if (context === 'default' && !isOnStoryList) {
      // Only allow global shortcuts
      const shortcut = this.keyboardConfig.getShortcut(event.key, 'global');
      if (!shortcut) return;
    }

    // Look up shortcut in configuration
    const shortcut = this.keyboardConfig.getShortcut(event.key, context);
    if (!shortcut) return;

    // Execute the command
    event.preventDefault();
    this.commandRegistry.execute(shortcut.commandId);
  }

  // ============================================================================
  // Keyboard Shortcut Handlers - Story List (Default Context)
  // ============================================================================

  private handleEscapeDefault(): void {
    // Check if we're on an item page and can go back
    const isOnItemPage = this.keyboardContext.isOnItemPage();

    if (isOnItemPage && this.navigationHistory.canGoBack()) {
      const previousState = this.navigationHistory.goBack();
      if (previousState && previousState.selectedIndex !== null) {
        setTimeout(() => {
          this.keyboardNavService.setSelectedIndex(previousState.selectedIndex);
          this.scrollSelectedStoryIntoView();
        }, 100);
      }
    } else if (this.showMobileSearch()) {
      this.showMobileSearch.set(false);
    } else if (this.mobileMenuOpen()) {
      this.mobileMenuOpen.set(false);
    } else if (this.keyboardNavService.selectedIndex() !== null) {
      this.keyboardNavService.clearSelection();
    } else {
      this.scrollService.scrollToTop();
    }
  }

  private async scrollSelectedStoryIntoView(): Promise<void> {
    const selectedIndex = this.keyboardNavService.selectedIndex();
    if (selectedIndex !== null) {
      const element = document.querySelector(`[data-story-index="${selectedIndex}"]`);
      if (element) {
        await this.scrollService.scrollElementIntoView(element, { block: 'center' });
      }
    }
  }

  private showKeyboardShortcuts(): void {
    if (this.keyboardShortcuts) {
      this.keyboardShortcuts.open();
    }
  }

  private toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private focusSearch(): void {
    const isMobile = window.innerWidth < 1024;
    if (isMobile && !this.showMobileSearch()) {
      this.showMobileSearch.set(true);
      this.mobileMenuOpen.set(false);
      setTimeout(() => {
        this.focusVisibleSearchInput();
      }, 50);
    } else {
      this.focusVisibleSearchInput();
    }
  }

  private refreshCurrentStoryList(): void {
    const now = Date.now();
    if (now - this.lastRefreshTime < 1000) {
      return;
    }
    this.lastRefreshTime = now;

    this.keyboardNavService.clearSelection();
    this.scrollService.scrollToTop();

    const outlet = this.outlet();
    if (outlet && outlet.component) {
      const activatedComponent = outlet.component as { refresh?: () => void };
      if (activatedComponent && typeof activatedComponent.refresh === 'function') {
        activatedComponent.refresh();
      }
    }
  }

  async applyPwaUpdate(): Promise<void> {
    await this.pwaUpdate.applyUpdate();
  }

  dismissPwaUpdate(): void {
    this.pwaUpdate.dismissUpdate();
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
    const searchInputs = document.querySelectorAll(
      '.search-input, .search-input-mobile, input[type="search"]',
    ) as NodeListOf<HTMLInputElement>;

    for (const input of searchInputs) {
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
