// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { formatRelativeTime, formatRelativeTimeFromSeconds } from './relative-time.util';

describe('formatRelativeTime', () => {
  const now = new Date('2025-01-01T00:00:00Z').getTime();

  it('returns just now for same moment', () => {
    expect(formatRelativeTime(now, now)).toBe('just now');
  });

  it('returns seconds as just now (<60)', () => {
    expect(formatRelativeTime(now - 30 * 1000, now)).toBe('just now');
  });

  it('handles future timestamps as just now', () => {
    expect(formatRelativeTime(now + 10000, now)).toBe('just now');
  });

  it('formats minutes', () => {
    expect(formatRelativeTime(now - 60 * 1000, now)).toBe('1 minute ago');
    expect(formatRelativeTime(now - 5 * 60 * 1000, now)).toBe('5 minutes ago');
  });

  it('formats hours', () => {
    expect(formatRelativeTime(now - 60 * 60 * 1000, now)).toBe('1 hour ago');
    expect(formatRelativeTime(now - 3 * 60 * 60 * 1000, now)).toBe('3 hours ago');
  });

  it('formats days', () => {
    expect(formatRelativeTime(now - 24 * 60 * 60 * 1000, now)).toBe('1 day ago');
    expect(formatRelativeTime(now - 3 * 24 * 60 * 60 * 1000, now)).toBe('3 days ago');
  });

  it('formats weeks', () => {
    expect(formatRelativeTime(now - 7 * 24 * 60 * 60 * 1000, now)).toBe('1 week ago');
    expect(formatRelativeTime(now - 2 * 7 * 24 * 60 * 60 * 1000, now)).toBe('2 weeks ago');
  });

  it('formats months (approx 30d)', () => {
    expect(formatRelativeTime(now - 30 * 24 * 60 * 60 * 1000, now)).toBe('1 month ago');
    expect(formatRelativeTime(now - 65 * 24 * 60 * 60 * 1000, now)).toBe('2 months ago');
  });

  it('formats years (approx 365d)', () => {
    expect(formatRelativeTime(now - 365 * 24 * 60 * 60 * 1000, now)).toBe('1 year ago');
    expect(formatRelativeTime(now - 2 * 365 * 24 * 60 * 60 * 1000, now)).toBe('2 years ago');
  });

  it('accepts unix seconds', () => {
    const seconds = Math.floor((now - 2 * 60 * 60 * 1000) / 1000); // 2 hours ago
    expect(formatRelativeTimeFromSeconds(seconds, now)).toBe('2 hours ago');
  });

  it('accepts Date instances', () => {
    expect(formatRelativeTime(new Date(now - 3600000), now)).toBe('1 hour ago');
  });

  it('accepts date strings', () => {
    expect(formatRelativeTime('2024-12-31T21:00:00Z', now)).toBe('3 hours ago');
  });
});
