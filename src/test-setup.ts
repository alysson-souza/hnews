// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
// Global test setup for Karma + Jasmine
// - Polyfill window.matchMedia used by ThemeService

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
