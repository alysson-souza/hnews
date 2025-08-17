// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'hnews-theme';
  private document = inject(DOCUMENT);

  theme = signal<Theme>('auto');
  effectiveTheme = signal<'light' | 'dark'>('light');

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.loadTheme();
    this.setupThemeEffect();
    this.setupSystemThemeListener();
  }

  private loadTheme(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);

    // Apply the theme immediately on load to avoid FOUC
    const htmlElement = this.document.documentElement;
    htmlElement.classList.toggle('dark', stored === 'dark' || (!stored && this.mediaQuery.matches));

    if (stored === 'light' || stored === 'dark') {
      this.theme.set(stored);
    } else {
      this.theme.set('auto');
    }
  }

  private setupThemeEffect(): void {
    effect(() => {
      const theme = this.theme();
      this.applyTheme(theme);
    });
  }

  private setupSystemThemeListener(): void {
    this.mediaQuery.addEventListener('change', () => {
      if (this.theme() === 'auto') {
        this.applyTheme('auto');
      }
    });
  }

  private applyTheme(theme: Theme): void {
    const htmlElement = this.document.documentElement;

    if (theme === 'light') {
      localStorage.setItem(this.STORAGE_KEY, 'light');
      htmlElement.classList.remove('dark');
      this.effectiveTheme.set('light');
    } else if (theme === 'dark') {
      localStorage.setItem(this.STORAGE_KEY, 'dark');
      htmlElement.classList.add('dark');
      this.effectiveTheme.set('dark');
    } else {
      // Auto mode - respect OS preference
      localStorage.removeItem(this.STORAGE_KEY);
      const prefersDark = this.mediaQuery.matches;
      htmlElement.classList.toggle('dark', prefersDark);
      this.effectiveTheme.set(prefersDark ? 'dark' : 'light');
    }

    // Update PWA theme color
    const metaThemeColor = this.document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const current = this.effectiveTheme();
      metaThemeColor.setAttribute('content', current === 'dark' ? '#1f2937' : '#3B5998');
    }
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  toggleTheme(): void {
    const current = this.theme();
    if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('auto');
    } else {
      this.setTheme('light');
    }
  }

  getNextThemeLabel(): string {
    const current = this.theme();
    if (current === 'light') return 'Dark';
    if (current === 'dark') return 'Auto';
    return 'Light';
  }
}
