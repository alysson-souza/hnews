// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private userAgent = signal(typeof window !== 'undefined' ? window.navigator.userAgent : '');
  private windowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 0);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.windowWidth.set(window.innerWidth);
      });
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
