// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  const pipe = new RelativeTimePipe();
  const baseMs = new Date('2025-01-01T00:00:00Z').getTime();

  it('returns empty string for null/undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('formats minutes', () => {
    const fiveMinAgoSeconds = Math.floor((baseMs - 5 * 60_000) / 1000);
    expect(pipe.transform(fiveMinAgoSeconds, baseMs)).toBe('5 minutes ago');
  });

  it('formats weeks', () => {
    const twoWeeksAgoSeconds = Math.floor((baseMs - 14 * 24 * 60 * 60 * 1000) / 1000);
    expect(pipe.transform(twoWeeksAgoSeconds, baseMs)).toBe('2 weeks ago');
  });

  it('formats months', () => {
    const twoMonthsApproxSeconds = Math.floor((baseMs - 65 * 24 * 60 * 60 * 1000) / 1000);
    expect(pipe.transform(twoMonthsApproxSeconds, baseMs)).toBe('2 months ago');
  });

  it('formats years', () => {
    const twoYearsSeconds = Math.floor((baseMs - 2 * 365 * 24 * 60 * 60 * 1000) / 1000);
    expect(pipe.transform(twoYearsSeconds, baseMs)).toBe('2 years ago');
  });

  it('handles Date objects', () => {
    const oneHourAgoDate = new Date(baseMs - 3600_000);
    expect(pipe.transform(oneHourAgoDate, baseMs)).toBe('1 hour ago');
  });

  it('handles ISO strings', () => {
    expect(pipe.transform('2024-12-31T21:00:00Z', baseMs)).toBe('3 hours ago');
  });
});
