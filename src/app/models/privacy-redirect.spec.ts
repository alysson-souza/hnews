// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { describe, expect, it } from 'vitest';
import { PRIVACY_REDIRECT_REGISTRY } from './privacy-redirect';

describe('Privacy Redirect Models', () => {
  describe('PRIVACY_REDIRECT_REGISTRY', () => {
    it('lists XCancel as the default frontend before Twitter Viewer', () => {
      expect(
        PRIVACY_REDIRECT_REGISTRY.map(({ frontend, baseUrl }) => ({ frontend, baseUrl })),
      ).toEqual([
        { frontend: 'xcancel', baseUrl: 'https://xcancel.com/' },
        { frontend: 'twitter-viewer', baseUrl: 'https://twitterviewer.net/' },
      ]);
    });

    it.each([
      'https://www.twitter.com/user/status/123',
      'https://mobile.twitter.com/user',
      'https://www.x.com/user/status/123',
      'https://mobile.x.com/user',
    ])('matches supported Twitter/X URL %s', (url) => {
      const twitterConfig = PRIVACY_REDIRECT_REGISTRY.find(
        (config) => config.service === 'twitter',
      );

      expect(twitterConfig).toBeDefined();
      expect(twitterConfig?.urlPatterns.some((pattern) => pattern.test(url))).toBe(true);
    });

    it.each(['https://nottwitter.com/user'])('does not match unsupported URL %s', (url) => {
      const twitterConfig = PRIVACY_REDIRECT_REGISTRY.find(
        (config) => config.service === 'twitter',
      );

      expect(twitterConfig).toBeDefined();
      expect(twitterConfig?.urlPatterns.some((pattern) => pattern.test(url))).toBe(false);
    });
  });
});
