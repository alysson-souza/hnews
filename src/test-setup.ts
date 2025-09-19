// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
// Global test setup for Vitest + Angular
// - Polyfill window.matchMedia used by ThemeService

import { beforeAll } from 'vitest';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Initialize Angular testing environment once before all tests
beforeAll(() => {
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
});

// In some environments, `matchMedia` may exist but not be a function.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  // Minimal matchMedia polyfill for tests
  // It doesn't evaluate media queries; just returns a stable object
  // with the API surface used in code.
  window.matchMedia = (query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {
        /* no-op */
      },
      removeEventListener: () => {
        /* no-op */
      },
      addListener: () => {
        /* no-op */
      },
      removeListener: () => {
        /* no-op */
      },
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
}
