// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitedService } from '../../../services/visited.service';

@Component({
  selector: 'app-visited-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisited()) {
      <div class="visited-indicator" [title]="getTooltip()"></div>
    }
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .visited-indicator {
        @apply absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-blue-600 dark:border-t-blue-500 border-l-[20px] border-l-transparent z-10;
      }
    `,
  ],
})
export class VisitedIndicatorComponent {
  @Input({ required: true }) storyId!: number;

  private visitedService = inject(VisitedService);

  isVisited = computed(() => {
    return this.visitedService.isVisited(this.storyId);
  });

  getTooltip(): string {
    return 'You Have Visited This Story';
  }
}
