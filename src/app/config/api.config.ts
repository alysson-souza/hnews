// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { InjectionToken, makeEnvironmentProviders } from '@angular/core';

/**
 * Configuration interface for external API services
 */
export interface ApiConfig {
  microlink?: {
    apiKey?: string;
    apiUrl?: string;
  };
}

/**
 * Injection token for API configuration
 * This token provides configuration for external API services like Microlink
 */
export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    microlink: {
      // API key can be configured if needed
      // For now, using the free tier without API key
      apiKey: undefined,
      apiUrl: 'https://api.microlink.io',
    },
  }),
});

/**
 * Provides API configuration for the application
 * @param config Optional configuration override
 */
export function provideApiConfig(config?: ApiConfig) {
  return makeEnvironmentProviders([
    {
      provide: API_CONFIG,
      useValue: config || {
        microlink: {
          apiKey: undefined,
          apiUrl: 'https://api.microlink.io',
        },
      },
    },
  ]);
}
