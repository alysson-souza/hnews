// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comment-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="skeleton mb-4"
      [ngClass]="
        depth > 0 ? 'ml-4 border-l-2 border-gray-200 dark:border-slate-700 pl-4 relative group' : ''
      "
    >
      <div class="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/4 mb-2"></div>
      <div class="h-3 bg-gray-200 dark:bg-slate-800 rounded w-3/4"></div>
    </div>
  `,
  styles: [],
})
export class CommentSkeletonComponent {
  @Input() depth = 0;
}
