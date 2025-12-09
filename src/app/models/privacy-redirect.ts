// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

/**
 * Supported privacy frontend services.
 * Each service maps to a specific privacy-respecting frontend.
 */
export type PrivacyService = 'twitter' | 'youtube' | 'reddit' | 'medium' | 'instagram' | 'tiktok';

/**
 * Supported privacy frontend implementations.
 * Maps to the frontend names in libredirect config.
 */
export type PrivacyFrontend =
  | 'nitter' // Twitter → Nitter
  | 'invidious' // YouTube → Invidious
  | 'redlib' // Reddit → Redlib
  | 'scribe' // Medium → Scribe
  | 'proxigram' // Instagram → Proxigram
  | 'proxiTok'; // TikTok → ProxiTok

/**
 * Configuration for a privacy redirect service.
 * Defines how to match URLs and which frontend to use.
 */
export interface PrivacyRedirectConfig {
  /** Unique service identifier */
  readonly service: PrivacyService;
  /** Human-readable display name */
  readonly displayName: string;
  /** Frontend implementation to use */
  readonly frontend: PrivacyFrontend;
  /** Regex patterns to match URLs for this service (from libredirect) */
  readonly urlPatterns: readonly RegExp[];
  /** Whether this redirect is enabled by default */
  readonly enabledByDefault: boolean;
}

/**
 * Instance data fetched from libredirect.
 * Contains clearnet URLs for privacy frontends.
 */
export interface LibreDirectInstances {
  readonly [frontend: string]: {
    readonly clearnet: readonly string[];
    readonly tor: readonly string[];
    readonly i2p: readonly string[];
    readonly loki: readonly string[];
  };
}

/**
 * User settings for privacy redirects.
 */
export interface PrivacyRedirectSettings {
  /** Master toggle for all privacy redirects */
  readonly enabled: boolean;
  /** Per-service enable/disable state */
  readonly services: Readonly<Record<PrivacyService, boolean>>;
}

/**
 * Default privacy redirect settings.
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacyRedirectSettings = {
  enabled: true,
  services: {
    twitter: true,
    youtube: true,
    reddit: true,
    medium: true,
    instagram: true,
    tiktok: true,
  },
} as const;

/**
 * State of the privacy redirect service.
 */
export interface PrivacyRedirectState {
  /** Whether instances are currently being fetched */
  readonly loading: boolean;
  /** Error message if fetch failed */
  readonly error: string | null;
  /** Retry attempt count for exponential backoff */
  readonly retryCount: number;
  /** Next retry timestamp (ms since epoch) */
  readonly nextRetryAt: number | null;
  /** Whether instances are available for use */
  readonly ready: boolean;
}

/**
 * Registry of all supported privacy redirect configurations.
 * URL patterns sourced from libredirect config.json.
 */
export const PRIVACY_REDIRECT_REGISTRY: readonly PrivacyRedirectConfig[] = [
  {
    service: 'twitter',
    displayName: 'Twitter/X → Nitter',
    frontend: 'nitter',
    urlPatterns: [
      /^https?:\/\/(www\.|mobile\.)?twitter\.com\//,
      /^https?:\/\/(www\.|mobile\.)?x\.com\//,
      /^https?:\/\/(pbs\.|video\.)twimg\.com\//,
      /^https?:\/\/platform\.x\.com\/embed\//,
      /^https?:\/\/platform\.twitter\.com\/embed\//,
      /^https?:\/\/t\.co\//,
    ],
    enabledByDefault: true,
  },
  // Future services can be added here:
  // {
  //   service: 'youtube',
  //   displayName: 'YouTube → Invidious',
  //   frontend: 'invidious',
  //   urlPatterns: [...],
  //   enabledByDefault: true,
  // },
] as const;

/**
 * Cache TTL for libredirect instances (24 hours in milliseconds).
 */
export const INSTANCES_CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Base URL for libredirect instances data.
 */
export const LIBREDIRECT_INSTANCES_URL =
  'https://raw.githubusercontent.com/libredirect/instances/main/data.json';

/**
 * Exponential backoff configuration for retry logic.
 */
export const RETRY_CONFIG = {
  /** Initial delay in milliseconds */
  initialDelay: 1000,
  /** Maximum delay in milliseconds (5 minutes) */
  maxDelay: 5 * 60 * 1000,
  /** Multiplier for each retry */
  multiplier: 2,
  /** Maximum number of retries (0 = unlimited) */
  maxRetries: 0,
} as const;
