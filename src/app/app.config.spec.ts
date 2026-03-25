// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { serviceWorkerOptions } from './app.config';

describe('appConfig service worker options', () => {
  it('registers the service worker immediately for offline-first shell caching', () => {
    expect(serviceWorkerOptions.registrationStrategy).toBe('registerImmediately');
  });
});
