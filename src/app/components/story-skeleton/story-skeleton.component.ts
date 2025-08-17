// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-story-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="relative flex bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm dark:shadow-md mb-3 animate-pulse"
    >
      <!-- Vote Section Skeleton -->
      <div
        class="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-b from-gray-100 to-gray-200 rounded-l-lg w-[100px] flex-shrink-0"
      >
        <div class="w-8 h-8 bg-gray-300 rounded mb-2"></div>
        <div class="w-12 h-6 bg-gray-300 rounded"></div>
      </div>

      <!-- Thumbnail Skeleton -->
      <div class="flex-shrink-0 w-28 flex items-center justify-center p-3">
        <div class="w-20 h-20 bg-gray-200"></div>
      </div>

      <!-- Content Skeleton -->
      <div class="flex-1 p-3">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- Title Skeleton -->
            <div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>

            <!-- Domain Skeleton -->
            <div class="h-4 bg-gray-200 rounded w-32 mb-2"></div>

            <!-- Description Skeleton -->
            <div class="h-4 bg-gray-200 rounded w-full mb-3"></div>

            <!-- Metadata Skeleton -->
            <div class="flex items-center gap-3">
              <div class="h-3 bg-gray-200 rounded w-20"></div>
              <div class="h-3 bg-gray-200 rounded w-24"></div>
              <div class="h-3 bg-gray-200 rounded w-28"></div>
            </div>
          </div>

          <!-- Share Button Skeleton -->
          <div class="w-9 h-9 bg-gray-200 rounded"></div>
        </div>
      </div>
    </article>
  `,
})
export class StorySkeletonComponent {}
