// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class KeyboardNavigationService {
  selectedIndex = signal<number | null>(null);
  totalItems = signal<number>(0);

  isSelected = computed(() => {
    const index = this.selectedIndex();
    return (itemIndex: number) => index === itemIndex;
  });

  setTotalItems(count: number): void {
    this.totalItems.set(count);
    const current = this.selectedIndex();
    if (current !== null && current >= count) {
      this.selectedIndex.set(count > 0 ? count - 1 : null);
    }
  }

  selectNext(): boolean {
    const current = this.selectedIndex();
    const total = this.totalItems();

    if (total === 0) return false;

    if (current === null) {
      this.selectedIndex.set(0);
      return true;
    }

    if (current < total - 1) {
      this.selectedIndex.set(current + 1);
      return true;
    }

    return false;
  }

  selectPrevious(): boolean {
    const current = this.selectedIndex();
    const total = this.totalItems();

    if (total === 0) return false;

    if (current === null) {
      this.selectedIndex.set(0);
      return true;
    }

    if (current > 0) {
      this.selectedIndex.set(current - 1);
      return true;
    }

    return false;
  }

  selectFirst(): void {
    if (this.totalItems() > 0) {
      this.selectedIndex.set(0);
    }
  }

  selectLast(): void {
    const total = this.totalItems();
    if (total > 0) {
      this.selectedIndex.set(total - 1);
    }
  }

  clearSelection(): void {
    this.selectedIndex.set(null);
  }

  setSelection(index: number): void {
    if (index >= 0 && index < this.totalItems()) {
      this.selectedIndex.set(index);
    }
  }

  setSelectedIndex(index: number | null): void {
    if (index === null || (index >= 0 && index < this.totalItems())) {
      this.selectedIndex.set(index);
    }
  }

  isAtLastItem(): boolean {
    const current = this.selectedIndex();
    const total = this.totalItems();
    return current !== null && current === total - 1;
  }

  isAtFirstItem(): boolean {
    const current = this.selectedIndex();
    return current === 0;
  }
}
