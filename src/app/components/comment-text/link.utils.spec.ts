// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { formatUrlForDisplay } from './link.utils';

describe('formatUrlForDisplay', () => {
  it('should return empty string for empty input', () => {
    expect(formatUrlForDisplay('')).toBe('');
  });

  it('should return just domain for root URLs', () => {
    expect(formatUrlForDisplay('https://example.com')).toBe('example.com');
    expect(formatUrlForDisplay('http://example.com')).toBe('example.com');
    expect(formatUrlForDisplay('https://example.com/')).toBe('example.com');
  });

  it('should return domain with truncated path', () => {
    expect(formatUrlForDisplay('https://github.com/user/repo')).toBe('github.com/…/user/repo');
    // '/path/to/resource' is 17 chars, last 15 is 'ath/to/resource'
    expect(formatUrlForDisplay('https://example.com/path/to/resource')).toBe(
      'example.com/…/ath/to/resource',
    );
  });

  it('should strip www. from domain', () => {
    expect(formatUrlForDisplay('https://www.example.com')).toBe('example.com');
    expect(formatUrlForDisplay('https://www.github.com/user/repo')).toBe('github.com/…/user/repo');
  });

  it('should handle protocol-relative URLs', () => {
    expect(formatUrlForDisplay('//example.com/path')).toBe('example.com/…/path');
    expect(formatUrlForDisplay('//example.com')).toBe('example.com');
  });

  it('should handle URLs without protocol', () => {
    expect(formatUrlForDisplay('example.com/path')).toBe('example.com/…/path');
    expect(formatUrlForDisplay('example.com')).toBe('example.com');
  });

  it('should exclude query parameters from display text', () => {
    expect(formatUrlForDisplay('https://example.com/path?query=123&sort=desc')).toBe(
      'example.com/…/path',
    );
  });

  it('should exclude anchors/fragments from display text', () => {
    expect(formatUrlForDisplay('https://example.com/path#section-1')).toBe('example.com/…/path');
  });

  it('should exclude both query and anchors from display text', () => {
    expect(formatUrlForDisplay('https://example.com/path?q=1#top')).toBe('example.com/…/path');
  });

  it('should handle complex URLs with subdomains', () => {
    expect(formatUrlForDisplay('https://news.ycombinator.com/item?id=12345')).toBe(
      'news.ycombinator.com/…/item',
    );
  });

  it('should handle malformed URLs gracefully', () => {
    expect(formatUrlForDisplay('not-a-url')).toBe('not-a-url');
  });

  it('should handle URLs with short paths (less than 15 chars)', () => {
    expect(formatUrlForDisplay('https://example.com/api')).toBe('example.com/…/api');
  });

  it('should handle URLs with exactly 15 char paths', () => {
    expect(formatUrlForDisplay('https://example.com/fifteenchars123')).toBe(
      'example.com/…/fifteenchars123',
    );
  });

  it('should truncate long paths to last 15 characters', () => {
    // '/very/long/path/to/some/resource' is 32 chars, last 15 is 'o/some/resource'
    expect(formatUrlForDisplay('https://example.com/very/long/path/to/some/resource')).toBe(
      'example.com/…/o/some/resource',
    );
  });

  it('should handle trailing slashes correctly', () => {
    expect(formatUrlForDisplay('https://example.com/path/')).toBe('example.com/…/path');
  });
});
