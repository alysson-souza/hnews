// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable } from '@angular/core';

export interface ScrollOptions {
  offset?: number; // Custom offset beyond header height
  behavior?: ScrollBehavior; // 'smooth' | 'auto' | 'instant'
  delay?: number; // Delay before scrolling (for content loading)
  force?: boolean; // Force scroll even if already visible
}

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  /**
   * Scroll to the top of the page with smooth behavior
   */
  scrollToTop(options?: ScrollOptions): Promise<void> {
    return this.performScroll(() => {
      window.scrollTo({
        top: 0,
        behavior: options?.behavior ?? 'smooth',
      });
    }, options?.delay);
  }

  /**
   * Scroll to an element by ID with automatic header offset
   */
  async scrollToElement(elementId: string, options?: ScrollOptions): Promise<void> {
    return this.performScroll(() => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Element with id '${elementId}' not found`);
        return;
      }

      const targetPosition = this.calculateTargetPosition(element, options?.offset);

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: options?.behavior ?? 'smooth',
      });
    }, options?.delay);
  }

  /**
   * Scroll an element into view (for keyboard navigation)
   */
  async scrollElementIntoView(element: Element, options?: ScrollIntoViewOptions): Promise<void> {
    return this.performScroll(() => {
      element.scrollIntoView({
        behavior: options?.behavior ?? 'smooth',
        block: options?.block ?? 'center',
        inline: options?.inline ?? 'nearest',
      });
    });
  }

  /**
   * Get the actual header height accounting for PWA safe area insets
   */
  getHeaderHeight(): number {
    const header = document.querySelector('.app-header');
    if (!header) {
      return 80; // Fallback height
    }
    return header.getBoundingClientRect().height;
  }

  /**
   * Calculate target scroll position for an element with header offset
   */
  private calculateTargetPosition(element: HTMLElement, customOffset?: number): number {
    const elementRect = element.getBoundingClientRect();
    const elementTop = elementRect.top + window.scrollY;
    const headerHeight = this.getHeaderHeight();
    const totalOffset = headerHeight + (customOffset ?? 0);

    return elementTop - totalOffset;
  }

  /**
   * Perform scroll with optional delay
   */
  private performScroll(scrollFn: () => void, delay?: number): Promise<void> {
    return new Promise((resolve) => {
      if (delay && delay > 0) {
        setTimeout(() => {
          scrollFn();
          resolve();
        }, delay);
      } else {
        scrollFn();
        resolve();
      }
    });
  }
}
