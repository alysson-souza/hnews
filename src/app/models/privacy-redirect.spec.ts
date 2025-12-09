// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { describe, it, expect } from 'vitest';
import {
  PRIVACY_REDIRECT_REGISTRY,
  DEFAULT_PRIVACY_SETTINGS,
  INSTANCES_CACHE_TTL,
  RETRY_CONFIG,
} from './privacy-redirect';

describe('Privacy Redirect Models', () => {
  describe('PRIVACY_REDIRECT_REGISTRY', () => {
    it('should have Twitter redirect configuration', () => {
      const twitterConfig = PRIVACY_REDIRECT_REGISTRY.find((c) => c.service === 'twitter');

      expect(twitterConfig).toBeDefined();
      expect(twitterConfig?.frontend).toBe('nitter');
      expect(twitterConfig?.displayName).toBe('Twitter/X → Nitter');
    });

    it('should have valid URL patterns for Twitter', () => {
      const twitterConfig = PRIVACY_REDIRECT_REGISTRY.find((c) => c.service === 'twitter');
      const patterns = twitterConfig?.urlPatterns ?? [];

      // Test Twitter URLs
      expect(patterns.some((p) => p.test('https://twitter.com/user'))).toBe(true);
      expect(patterns.some((p) => p.test('https://www.twitter.com/user'))).toBe(true);
      expect(patterns.some((p) => p.test('https://mobile.twitter.com/user'))).toBe(true);

      // Test X.com URLs
      expect(patterns.some((p) => p.test('https://x.com/user'))).toBe(true);
      expect(patterns.some((p) => p.test('https://www.x.com/user'))).toBe(true);

      // Test t.co URLs
      expect(patterns.some((p) => p.test('https://t.co/abc123'))).toBe(true);

      // Test non-matching URLs
      expect(patterns.some((p) => p.test('https://example.com'))).toBe(false);
      expect(patterns.some((p) => p.test('https://nottwitter.com'))).toBe(false);
    });

    it('should have all required properties for each config', () => {
      PRIVACY_REDIRECT_REGISTRY.forEach((config) => {
        expect(config.service).toBeDefined();
        expect(config.displayName).toBeDefined();
        expect(config.frontend).toBeDefined();
        expect(config.urlPatterns).toBeDefined();
        expect(Array.isArray(config.urlPatterns)).toBe(true);
        expect(config.urlPatterns.length).toBeGreaterThan(0);
        expect(typeof config.enabledByDefault).toBe('boolean');
      });
    });
  });

  describe('DEFAULT_PRIVACY_SETTINGS', () => {
    it('should be enabled by default for discoverability', () => {
      expect(DEFAULT_PRIVACY_SETTINGS.enabled).toBe(true);
    });

    it('should have Twitter enabled by default', () => {
      expect(DEFAULT_PRIVACY_SETTINGS.services.twitter).toBe(true);
    });

    it('should have all services defined', () => {
      expect(DEFAULT_PRIVACY_SETTINGS.services).toHaveProperty('twitter');
      expect(DEFAULT_PRIVACY_SETTINGS.services).toHaveProperty('youtube');
      expect(DEFAULT_PRIVACY_SETTINGS.services).toHaveProperty('reddit');
      expect(DEFAULT_PRIVACY_SETTINGS.services).toHaveProperty('medium');
      expect(DEFAULT_PRIVACY_SETTINGS.services).toHaveProperty('instagram');
      expect(DEFAULT_PRIVACY_SETTINGS.services).toHaveProperty('tiktok');
    });
  });

  describe('INSTANCES_CACHE_TTL', () => {
    it('should be 24 hours in milliseconds', () => {
      expect(INSTANCES_CACHE_TTL).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('RETRY_CONFIG', () => {
    it('should have valid exponential backoff configuration', () => {
      expect(RETRY_CONFIG.initialDelay).toBe(1000);
      expect(RETRY_CONFIG.maxDelay).toBe(5 * 60 * 1000);
      expect(RETRY_CONFIG.multiplier).toBe(2);
      expect(RETRY_CONFIG.maxRetries).toBe(0); // 0 = unlimited
    });
  });
});
