// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserTagsService, UserTag } from '../../services/user-tags.service';
import { CacheManagerService } from '../../services/cache-manager.service';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';
import { CardComponent } from '../../components/shared/card/card.component';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AppButtonComponent, CardComponent, PageContainerComponent],
  template: `
    <app-page-container variant="narrow">
      <div class="space-y-6">
        <!-- Cache Management Section -->
        <app-card class="block">
          <h1 class="text-2xl font-bold text-gray-900 mb-6">Cache Management</h1>

          <div class="space-y-6">
            <!-- Cache Statistics -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Cache Statistics</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded">
                  <div class="text-sm text-gray-600">IndexedDB Storage</div>
                  <div class="text-xl font-semibold text-gray-900">
                    {{ formatBytes(cacheStats().indexedDB) }}
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded">
                  <div class="text-sm text-gray-600">Service Worker Cache</div>
                  <div class="text-xl font-semibold text-gray-900">
                    {{ formatBytes(cacheStats().swCache) }}
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded">
                  <div class="text-sm text-gray-600">Total Items Cached</div>
                  <div class="text-xl font-semibold text-gray-900">
                    {{ cacheStats().itemCount }}
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded">
                  <div class="text-sm text-gray-600">Memory Cache</div>
                  <div class="text-xl font-semibold text-gray-900">
                    {{ cacheStats().memoryItems }} items
                  </div>
                </div>
              </div>
            </div>

            <!-- Cache Actions -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Cache Actions</h2>
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
              <div
                class="p-3 rounded"
                [class.bg-green-100]="!cacheError()"
                [class.text-green-800]="!cacheError()"
                [class.bg-red-100]="cacheError()"
                [class.text-red-800]="cacheError()"
              >
                {{ cacheMessage() }}
              </div>
            }
          </div>
        </app-card>

        <!-- User Tags Section -->
        <app-card class="block">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">User Tags Management</h2>

          <!-- Export/Import Section -->
          <div class="mb-8 space-y-4">
            <div class="flex gap-4">
              <app-button (clicked)="exportTags()" variant="primary"> Export Tags </app-button>
              <app-button (clicked)="fileInput.click()" variant="primary"> Import Tags </app-button>
              <input
                #fileInput
                type="file"
                accept=".json"
                (change)="importTags($event)"
                class="hidden"
              />
            </div>

            @if (message()) {
              <div
                class="p-3 rounded"
                [class.bg-green-100]="!isError()"
                [class.text-green-800]="!isError()"
                [class.bg-red-100]="isError()"
                [class.text-red-800]="isError()"
              >
                {{ message() }}
              </div>
            }
          </div>

          <!-- Current Tags List -->
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Current Tags ({{ tags().length }})
            </h2>

            @if (tags().length > 0) {
              <div class="space-y-2">
                @for (tag of tags(); track tag.username) {
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div class="flex items-center gap-3">
                      <span class="font-medium text-gray-900">{{ tag.username }}</span>
                      <span
                        class="px-2 py-1 text-xs text-white rounded"
                        [style.background-color]="tag.color"
                      >
                        {{ tag.tag }}
                      </span>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-600">
                      <span>Added {{ getTimeAgo(tag.createdAt) }}</span>
                      <button
                        (click)="removeTag(tag.username)"
                        class="text-red-600 hover:text-red-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded px-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-gray-500 text-center py-8">
                No user tags yet. Tags will appear here when you tag users while browsing.
              </p>
            }
          </div>

          <!-- Clear All Button -->
          @if (tags().length > 0) {
            <div class="mt-6 pt-6 border-t border-gray-200">
              <app-button (clicked)="clearAll()" variant="danger"> Clear All Tags </app-button>
            </div>
          }
        </app-card>
      </div>
    </app-page-container>
  `,
})
export class SettingsComponent implements OnInit {
  private tagsService = inject(UserTagsService);
  private cacheService = inject(CacheManagerService);

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
