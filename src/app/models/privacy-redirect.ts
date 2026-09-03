// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

/**
 * Supported privacy frontend services.
 * Each service maps to a specific privacy-respecting frontend.
 */
export type PrivacyService = 'twitter' | 'youtube' | 'reddit' | 'medium' | 'instagram' | 'tiktok';

/**
 * Configuration for a privacy redirect service.
 * Defines how to match URLs and where to redirect them.
 */
export interface PrivacyRedirectConfig {
  /** Unique service identifier */
  readonly service: PrivacyService;
  /** Human-readable display name */
  readonly displayName: string;
  /** Fixed destination origin */
  readonly baseUrl: string;
  /** Regex patterns to match URLs for this service */
  readonly urlPatterns: readonly RegExp[];
}

/**
 * User settings for privacy redirects.
 */
export interface PrivacyRedirectSettings {
  /** Whether Twitter/X redirects are enabled */
  readonly enabled: boolean;
}

/**
 * Default privacy redirect settings.
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacyRedirectSettings = {
  enabled: true,
} as const;

/**
 * Registry of all supported privacy redirect configurations.
 */
export const PRIVACY_REDIRECT_REGISTRY: readonly PrivacyRedirectConfig[] = [
  {
    service: 'twitter',
    displayName: 'Twitter/X → Twitter Viewer',
    baseUrl: 'https://twitterviewer.net/',
    urlPatterns: [
      /^https?:\/\/(www\.|mobile\.)?twitter\.com\/[A-Za-z0-9_]{1,15}(?:\/status\/\d+)?\/?(?:[?#].*)?$/,
      /^https?:\/\/(www\.|mobile\.)?x\.com\/[A-Za-z0-9_]{1,15}(?:\/status\/\d+)?\/?(?:[?#].*)?$/,
    ],
  },
] as const;
