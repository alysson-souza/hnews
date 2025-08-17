// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { HackernewsService, HNItem } from '../../services/hackernews.service';
import { CommentThread } from '../comment-thread/comment-thread';
import { VisitedService } from '../../services/visited.service';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-sidebar-comments',
  standalone: true,
  imports: [CommonModule, RouterLink, CommentThread],
  template: `
    <!-- Sidebar Comments -->
    @if (sidebarService.isOpen()) {
      <!-- Mobile: Full screen overlay -->
      <div
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        role="button"
        tabindex="0"
        (click)="sidebarService.closeSidebar()"
        (keydown.enter)="sidebarService.closeSidebar()"
        (keydown.space)="sidebarService.closeSidebar()"
      ></div>

      <!-- Sidebar Panel -->
      <div
        class="fixed right-0 top-0 lg:top-16 bottom-0 w-full sm:w-[80vw] md:w-[60vw] lg:w-[40vw] bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 shadow-2xl dark:shadow-2xl transition-transform duration-300 overflow-hidden z-50 lg:z-30"
        [class.translate-x-full]="!sidebarService.isOpen()"
        [class.translate-x-0]="sidebarService.isOpen()"
      >
        @if (sidebarService.currentItemId()) {
          <div class="h-full flex flex-col">
            <!-- Header -->
            <div
              class="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-3 sm:p-4 flex items-center justify-between shadow-sm dark:shadow-md"
            >
              <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Comments
              </h2>
              <button
                (click)="sidebarService.closeSidebar()"
                class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-3 sm:p-4">
              @if (loading()) {
                <div class="animate-pulse space-y-4">
                  <div class="h-20 bg-gray-200 rounded"></div>
                  <div class="h-20 bg-gray-200 rounded"></div>
                  <div class="h-20 bg-gray-200 rounded"></div>
                </div>
              } @else if (item()) {
                <!-- Story Details -->
                <div class="mb-4 sm:mb-6">
                  <h3
                    class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
                  >
                    @if (item()!.url) {
                      <a
                        [href]="item()!.url"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        class="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        {{ item()!.title }}
                      </a>
                    } @else {
                      {{ item()!.title }}
                    }
                  </h3>

                  <div
                    class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3"
                  >
                    <span>{{ item()!.score || 0 }} points</span>
                    <span>•</span>
                    <span>by {{ item()!.by }}</span>
                    <span>•</span>
                    <span>{{ getTimeAgo(item()!.time) }}</span>
                  </div>

                  @if (item()!.text) {
                    <div
                      class="prose prose-sm max-w-none text-gray-800 mb-4"
                      [innerHTML]="item()!.text"
                    ></div>
                  }

                  <div class="flex gap-3">
                    <a
                      [routerLink]="['/item', item()!.id]"
                      target="_blank"
                      class="text-blue-600 hover:underline text-sm"
                    >
                      Open in full view ↗
                    </a>
                  </div>
                </div>

                <hr class="my-4 border-gray-200 dark:border-slate-700" />

                <!-- Comments -->
                <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Comments ({{ item()!.descendants || 0 }})
                </h4>

                @if (item()!.kids && item()!.kids!.length > 0) {
                  <div class="space-y-4">
                    @for (commentId of item()!.kids!; track commentId) {
                      <app-comment-thread [commentId]="commentId" [depth]="0"></app-comment-thread>
                    }
                  </div>
                } @else {
                  <p class="text-gray-500 text-center py-8">No comments yet</p>
                }
              } @else if (error()) {
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p class="text-red-800">{{ error() }}</p>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class SidebarCommentsComponent implements OnInit {
  sidebarService = inject(SidebarService);
  deviceService = inject(DeviceService);
  private hnService = inject(HackernewsService);
  private visitedService = inject(VisitedService);

  item = signal<HNItem | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Watch for item changes
    this.loadItemWhenNeeded();
  }

  private loadItemWhenNeeded(): void {
    // Create a computed that triggers when currentItemId changes
    const itemId = computed(() => this.sidebarService.currentItemId());

    // Subscribe to changes
    itemId();

    if (this.sidebarService.currentItemId()) {
      this.loadItem(this.sidebarService.currentItemId()!);
    }
  }

  ngOnInit() {
    // Watch for changes to currentItemId
    setInterval(() => {
      const id = this.sidebarService.currentItemId();
      if (id && (!this.item() || this.item()!.id !== id)) {
        this.loadItem(id);
      }
    }, 100);
  }

  private loadItem(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.hnService.getItem(id).subscribe({
      next: (item) => {
        if (item) {
          this.item.set(item);
          // Mark as visited
          this.visitedService.markAsVisited(item.id, item.descendants);
        } else {
          this.error.set('Item not found');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load comments');
        this.loading.set(false);
      },
    });
  }

  getTimeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }
}
