// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';
import { HackernewsService } from '../../services/hackernews.service';
import { HNItem } from '../../models/hn';
import { CommentThread } from '../comment-thread/comment-thread';
import { SidebarCommentsHeaderComponent } from './sidebar-comments-header.component';
import { SidebarStorySummaryComponent } from './sidebar-story-summary.component';
import { VisitedService } from '../../services/visited.service';

@Component({
  selector: 'app-sidebar-comments',
  standalone: true,
  imports: [
    CommonModule,
    CommentThread,
    SidebarCommentsHeaderComponent,
    SidebarStorySummaryComponent,
  ],
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
            <app-sidebar-comments-header (dismiss)="sidebarService.closeSidebar()" />

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
                <app-sidebar-story-summary [item]="item()!" />

                <hr class="my-4 border-gray-200 dark:border-slate-700" />

                <!-- Comments -->
                <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Comments ({{ item()!.descendants || 0 }})
                </h4>

                @if (item()!.kids && item()!.kids!.length > 0) {
                  <div class="space-y-4" role="tree" aria-label="Comments">
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
export class SidebarCommentsComponent {
  sidebarService = inject(SidebarService);
  // Intentionally no device-specific behavior here
  private hnService = inject(HackernewsService);
  private visitedService = inject(VisitedService);

  item = signal<HNItem | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // React to currentItemId changes using signals
    effect(() => {
      const id = this.sidebarService.currentItemId();
      const current = this.item();
      if (id && (!current || current.id !== id)) {
        this.loadItem(id);
      }
    });
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
}
