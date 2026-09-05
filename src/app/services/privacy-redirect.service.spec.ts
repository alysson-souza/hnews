// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PRIVACY_REDIRECT_REGISTRY } from '@models/privacy-redirect';
import { PrivacyRedirectService } from './privacy-redirect.service';

const SETTINGS_STORAGE_KEY = 'privacy.redirect.settings.v1';

describe('PrivacyRedirectService', () => {
  let service: PrivacyRedirectService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [PrivacyRedirectService],
    });
    service = TestBed.inject(PrivacyRedirectService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('settings', () => {
    it('starts enabled and redirects immediately', () => {
      expect(service.settings().enabled).toBe(true);
      expect(service.settings().frontend).toBe('xcancel');
      expect(service.transformUrl('https://x.com/user')).toBe('https://xcancel.com/user');
    });

    it('persists master changes', () => {
      service.setEnabled(false);

      expect(service.settings().enabled).toBe(false);
      expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({
        enabled: false,
      });
    });

    it('synchronizes settings changes from another tab', () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: SETTINGS_STORAGE_KEY,
          newValue: JSON.stringify({
            enabled: false,
          }),
        }),
      );

      expect(service.settings().enabled).toBe(false);
    });
  });

  describe('transformUrl', () => {
    it.each([
      ['https://twitter.com/user', 'https://xcancel.com/user'],
      ['https://twitter.com/user/status/123', 'https://xcancel.com/user/status/123'],
      ['https://x.com/user', 'https://xcancel.com/user'],
      ['https://x.com/user/status/123', 'https://xcancel.com/user/status/123'],
    ])('rewrites %s to %s', (url, expected) => {
      expect(service.transformUrl(url)).toBe(expected);
    });

    it('preserves query strings and fragments', () => {
      expect(service.transformUrl('https://x.com/user/status/123?ref=hn#replies')).toBe(
        'https://xcancel.com/user/status/123?ref=hn#replies',
      );
    });

    it('uses Twitter Viewer when it is selected and persists the exclusive choice', () => {
      service.setFrontend('twitter-viewer');

      expect(service.settings()).toEqual({ enabled: true, frontend: 'twitter-viewer' });
      expect(service.transformUrl('https://x.com/user/status/123')).toBe(
        'https://twitterviewer.net/user/status/123',
      );
      expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toEqual({
        enabled: true,
        frontend: 'twitter-viewer',
      });
    });

    it('returns the original URL when the master toggle is disabled', () => {
      const url = 'https://twitter.com/user/status/123';

      service.setEnabled(false);

      expect(service.transformUrl(url)).toBe(url);
    });

    it.each([
      'https://example.com/page',
      'https://twitter.com/',
      'https://x.com/',
      'https://t.co/abc123',
      'https://pbs.twimg.com/media/image.jpg',
      'https://video.twimg.com/video.mp4',
      'https://platform.twitter.com/embed/Tweet.html?id=123',
      'https://platform.x.com/embed/Tweet.html?id=123',
    ])('leaves unsupported URL unchanged: %s', (url) => {
      expect(service.transformUrl(url)).toBe(url);
    });
  });

  describe('wouldRedirect', () => {
    it('classifies supported and unsupported URLs', () => {
      expect(service.wouldRedirect('https://twitter.com/user')).toBe(true);
      expect(service.wouldRedirect('https://x.com/user/status/123')).toBe(true);
      expect(service.wouldRedirect('https://t.co/abc123')).toBe(false);
    });

    it('honors the master toggle', () => {
      service.setEnabled(false);
      expect(service.wouldRedirect('https://twitter.com/user')).toBe(false);

      service.setEnabled(true);
    });
  });

  describe('getMatchingService', () => {
    it('returns the selected XCancel configuration', () => {
      expect(service.getMatchingService('https://x.com/user/status/123')).toEqual(
        PRIVACY_REDIRECT_REGISTRY[0],
      );
    });

    it('returns null for unsupported or disabled URLs', () => {
      expect(service.getMatchingService('https://t.co/abc123')).toBeNull();

      service.setEnabled(false);
      expect(service.getMatchingService('https://x.com/user')).toBeNull();
    });
  });
});
