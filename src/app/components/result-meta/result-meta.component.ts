// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { RouterLink } from '@angular/router';
import { UserTagComponent } from '../user-tag/user-tag.component';

@Component({
  selector: 'app-result-meta',
  imports: [RouterLink, UserTagComponent, DecimalPipe],
  template: `
    <div class="result-meta">
      @if (author()) {
        <span class="flex items-center gap-1">
          <span>by</span>
          <app-user-tag [username]="author()!" class="hidden sm:inline-flex" />
          <span class="username sm:hidden">{{ author() }}</span>
        </span>
        <span>•</span>
      }
      <span>{{ timeAgo() }}</span>
      <span>•</span>
      @if (!isComment() && points() !== undefined) {
        <span>{{ points() | number }} points</span>
        <span>•</span>
      }
      @if (isComment()) {
        <a [routerLink]="['/item', itemId()]" class="result-meta-link">View Comment</a>
        <span>•</span>
        <a [routerLink]="['/item', parentId()]" class="result-meta-link">View Story</a>
      } @else {
        <a [routerLink]="['/item', itemId()]" class="result-meta-link">
          {{ commentCount() | number }} comments
        </a>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .result-meta {
        @apply flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400;
      }

      .result-meta-link {
        @apply text-blue-600 dark:text-blue-300 hover:underline transition-colors duration-200;
        @apply flex items-center gap-1;
      }

      .username {
        @apply text-blue-600 dark:text-blue-300;
      }
    `,
  ],
})
export class ResultMetaComponent {
  readonly author = input<string>();
  readonly timeAgo = input('');
  readonly points = input<number>();
  readonly commentCount = input(0);
  readonly itemId = input('');
  readonly parentId = input<string>();
  readonly isComment = input(false);
}
