// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DeviceService implements OnDestroy {
  private userAgent = signal(typeof window !== 'undefined' ? window.navigator.userAgent : '');
  private windowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 0);
  private windowHeight = signal(typeof window !== 'undefined' ? window.innerHeight : 0);
  private resizeTimer?: number;

  // Store handler references for cleanup
  private resizeHandler?: () => void;
  private orientationHandler?: () => void;
  private visualViewportResizeHandler?: () => void;
  private visualViewportScrollHandler?: () => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.updateViewportDimensions();
      this.setupViewportListeners();
    }
  }

  private updateViewportDimensions(): void {
    if (typeof window === 'undefined') return;

    // Use Visual Viewport API if available (better for PWA)
    const visualViewport = window.visualViewport;
    const width = visualViewport?.width ?? window.innerWidth;
    const height = visualViewport?.height ?? window.innerHeight;

    this.windowWidth.set(width);
    this.windowHeight.set(height);

    // Update CSS custom properties for dynamic viewport units
    document.documentElement.style.setProperty('--viewport-width', `${width}px`);
    document.documentElement.style.setProperty('--viewport-height', `${height}px`);
    document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
  }

  private setupViewportListeners(): void {
    if (typeof window === 'undefined') return;

    // Debounced handler to prevent excessive updates during rotation
    this.resizeHandler = () => {
      if (this.resizeTimer) {
        window.clearTimeout(this.resizeTimer);
      }
      this.resizeTimer = window.setTimeout(() => {
        this.updateViewportDimensions();
        // Force reflow to ensure layout recalculation
        void document.body.offsetHeight;
      }, 150);
    };

    // Orientation change handler
    this.orientationHandler = () => {
      // Immediate update on orientation change
      this.updateViewportDimensions();
      // Follow up with debounced update in case dimensions settle
      this.resizeHandler!();
    };

    // Listen to resize events
    window.addEventListener('resize', this.resizeHandler);

    // Listen to orientation change events (critical for PWA)
    window.addEventListener('orientationchange', this.orientationHandler);

    // Use Visual Viewport API if available (better for mobile PWA)
    if (window.visualViewport) {
      this.visualViewportResizeHandler = this.resizeHandler;
      this.visualViewportScrollHandler = this.resizeHandler;

      window.visualViewport.addEventListener('resize', this.visualViewportResizeHandler);
      window.visualViewport.addEventListener('scroll', this.visualViewportScrollHandler);
    }
  }

  ngOnDestroy(): void {
    // Clear any pending timers
    if (this.resizeTimer) {
      window.clearTimeout(this.resizeTimer);
    }

    // Remove all event listeners
    if (typeof window !== 'undefined') {
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
      if (this.orientationHandler) {
        window.removeEventListener('orientationchange', this.orientationHandler);
      }

      // Clean up Visual Viewport API listeners
      if (window.visualViewport) {
        if (this.visualViewportResizeHandler) {
          window.visualViewport.removeEventListener('resize', this.visualViewportResizeHandler);
        }
        if (this.visualViewportScrollHandler) {
          window.visualViewport.removeEventListener('scroll', this.visualViewportScrollHandler);
        }
      }
    }
  }

  isMobile(): boolean {
    return this.windowWidth() < 640; // sm breakpoint
  }

  isTablet(): boolean {
    return this.windowWidth() >= 640 && this.windowWidth() < 1024; // Between sm and lg
  }

  isDesktop(): boolean {
    return this.windowWidth() >= 1024; // lg breakpoint
  }

  isMacOS(): boolean {
    return /Mac|iPhone|iPad|iPod/.test(this.userAgent());
  }

  getModifierKey(): string {
    return this.isMacOS() ? 'Cmd' : 'Ctrl';
  }

  shouldShowKeyboardHints(): boolean {
    return this.isDesktop();
  }

  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (this.isMobile()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  }
}
