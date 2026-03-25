// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  isDevMode,
} from '@angular/core';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withInMemoryScrolling,
} from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { provideServiceWorker, type SwRegistrationOptions } from '@angular/service-worker';
import { NetworkStatusInterceptor } from '@services/network-status.interceptor';
import { APP_VERSION } from './config/version.config';
import { VERSION } from './version';

// Register immediately so the shell is precached on the first visit.
// This improves offline reopen reliability on mobile browsers.
export const serviceWorkerOptions: SwRegistrationOptions = {
  enabled: !isDevMode(),
  registrationStrategy: 'registerImmediately',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: NetworkStatusInterceptor, multi: true },
    { provide: APP_VERSION, useValue: VERSION },
    provideServiceWorker('ngsw-worker.js', serviceWorkerOptions),
  ],
};
