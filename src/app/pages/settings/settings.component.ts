// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserTagsService, UserTag } from '../../services/user-tags.service';
import { CacheManagerService } from '../../services/cache-manager.service';
import { ThemeService } from '../../services/theme.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';
import { CardComponent } from '../../components/shared/card/card.component';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { ThemeSelectorComponent } from '../../components/shared/theme-selector/theme-selector.component';
import { SectionTitleComponent } from '../../components/shared/section-title/section-title.component';
import { ToggleSwitchComponent } from '../../components/shared/toggle-switch/toggle-switch.component';
import { PaginationComponent } from '../../components/shared/pagination/pagination.component';
import { PwaUpdateSectionComponent } from '../../components/pwa-update-section/pwa-update-section.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  faPalette,
  faBook,
  faTag,
  faFileExport,
  faFileImport,
  faTrash,
  faTimes,
  faDatabase,
  faChartBar,
  faRefresh,
  faUser,
  faHardDrive,
  faMemory,
  faImages,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppButtonComponent,
    CardComponent,
    PageContainerComponent,
    ThemeSelectorComponent,
    SectionTitleComponent,
    ToggleSwitchComponent,
    PaginationComponent,
    PwaUpdateSectionComponent,
    FontAwesomeModule,
  ],
  templateUrl: './settings.component.html',
  styles: [
    `
      @reference '../../../styles.css';

      /* Section Styling */
      .setting-section {
        @apply relative overflow-hidden;
      }

      .section-header {
        @apply flex items-center gap-3 mb-6;
      }

      .section-header app-section-title {
        @apply flex items-center;
      }

      .section-icon {
        @apply text-lg text-gray-500 dark:text-gray-400 flex-shrink-0;
      }

      /* Alert Messages */
      .alert-success {
        @apply p-4 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50 mb-6;
      }
      .alert-danger {
        @apply p-4 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50 mb-6;
      }

      /* Modern Toggle Switch */
      .setting-group {
        @apply space-y-6;
      }

      .modern-toggle-container {
        @apply flex items-start justify-between gap-6 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200;
        @apply bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700;
      }

      .setting-info {
        @apply flex-1;
      }

      .setting-title {
        @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 block cursor-pointer;
      }

      .setting-description {
        @apply text-sm text-gray-600 dark:text-gray-400 leading-relaxed;
      }

      /* Tag Management */
      .action-buttons {
        @apply flex flex-wrap items-center gap-3;
      }

      .tags-search-section {
        @apply mb-3;
      }

      .search-container {
        @apply space-y-2;
      }

      .search-input {
        @apply w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200;
      }

      .search-icon {
        @apply absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500;
      }

      .clear-search {
        @apply absolute right-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200;
      }

      .search-results-info {
        @apply text-sm text-gray-600 dark:text-gray-400 px-1;
      }

      .tags-overview {
        @apply space-y-6;
      }

      .tags-list {
        @apply space-y-2 mb-3;
      }

      .tag-item-modern {
        @apply flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200;
        @apply bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700;
      }

      .tag-content {
        @apply flex-1 min-w-0;
      }

      .tag-user-info {
        @apply flex items-center gap-3 min-w-0;
      }

      .user-icon {
        @apply text-gray-500 dark:text-gray-400 flex-shrink-0;
      }

      .tag-username {
        @apply font-semibold text-gray-900 dark:text-gray-100 no-underline;
        @apply hover:underline focus-visible:underline;
        @apply max-w-40 truncate inline-block;
      }

      .tag-badge {
        @apply px-3 py-1 text-xs font-medium text-white text-center rounded-full shadow-sm;
        @apply max-w-32 truncate inline-block;
      }

      .tag-remove-modern {
        @apply flex items-center justify-center w-9 h-9 rounded-full text-red-600 dark:text-red-400 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-500/20;
        @apply bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer;
        @apply flex-shrink-0;
      }

      /* Empty State */
      .empty-state {
        @apply text-center py-8 space-y-4;
      }

      .empty-icon {
        @apply text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4;
      }

      .empty-title {
        @apply text-xl font-semibold text-gray-900 dark:text-gray-100;
      }

      .empty-description {
        @apply text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed;
      }

      /* Tag Action Buttons */
      .tag-action-buttons {
        @apply flex justify-center pt-4 gap-2;
      }

      @media (min-width: 640px) {
        .tag-action-buttons {
          @apply justify-end;
        }
      }

      /* Cache Management */
      .cache-stats-section {
        @apply space-y-6 mb-8;
      }

      .stats-header {
        @apply flex items-center justify-between mb-3;
      }

      .stats-title {
        @apply text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center;
      }

      .stats-grid {
        @apply grid grid-cols-1 md:grid-cols-2 gap-3;
      }

      .stat-card-modern {
        @apply flex items-center gap-4 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200;
        @apply bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700;
      }

      .stat-icon {
        @apply flex items-center justify-center w-12 h-12 rounded-full text-white text-xl shadow-lg;
      }

      .stat-icon.indexeddb {
        @apply bg-gradient-to-br from-violet-600 to-violet-700;
      }

      .stat-icon.sw-cache {
        @apply bg-gradient-to-br from-teal-600 to-teal-700;
      }

      .stat-icon.items {
        @apply bg-gradient-to-br from-sky-600 to-sky-700;
      }

      .stat-icon.memory {
        @apply bg-gradient-to-br from-amber-600 to-amber-700;
      }

      .stat-content {
        @apply flex-1;
      }

      .stat-label {
        @apply text-sm font-medium text-gray-600 dark:text-gray-400 mb-1;
      }

      .stat-value {
        @apply text-2xl font-bold text-gray-900 dark:text-gray-100;
      }

      .cache-actions-section {
        @apply space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700;
      }

      .cache-actions-header {
        @apply flex items-center justify-between mb-4;
      }

      .actions-title {
        @apply text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center;
      }

      .actions-description {
        @apply text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4;
      }

      .action-buttons {
        @apply flex flex-wrap items-center justify-center gap-2;
      }

      @media (min-width: 640px) {
        .action-buttons {
          @apply justify-end;
        }
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

  // FontAwesome icons
  faPalette = faPalette;
  faBook = faBook;
  faTag = faTag;
  faFileExport = faFileExport;
  faFileImport = faFileImport;
  faTrash = faTrash;
  faTimes = faTimes;
  faDatabase = faDatabase;
  faChartBar = faChartBar;
  faRefresh = faRefresh;
  faUser = faUser;
  faHardDrive = faHardDrive;
  faMemory = faMemory;
  faImages = faImages;
  faSearch = faSearch;

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

  constructor() {
    this.loadTags();

    // Set up search debouncing - must be in constructor for takeUntilDestroyed()
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.updatePaginatedTags();
      });
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
        await this.cacheService.clearType('stories');
        await this.cacheService.clearType('storyLists');
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
}
