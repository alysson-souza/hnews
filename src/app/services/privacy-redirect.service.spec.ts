// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PrivacyRedirectService } from './privacy-redirect.service';
import { LibreDirectApiClient } from '../data/libredirect-api.client';
import { LibreDirectInstances } from '../models/privacy-redirect';

describe('PrivacyRedirectService', () => {
  let service: PrivacyRedirectService;
  let mockApiClient: {
    fetchInstances: ReturnType<typeof vi.fn>;
    getClearnetInstances: ReturnType<typeof vi.fn>;
    clearCache: ReturnType<typeof vi.fn>;
  };

  const mockInstances: LibreDirectInstances = {
    nitter: {
      clearnet: ['https://nitter.example.com', 'https://nitter2.example.com'],
      tor: [],
      i2p: [],
      loki: [],
    },
  };

  beforeEach(() => {
    localStorage.clear();

    mockApiClient = {
      fetchInstances: vi.fn().mockReturnValue(of(mockInstances)),
      getClearnetInstances: vi.fn().mockReturnValue(['https://nitter.example.com']),
      clearCache: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PrivacyRedirectService,
        { provide: LibreDirectApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(PrivacyRedirectService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should fetch instances on init when enabled by default', () => {
      // Default is now enabled, so it should auto-fetch
      expect(mockApiClient.fetchInstances).toHaveBeenCalled();
    });

    it('should start with enabled state by default', () => {
      expect(service.settings().enabled).toBe(true);
    });
  });

  describe('setEnabled', () => {
    it('should enable redirects and fetch instances', () => {
      service.setEnabled(true);

      expect(service.settings().enabled).toBe(true);
      expect(mockApiClient.fetchInstances).toHaveBeenCalled();
    });

    it('should disable redirects', () => {
      service.setEnabled(true);
      service.setEnabled(false);

      expect(service.settings().enabled).toBe(false);
    });

    it('should persist settings to localStorage', () => {
      // Toggle off then on to ensure a write happens
      service.setEnabled(false);
      service.setEnabled(true);

      const stored = localStorage.getItem('privacy.redirect.settings.v1');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!).enabled).toBe(true);
    });
  });

  describe('setServiceEnabled', () => {
    it('should enable/disable individual services', () => {
      service.setEnabled(true);

      expect(service.settings().services.twitter).toBe(true);

      service.setServiceEnabled('twitter', false);
      expect(service.settings().services.twitter).toBe(false);

      service.setServiceEnabled('twitter', true);
      expect(service.settings().services.twitter).toBe(true);
    });
  });

  describe('transformUrl', () => {
    beforeEach(() => {
      service.setEnabled(true);
    });

    it('should transform Twitter URL to Nitter', () => {
      const result = service.transformUrl('https://twitter.com/user/status/123');

      expect(result).toContain('nitter.example.com');
      expect(result).toContain('/user/status/123');
    });

    it('should transform X.com URL to Nitter', () => {
      const result = service.transformUrl('https://x.com/user/status/123');

      expect(result).toContain('nitter.example.com');
    });

    it('should not transform non-matching URLs', () => {
      const url = 'https://example.com/page';
      const result = service.transformUrl(url);

      expect(result).toBe(url);
    });

    it('should not transform when service is disabled', () => {
      service.setServiceEnabled('twitter', false);

      const url = 'https://twitter.com/user';
      const result = service.transformUrl(url);

      expect(result).toBe(url);
    });

    it('should return original URL when redirects are disabled', () => {
      service.setEnabled(false);

      const url = 'https://twitter.com/user';
      const result = service.transformUrl(url);

      expect(result).toBe(url);
    });
  });

  describe('wouldRedirect', () => {
    beforeEach(() => {
      service.setEnabled(true);
    });

    it('should return true for matching Twitter URLs', () => {
      // Verify service has initialized properly
      expect(service.registry).toBeDefined();
      expect(service.registry.length).toBeGreaterThan(0);

      expect(service.wouldRedirect('https://twitter.com/user')).toBe(true);
      expect(service.wouldRedirect('https://x.com/user')).toBe(true);
    });

    it('should return false for non-matching URLs', () => {
      expect(service.wouldRedirect('https://example.com')).toBe(false);
    });

    it('should return false when disabled', () => {
      service.setEnabled(false);

      expect(service.wouldRedirect('https://twitter.com/user')).toBe(false);
    });
  });

  describe('getMatchingService', () => {
    beforeEach(() => {
      service.setEnabled(true);
    });

    it('should return config for matching Twitter URL', () => {
      const config = service.getMatchingService('https://twitter.com/user');

      expect(config).not.toBeNull();
      expect(config?.service).toBe('twitter');
      expect(config?.frontend).toBe('nitter');
    });

    it('should return null for non-matching URL', () => {
      const config = service.getMatchingService('https://example.com');
      expect(config).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should set error state on fetch failure', () => {
      // Need fresh service with failing mock - clear and reinitialize
      localStorage.clear();
      mockApiClient.fetchInstances.mockReturnValue(of(null));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          PrivacyRedirectService,
          { provide: LibreDirectApiClient, useValue: mockApiClient },
        ],
      });

      const freshService = TestBed.inject(PrivacyRedirectService);
      expect(freshService.state().error).not.toBeNull();
      expect(freshService.state().ready).toBe(false);
    });

    it('should schedule retry on error', () => {
      // Need fresh service with failing mock
      localStorage.clear();
      mockApiClient.fetchInstances.mockReturnValue(of(null));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          PrivacyRedirectService,
          { provide: LibreDirectApiClient, useValue: mockApiClient },
        ],
      });

      const freshService = TestBed.inject(PrivacyRedirectService);
      expect(freshService.state().nextRetryAt).not.toBeNull();
      expect(freshService.state().retryCount).toBe(1);
    });
  });

  describe('refresh', () => {
    it('should clear cache and refetch', () => {
      service.setEnabled(true);

      mockApiClient.fetchInstances.mockClear();
      service.refresh();

      expect(mockApiClient.clearCache).toHaveBeenCalled();
      expect(mockApiClient.fetchInstances).toHaveBeenCalled();
    });
  });

  describe('isAvailable', () => {
    it('should be false when disabled', () => {
      service.setEnabled(false);
      expect(service.isAvailable()).toBe(false);
    });

    it('should be true when enabled and ready', () => {
      // Already enabled by default and instances fetched
      expect(service.isAvailable()).toBe(true);
    });

    it('should be false when enabled but not ready', () => {
      // Clear and set up fresh with failing API
      localStorage.clear();
      mockApiClient.fetchInstances.mockReturnValue(of(null));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          PrivacyRedirectService,
          { provide: LibreDirectApiClient, useValue: mockApiClient },
        ],
      });

      const freshService = TestBed.inject(PrivacyRedirectService);
      expect(freshService.isAvailable()).toBe(false);
    });
  });
});
