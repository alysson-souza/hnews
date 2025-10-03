// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="pagination-container">
      <div class="pagination-info">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Showing {{ startItem }}-{{ endItem }} of {{ totalCount }} items
        </span>
      </div>

      <div class="pagination-controls">
        <button
          (click)="previousPage()"
          [disabled]="currentPage <= 1"
          class="pagination-button"
          [attr.aria-label]="'Previous page'"
        >
          <fa-icon [icon]="faChevronLeft"></fa-icon>
          Previous
        </button>

        <div class="page-numbers">
          @for (page of visiblePages; track page) {
            <button
              (click)="goToPage(page)"
              [class]="page === currentPage ? 'page-button active' : 'page-button'"
              [attr.aria-label]="'Go to page ' + page"
              [attr.aria-current]="page === currentPage ? 'page' : null"
            >
              {{ page }}
            </button>
          }
        </div>

        <button
          (click)="nextPage()"
          [disabled]="currentPage >= totalPages"
          class="pagination-button"
          [attr.aria-label]="'Next page'"
        >
          Next
          <fa-icon [icon]="faChevronRight"></fa-icon>
        </button>
      </div>

      <div class="items-per-page">
        <label for="items-per-page" class="text-sm text-gray-600 dark:text-gray-400">
          Items per page:
        </label>
        <select
          id="items-per-page"
          [value]="itemsPerPage"
          (change)="onItemsPerPageChange($event)"
          class="items-select"
          aria-label="Items per page"
        >
          <option [value]="5">5</option>
          <option [value]="10">10</option>
          <option [value]="25">25</option>
          <option [value]="50">50</option>
        </select>
      </div>
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .pagination-container {
        @apply flex flex-col items-center justify-between;
        @apply p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
      }

      @media (min-width: 640px) {
        .pagination-container {
          @apply flex-row;
        }
      }

      .pagination-info {
        @apply order-2;
      }

      @media (min-width: 640px) {
        .pagination-info {
          @apply order-1;
        }
      }

      .pagination-controls {
        @apply flex items-center order-1 mx-2;
      }

      @media (min-width: 640px) {
        .pagination-controls {
          @apply order-2;
        }
      }

      .pagination-button {
        @apply flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
      }

      .page-numbers {
        @apply flex items-center mx-1;
      }

      .page-button {
        @apply w-10 h-10 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200;
      }

      .page-button.active {
        @apply bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500;
      }

      .items-per-page {
        @apply flex items-center order-3 mx-2;
      }

      .items-select {
        @apply px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer;
      }
    `,
  ],
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalCount = 0;
  @Input() itemsPerPage = 5;
  @Input() maxVisiblePages = 5;

  @Output() pageChange = new EventEmitter<number>();
  @Output() itemsPerPageChange = new EventEmitter<number>();

  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;

  get startItem(): number {
    return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalCount);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const halfVisible = Math.floor(this.maxVisiblePages / 2);

    let start = Math.max(1, this.currentPage - halfVisible);
    const end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);

    if (end - start + 1 < this.maxVisiblePages) {
      start = Math.max(1, end - this.maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onItemsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newItemsPerPage = parseInt(select.value, 10);
    if (newItemsPerPage !== this.itemsPerPage) {
      this.itemsPerPageChange.emit(newItemsPerPage);
    }
  }
}
