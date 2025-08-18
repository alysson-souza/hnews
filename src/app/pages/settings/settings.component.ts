// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserTagsService, UserTag } from '../../services/user-tags.service';
import { CacheManagerService } from '../../services/cache-manager.service';
import { ThemeService } from '../../services/theme.service';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';
import { CardComponent } from '../../components/shared/card/card.component';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { StatCardComponent } from '../../components/shared/stat-card/stat-card.component';
import { ThemeSelectorComponent } from '../../components/shared/theme-selector/theme-selector.component';
import { SectionTitleComponent } from '../../components/shared/section-title/section-title.component';
import { OpenGraphSettingsComponent } from '../../components/settings/opengraph-settings/opengraph-settings.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButtonComponent,
    CardComponent,
    PageContainerComponent,
    StatCardComponent,
    ThemeSelectorComponent,
    SectionTitleComponent,
    OpenGraphSettingsComponent,
  ],
  template: `
    <app-page-container variant="narrow">
      <div class="space-y-6">
        <!-- Open Graph Providers Section -->
        <app-card class="block" role="region" aria-label="Open Graph Providers">
          <app-section-title>Open Graph Providers</app-section-title>
          <app-opengraph-settings></app-opengraph-settings>
        </app-card>

        <!-- Theme Settings Section -->
        <app-card class="block" role="region" aria-label="Theme Settings">
          <app-section-title>Theme Settings</app-section-title>
          <app-theme-selector></app-theme-selector>
        </app-card>

        <!-- User Tags Section -->
        <app-card class="block" role="region" aria-label="User Tags Management">
          <app-section-title>User Tags Management</app-section-title>

          <!-- Export/Import/Clear Section -->
          <div class="mb-8 space-y-4">
            <div class="flex flex-wrap items-center gap-4">
              <app-button (clicked)="exportTags()" variant="primary" ariaLabel="Export user tags">
                Export Tags
              </app-button>
              <app-button
                (clicked)="fileInput.click()"
                variant="primary"
                ariaLabel="Import user tags"
              >
                Import Tags
              </app-button>
              <input
                #fileInput
                type="file"
                accept=".json"
                (change)="importTags($event)"
                class="hidden"
                aria-hidden="true"
              />
              @if (tags().length > 0) {
                <app-button (clicked)="clearAll()" variant="danger" ariaLabel="Clear all user tags">
                  Clear All Tags
                </app-button>
              }
            </div>

            @if (message()) {
              <div [class]="isError() ? 'alert-danger' : 'alert-success'">{{ message() }}</div>
            }
          </div>

          <!-- Current Tags List -->
          <div>
            <app-section-title variant="subtitle">
              Current Tags ({{ tags().length }})
            </app-section-title>

            @if (tags().length > 0) {
              <div class="space-y-2">
                @for (tag of tags(); track tag.username) {
                  <div class="tag-item">
                    <div class="flex items-center gap-3">
                      <span class="tag-username">{{ tag.username }}</span>
                      <span class="tag-pill" [style.background-color]="tag.color">
                        {{ tag.tag }}
                      </span>
                    </div>
                    <div class="tag-meta">
                      <span>Added {{ getTimeAgo(tag.createdAt) }}</span>
                      <button (click)="removeTag(tag.username)" class="tag-remove">Remove</button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="empty">
                No user tags yet. Tags will appear here when you tag users while browsing.
              </p>
            }
          </div>

          <!-- Clear All Button moved next to export/import -->
        </app-card>

        <!-- Cache Management Section (moved to bottom) -->
        <app-card class="block" role="region" aria-label="Cache Management">
          <app-section-title>Cache Management</app-section-title>

          <div class="space-y-6">
            <!-- Cache Statistics -->
            <div>
              <app-section-title variant="subtitle">Cache Statistics</app-section-title>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <app-stat-card
                  label="IndexedDB Storage"
                  [value]="formatBytes(cacheStats().indexedDB)"
                ></app-stat-card>
                <app-stat-card
                  label="Service Worker Cache"
                  [value]="formatBytes(cacheStats().swCache)"
                ></app-stat-card>
                <app-stat-card
                  label="Total Items Cached"
                  [value]="cacheStats().itemCount.toString()"
                ></app-stat-card>
                <app-stat-card
                  label="Memory Cache"
                  [value]="cacheStats().memoryItems + ' items'"
                ></app-stat-card>
              </div>
            </div>

            <!-- Cache Actions -->
            <div>
              <app-section-title variant="subtitle">Cache Actions</app-section-title>
              <div class="flex flex-wrap gap-4">
                <app-button (clicked)="clearCache('all')" variant="danger">
                  Clear All Cache
                </app-button>
                <app-button (clicked)="clearCache('stories')" variant="secondary">
                  Clear Stories
                </app-button>
                <app-button (clicked)="clearCache('images')" variant="secondary">
                  Clear Images
                </app-button>
                <app-button (clicked)="refreshStats()" variant="primary">
                  Refresh Stats
                </app-button>
              </div>
            </div>

            @if (cacheMessage()) {
              <div [class]="cacheError() ? 'alert-danger' : 'alert-success'">
                {{ cacheMessage() }}
              </div>
            }
          </div>
        </app-card>
      </div>
    </app-page-container>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .alert-success {
        @apply p-3 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300;
      }
      .alert-danger {
        @apply p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300;
      }

      .tag-item {
        @apply flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded border border-transparent dark:border-slate-800;
      }
      .tag-username {
        @apply font-medium text-gray-900 dark:text-gray-100;
      }
      .tag-pill {
        @apply px-2 py-1 text-xs text-white rounded;
      }
      .tag-meta {
        @apply flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400;
      }
      .tag-remove {
        @apply text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded px-1;
      }

      .empty {
        @apply text-gray-500 dark:text-gray-400 text-center py-8;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private tagsService = inject(UserTagsService);
  private cacheService = inject(CacheManagerService);
  themeService = inject(ThemeService);

  tags = signal<UserTag[]>([]);
  message = signal<string>('');
  isError = signal(false);

  // Cache management signals
  cacheStats = signal({
    indexedDB: 0,
    swCache: 0,
    itemCount: 0,
    memoryItems: 0,
  });
  cacheMessage = signal<string>('');
  cacheError = signal(false);

  constructor() {
    this.loadTags();
  }

  async ngOnInit() {
    await this.refreshStats();
  }

  loadTags(): void {
    this.tags.set(this.tagsService.getAllTags());
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
      this.showMessage('All tags cleared', false);
    }
  }

  private showMessage(msg: string, error: boolean): void {
    this.message.set(msg);
    this.isError.set(error);
    setTimeout(() => this.message.set(''), 3000);
  }

  getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
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
        await this.cacheService.clearType('opengraph');
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
