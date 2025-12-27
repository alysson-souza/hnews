// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { translateHnLink, isHnLink } from './hn-link.utils';

describe('isHnLink', () => {
  it('should return true for news.ycombinator.com URLs', () => {
    expect(isHnLink('https://news.ycombinator.com/item?id=12345')).toBe(true);
    expect(isHnLink('http://news.ycombinator.com/user?id=dang')).toBe(true);
    expect(isHnLink('https://news.ycombinator.com/')).toBe(true);
    expect(isHnLink('https://news.ycombinator.com')).toBe(true);
  });

  it('should handle www prefix', () => {
    expect(isHnLink('https://www.news.ycombinator.com/item?id=12345')).toBe(true);
  });

  it('should return false for non-HN URLs', () => {
    expect(isHnLink('https://example.com')).toBe(false);
    expect(isHnLink('https://ycombinator.com')).toBe(false);
    expect(isHnLink('https://hacker-news.firebaseio.com/v0/item/12345')).toBe(false);
  });

  it('should return false for empty or invalid input', () => {
    expect(isHnLink('')).toBe(false);
    expect(isHnLink('not-a-url')).toBe(false);
  });
});

describe('translateHnLink', () => {
  describe('item URLs', () => {
    it('should translate item URLs to internal routes', () => {
      expect(translateHnLink('https://news.ycombinator.com/item?id=12345')).toBe('/item/12345');
      expect(translateHnLink('http://news.ycombinator.com/item?id=99999999')).toBe(
        '/item/99999999',
      );
    });

    it('should handle www prefix for item URLs', () => {
      expect(translateHnLink('https://www.news.ycombinator.com/item?id=12345')).toBe('/item/12345');
    });

    it('should handle item URLs with additional query params', () => {
      expect(translateHnLink('https://news.ycombinator.com/item?id=12345&p=2')).toBe('/item/12345');
    });

    it('should handle item URLs with hash fragments', () => {
      expect(translateHnLink('https://news.ycombinator.com/item?id=12345#comment')).toBe(
        '/item/12345',
      );
    });
  });

  describe('user URLs', () => {
    it('should translate user URLs to internal routes', () => {
      expect(translateHnLink('https://news.ycombinator.com/user?id=dang')).toBe('/user/dang');
      expect(translateHnLink('http://news.ycombinator.com/user?id=pg')).toBe('/user/pg');
    });

    it('should handle www prefix for user URLs', () => {
      expect(translateHnLink('https://www.news.ycombinator.com/user?id=dang')).toBe('/user/dang');
    });

    it('should handle usernames with special characters', () => {
      expect(translateHnLink('https://news.ycombinator.com/user?id=user_123')).toBe(
        '/user/user_123',
      );
      expect(translateHnLink('https://news.ycombinator.com/user?id=user-name')).toBe(
        '/user/user-name',
      );
    });
  });

  describe('homepage URLs', () => {
    it('should translate root URLs to /top', () => {
      expect(translateHnLink('https://news.ycombinator.com')).toBe('/top');
      expect(translateHnLink('https://news.ycombinator.com/')).toBe('/top');
      expect(translateHnLink('http://news.ycombinator.com')).toBe('/top');
    });

    it('should translate news path to /top', () => {
      expect(translateHnLink('https://news.ycombinator.com/news')).toBe('/top');
      expect(translateHnLink('https://news.ycombinator.com/front')).toBe('/top');
    });

    it('should translate story type pages', () => {
      expect(translateHnLink('https://news.ycombinator.com/newest')).toBe('/newest');
      expect(translateHnLink('https://news.ycombinator.com/best')).toBe('/best');
      expect(translateHnLink('https://news.ycombinator.com/ask')).toBe('/ask');
      expect(translateHnLink('https://news.ycombinator.com/show')).toBe('/show');
      expect(translateHnLink('https://news.ycombinator.com/jobs')).toBe('/jobs');
    });
  });

  describe('search URLs', () => {
    it('should translate from URLs to search page', () => {
      expect(translateHnLink('https://news.ycombinator.com/from?site=example.com')).toBe(
        '/search?query=site:example.com',
      );
    });

    it('should translate submitted URLs to search page', () => {
      expect(translateHnLink('https://news.ycombinator.com/submitted?id=pg')).toBe(
        '/search?query=author:pg',
      );
    });
  });

  describe('non-HN URLs', () => {
    it('should return null for non-HN URLs', () => {
      expect(translateHnLink('https://example.com')).toBeNull();
      expect(translateHnLink('https://ycombinator.com')).toBeNull();
    });

    it('should return null for empty or invalid input', () => {
      expect(translateHnLink('')).toBeNull();
      expect(translateHnLink('not-a-url')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle missing id parameter in item URLs', () => {
      expect(translateHnLink('https://news.ycombinator.com/item')).toBeNull();
      expect(translateHnLink('https://news.ycombinator.com/item?')).toBeNull();
    });

    it('should handle missing id parameter in user URLs', () => {
      expect(translateHnLink('https://news.ycombinator.com/user')).toBeNull();
      expect(translateHnLink('https://news.ycombinator.com/user?')).toBeNull();
    });

    it('should handle unsupported HN paths gracefully', () => {
      expect(translateHnLink('https://news.ycombinator.com/login')).toBeNull();
      expect(translateHnLink('https://news.ycombinator.com/submit')).toBeNull();
      expect(translateHnLink('https://news.ycombinator.com/reply?id=12345')).toBeNull();
    });

    it('should handle protocol-relative URLs', () => {
      expect(translateHnLink('//news.ycombinator.com/item?id=12345')).toBe('/item/12345');
    });
  });
});
