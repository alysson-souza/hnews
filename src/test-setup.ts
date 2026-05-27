// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
// Global test setup for Karma + Jasmine
// - Polyfill window.matchMedia used by ThemeService
// - Mock IndexedDB

import 'fake-indexeddb/auto';

const createMemoryStorage = (): Storage => {
  let store: Record<string, string> = {};
  const storage = {} as Storage & Record<string, string>;

  const syncKey = (key: string, value: string | null): void => {
    if (value === null) {
      delete storage[key];
      return;
    }

    Object.defineProperty(storage, key, {
      configurable: true,
      enumerable: true,
      value,
      writable: true,
    });
  };

  Object.defineProperties(storage, {
    length: {
      configurable: true,
      enumerable: false,
      get: () => Object.keys(store).length,
    },
    clear: {
      configurable: true,
      enumerable: false,
      value: () => {
        for (const key of Object.keys(store)) {
          syncKey(key, null);
        }
        store = {};
      },
    },
    getItem: {
      configurable: true,
      enumerable: false,
      value: (key: string) => store[key] ?? null,
    },
    key: {
      configurable: true,
      enumerable: false,
      value: (index: number) => Object.keys(store)[index] ?? null,
    },
    removeItem: {
      configurable: true,
      enumerable: false,
      value: (key: string) => {
        delete store[key];
        syncKey(key, null);
      },
    },
    setItem: {
      configurable: true,
      enumerable: false,
      value: (key: string, value: string) => {
        const stringValue = String(value);
        store[key] = stringValue;
        syncKey(key, stringValue);
      },
    },
  });

  return storage;
};

if (typeof window !== 'undefined' && !window.localStorage) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
}

if (typeof window !== 'undefined' && globalThis !== window) {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: () => window.localStorage,
  });
}

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
