// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, inject, signal, OnInit, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserTagsService, UserTag } from '@services/user-tags.service';
import { CacheManagerService } from '@services/cache-manager.service';
import { ThemeService } from '@services/theme.service';
import { UserSettingsService } from '@services/user-settings.service';
import { SidebarService } from '@services/sidebar.service';
import { DeviceService } from '@services/device.service';
import { CommandRegistryService } from '@services/command-registry.service';
import { ScrollService } from '@services/scroll.service';
import { PrivacyRedirectService } from '@services/privacy-redirect.service';
import { PrivacyService } from '@models/privacy-redirect';
import { AppButtonComponent } from '@components/shared/app-button/app-button.component';
import { CardComponent } from '@components/shared/card/card.component';
import { PageContainerComponent } from '@components/shared/page-container/page-container.component';
import { ThemeSelectorComponent } from '@components/shared/theme-selector/theme-selector.component';
import { ToggleSwitchComponent } from '@components/shared/toggle-switch/toggle-switch.component';
import { PaginationComponent } from '@components/shared/pagination/pagination.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  solarTagLinear,
  solarExportLinear,
  solarImportLinear,
  solarTrashBinTrashLinear,
  solarCloseCircleLinear,
  solarDatabaseLinear,
  solarRefreshLinear,
  solarUserLinear,
  solarSSDRoundLinear,
  solarCPULinear,
  solarGalleryLinear,
  solarMagniferLinear,
  solarDangerTriangleLinear,
  solarPen2Linear,
} from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    RouterModule,
    AppButtonComponent,
    CardComponent,
    PageContainerComponent,
    ThemeSelectorComponent,
    ToggleSwitchComponent,
    PaginationComponent,
    NgIconComponent,
  ],
  viewProviders: [
    provideIcons({
      solarTagLinear,
      solarExportLinear,
      solarImportLinear,
      solarTrashBinTrashLinear,
      solarCloseCircleLinear,
      solarDatabaseLinear,
      solarRefreshLinear,
      solarUserLinear,
      solarSSDRoundLinear,
      solarCPULinear,
      solarGalleryLinear,
      solarMagniferLinear,
      solarDangerTriangleLinear,
      solarPen2Linear,
    }),
  ],
  templateUrl: './settings.component.html',
  styles: [
    `
      @reference '../../../styles.css';

      /* ── Spacing scale ──
       * Tight:   2 (0.5rem)  — inline gaps, minor spacing
       * Base:    4 (1rem)    — row padding, standard margins, content gaps
       * Section: 6 (1.5rem)  — section insets (mobile), label-to-content
       * Wide:    8 (2rem)    — section insets (desktop)
       */

      /* Section layout */
      .setting-section {
        @apply relative px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6;
      }

      .section-divider {
        @apply border-t border-gray-200 dark:border-gray-700/60 m-0;
      }

      .settings-category-label {
        @apply text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4;
      }

      /* Shared interactive row — used for toggles, tag items, privacy services, stat rows */
      .setting-row {
        @apply flex items-start justify-between gap-4 py-3 px-4 -mx-4 rounded-xl;
        @apply hover:bg-gray-50 dark:hover:bg-white/[0.03];
      }

      .setting-info {
        @apply flex-1 space-y-1;
      }

      .setting-title {
        @apply text-sm font-medium text-gray-900 dark:text-gray-100 block cursor-pointer;
      }

      .setting-description {
        @apply text-sm text-gray-500 dark:text-gray-400 leading-relaxed;
      }

      /* Alert Messages */
      .alert-success {
        @apply p-4 rounded-lg mb-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/30;
      }
      .alert-danger {
        @apply p-4 rounded-lg mb-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/30;
      }

      /* Privacy sub-settings */
      .sub-settings {
        @apply mt-1 divide-y divide-gray-100 dark:divide-gray-700/40;
      }

      .privacy-service-item {
        @apply flex items-center justify-between gap-4 py-3 pl-6 pr-4 -mx-4;
        @apply hover:bg-gray-50 dark:hover:bg-white/[0.03];
      }

      .privacy-service-name {
        @apply text-sm text-gray-600 dark:text-gray-400;
      }

      .privacy-warning {
        @apply flex items-start gap-4 p-4 rounded-lg mb-4;
        @apply bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30;
      }

      .privacy-warning-icon {
        @apply text-xl text-amber-500 flex-shrink-0 mt-0.5;
      }

      .privacy-warning-content {
        @apply flex-1;
      }

      .privacy-warning-title {
        @apply font-semibold mb-1;
      }

      .privacy-warning-text {
        @apply text-sm opacity-90;
      }

      .attribution-footer {
        @apply mt-2 text-xs text-gray-400 dark:text-gray-500;
      }

      .attribution-link {
        @apply text-blue-600 dark:text-blue-400 hover:underline;
      }

      /* Tag Management */
      .tags-search-section {
        @apply mb-4;
      }

      .search-container {
        @apply space-y-2;
      }

      .search-input {
        @apply w-full pl-10 pr-10 py-3 rounded-xl border-0 ring-1 ring-gray-200 dark:ring-slate-700;
        @apply bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100;
        @apply placeholder-gray-500 dark:placeholder-gray-400;
        @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900;
      }

      .search-icon {
        @apply absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500;
      }

      .clear-search {
        @apply absolute right-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300;
      }

      .search-results-info {
        @apply text-sm text-gray-600 dark:text-gray-400;
      }

      .tags-list {
        @apply mb-4 divide-y divide-gray-100 dark:divide-gray-700/40;
      }

      .tag-item-modern {
        @apply grid items-center gap-x-4 py-3 px-4 -mx-4;
        @apply hover:bg-gray-50 dark:hover:bg-white/[0.03];
        grid-template-columns: auto 1fr auto;
      }

      .tag-content {
        @apply min-w-0;
      }

      .tag-user-info {
        @apply flex items-center gap-4 min-w-0;
      }

      .user-icon {
        @apply text-gray-400 dark:text-gray-500 flex-shrink-0 inline-flex items-center justify-center;
      }

      .tag-username {
        @apply font-semibold text-gray-900 dark:text-gray-100 no-underline;
        @apply hover:underline focus-visible:underline;
        @apply max-w-24 sm:max-w-40 truncate inline-flex items-center;
      }

      .tag-badge {
        @apply px-3 py-1 text-xs font-medium text-white text-center rounded-full shadow-sm;
        @apply max-w-32 truncate inline-flex items-center justify-center;
      }

      .tag-notes {
        @apply text-sm italic text-gray-500 dark:text-gray-400 mt-1;
      }

      .tag-notes-btn {
        @apply flex items-center justify-center w-9 h-9 rounded-full cursor-pointer flex-shrink-0;
        @apply text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700;
        @apply focus:outline-none focus:ring-4 focus:ring-gray-500/20;
      }

      .tag-notes-editor {
        @apply mt-2 space-y-2;
      }

      .tag-notes-input {
        @apply w-full text-sm px-4 py-2 rounded-lg resize-none;
        @apply border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
        @apply text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500;
        @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
      }

      .tag-notes-actions {
        @apply flex items-center gap-2;
      }

      .tag-notes-save {
        @apply text-xs font-medium cursor-pointer rounded px-2 py-1;
        @apply text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500;
      }

      .tag-notes-cancel {
        @apply text-xs font-medium cursor-pointer rounded px-2 py-1;
        @apply text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500;
      }

      .tag-actions {
        @apply flex items-center gap-2 flex-shrink-0;
      }

      .tag-remove-modern {
        @apply flex items-center justify-center w-9 h-9 rounded-full cursor-pointer flex-shrink-0;
        @apply text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40;
        @apply focus:outline-none focus:ring-4 focus:ring-red-500/20;
      }

      /* Empty State */
      .empty-state {
        @apply text-center py-6 space-y-2;
      }

      .empty-icon {
        @apply text-5xl text-gray-300 dark:text-slate-700 mx-auto mb-2;
      }

      .empty-title {
        @apply text-base font-semibold text-gray-900 dark:text-gray-100;
      }

      .empty-description {
        @apply text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed;
      }

      .tag-action-buttons {
        @apply flex flex-wrap justify-center sm:justify-end pt-4 gap-2;
      }

      /* Cache Management */
      .stats-header {
        @apply flex flex-wrap items-center justify-between gap-4 mb-4;
      }

      .stats-title {
        @apply text-sm font-medium text-gray-700 dark:text-gray-300;
      }

      .stats-list {
        @apply rounded-xl bg-gray-50 dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700/50 mb-4;
      }

      .stat-row {
        @apply flex items-center justify-between px-4 py-3;
      }

      .stat-row-label {
        @apply flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400;
      }

      .stat-row-icon {
        @apply text-base text-gray-400 dark:text-gray-500;
      }

      .stat-row-value {
        @apply text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono tabular-nums;
      }

      .cache-actions-section {
        @apply space-y-4;
      }

      .actions-description {
        @apply text-sm text-gray-500 dark:text-gray-400 leading-relaxed;
      }

      .action-buttons {
        @apply flex flex-wrap items-center justify-center sm:justify-end gap-2;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private tagsService = inject(UserTagsService);
  private cacheService = inject(CacheManagerService);
  themeService = inject(ThemeService);
  private userSettings = inject(UserSettingsService);
  sidebarService = inject(SidebarService);
  deviceService = inject(DeviceService);
  private commandRegistry = inject(CommandRegistryService);
  private scrollService = inject(ScrollService);
  privacyRedirectService = inject(PrivacyRedirectService);

  tags = signal<UserTag[]>([]);
  message = signal<string>('');
  isError = signal(false);

  // Pagination and search state
  searchQuery = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(5);
  paginatedTags = signal<{
    tags: UserTag[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }>({ tags: [], totalCount: 0, totalPages: 0, currentPage: 1 });

  editingNotesFor = signal<string | null>(null);
  editingNotesValue = signal('');

  private searchSubject = new Subject<string>();

  // Cache management signals
  cacheStats = signal({
    indexedDB: 0,
    swCache: 0,
    itemCount: 0,
    memoryItems: 0,
  });
  cacheMessage = signal<string>('');
  cacheError = signal(false);

  openCommentsInSidebar = computed(() => this.userSettings.settings().openCommentsInSidebar);

  // Privacy redirect computed signals
  privacyRedirectEnabled = computed(() => this.privacyRedirectService.settings().enabled);
  privacyRedirectState = computed(() => this.privacyRedirectService.state());
  privacyRedirectRegistry = this.privacyRedirectService.registry;

  constructor() {
    this.loadTags();
    this.registerCommands();

    // Set up search debouncing - must be in constructor for takeUntilDestroyed()
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.updatePaginatedTags();
      });
  }

  private registerCommands(): void {
    this.commandRegistry.register('settings.nextSection', () => this.scrollToNextSection());
    this.commandRegistry.register('settings.previousSection', () => this.scrollToPreviousSection());
  }

  private scrollToNextSection(): void {
    const sections = document.querySelectorAll('.setting-section');
    if (!sections.length) return;

    // Find currently visible section or the first one
    let currentIndex = -1;
    const viewportHeight = window.innerHeight;
    const viewportCenter = window.scrollY + viewportHeight / 2;

    sections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top;
      const absoluteBottom = absoluteTop + rect.height;

      if (absoluteTop <= viewportCenter && absoluteBottom >= viewportCenter) {
        currentIndex = index;
      }
    });

    // If no section is clearly "active", find the first one that is mostly in view or below
    if (currentIndex === -1) {
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top >= 0 && currentIndex === -1) {
          currentIndex = index;
        }
      });
    }

    // If still nothing, start at -1 so next is 0
    if (currentIndex === -1) currentIndex = -1;

    const nextIndex = Math.min(currentIndex + 1, sections.length - 1);
    this.scrollToSection(sections[nextIndex] as HTMLElement);
  }

  private scrollToPreviousSection(): void {
    const sections = document.querySelectorAll('.setting-section');
    if (!sections.length) return;

    // Find currently visible section
    let currentIndex = -1;
    const viewportHeight = window.innerHeight;
    const viewportCenter = window.scrollY + viewportHeight / 2;

    sections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top;
      const absoluteBottom = absoluteTop + rect.height;

      if (absoluteTop <= viewportCenter && absoluteBottom >= viewportCenter) {
        currentIndex = index;
      }
    });

    if (currentIndex === -1) currentIndex = 0;

    const prevIndex = Math.max(currentIndex - 1, 0);
    this.scrollToSection(sections[prevIndex] as HTMLElement);
  }

  private scrollToSection(element: HTMLElement): void {
    this.scrollService.scrollToHTMLElement(element, { offset: 20 });
  }

  async ngOnInit() {
    await this.refreshStats();
  }

  loadTags(): void {
    this.tags.set(this.tagsService.getAllTags());
    this.updatePaginatedTags();
  }

  updatePaginatedTags(): void {
    const result = this.tagsService.getPaginatedTags(
      this.searchQuery(),
      this.currentPage(),
      this.itemsPerPage(),
    );
    this.paginatedTags.set(result);
    this.currentPage.set(result.currentPage);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page on search
    this.searchSubject.next(query);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updatePaginatedTags();
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPerPage.set(itemsPerPage);
    this.currentPage.set(1); // Reset to first page when changing items per page
    this.updatePaginatedTags();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.updatePaginatedTags();
  }

  exportTags(): void {
    const json = this.tagsService.exportTags();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hn-user-tags-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showMessage('Tags exported successfully', false);
  }

  importTags(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (this.tagsService.importTags(content)) {
        this.loadTags();
        this.clearSearch(); // Clear search when importing new tags
        this.showMessage('Tags imported successfully', false);
      } else {
        this.showMessage('Failed to import tags. Please check the file format.', true);
      }
    };
    reader.readAsText(file);

    input.value = '';
  }

  removeTag(username: string): void {
    this.tagsService.removeTag(username);
    this.loadTags();
    this.showMessage(`Tag removed for ${username}`, false);
  }

  editTagNotes(tag: UserTag): void {
    if (this.editingNotesFor() === tag.username) {
      this.editingNotesFor.set(null);
      return;
    }
    this.editingNotesFor.set(tag.username);
    this.editingNotesValue.set(tag.notes || '');
  }

  saveTagNotes(username: string): void {
    this.tagsService.setNotes(username, this.editingNotesValue());
    this.editingNotesFor.set(null);
    this.editingNotesValue.set('');
    this.loadTags();
    this.showMessage('Notes updated', false);
  }

  clearAll(): void {
    if (confirm('Are you sure you want to clear all tags? This cannot be undone.')) {
      this.tagsService.clearAllTags();
      this.loadTags();
      this.clearSearch(); // Also clear search when clearing all tags
      this.showMessage('All tags cleared', false);
    }
  }

  onSidebarPreferenceChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.userSettings.setSetting('openCommentsInSidebar', checked);
  }

  toggleSidebarPreference(): void {
    const newValue = !this.openCommentsInSidebar();
    this.userSettings.setSetting('openCommentsInSidebar', newValue);
  }

  private showMessage(msg: string, error: boolean): void {
    this.message.set(msg);
    this.isError.set(error);
    setTimeout(() => this.message.set(''), 3000);
  }

  // Cache management methods
  async refreshStats(): Promise<void> {
    try {
      const stats = await this.cacheService.getStats();
      this.cacheStats.set(stats);
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      this.showCacheMessage('Failed to load cache statistics', true);
    }
  }

  async clearCache(type: 'all' | 'stories' | 'images'): Promise<void> {
    try {
      if (type === 'all') {
        const confirmMsg =
          'Clear all cached data? This will free up storage but may slow down loading temporarily.';
        if (!confirm(confirmMsg)) return;

        await this.cacheService.clearAll();
        this.showCacheMessage('All cache cleared successfully', false);
      } else if (type === 'stories') {
        await this.cacheService.clear('story');
        await this.cacheService.clear('storyList');
        this.showCacheMessage('Story cache cleared successfully', false);
      } else if (type === 'images') {
        // Clear service worker image cache
        if ('caches' in window) {
          await caches.delete('images-v1');
          await caches.delete('favicons-v1');
        }
        this.showCacheMessage('Image cache cleared successfully', false);
      }

      await this.refreshStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      this.showCacheMessage('Failed to clear cache', true);
    }
  }

  private showCacheMessage(msg: string, error: boolean): void {
    this.cacheMessage.set(msg);
    this.cacheError.set(error);
    setTimeout(() => this.cacheMessage.set(''), 3000);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Privacy redirect methods
  togglePrivacyRedirect(): void {
    const newValue = !this.privacyRedirectEnabled();
    this.privacyRedirectService.setEnabled(newValue);
  }

  togglePrivacyService(service: PrivacyService): void {
    const current = this.privacyRedirectService.settings().services[service];
    this.privacyRedirectService.setServiceEnabled(service, !current);
  }

  isServiceEnabled(service: PrivacyService): boolean {
    return this.privacyRedirectService.settings().services[service];
  }

  refreshPrivacyInstances(): void {
    this.privacyRedirectService.refresh();
  }

  formatRetryTime(): string {
    const state = this.privacyRedirectState();
    if (!state.nextRetryAt) return '';
    const seconds = Math.max(0, Math.ceil((state.nextRetryAt - Date.now()) / 1000));
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
}
