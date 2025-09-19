// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

/**
 * Formats a timestamp or date-like input into a relative time string.
 * Supported inputs:
 *  - Unix seconds timestamp (e.g. 1716123456)
 *  - Unix milliseconds timestamp (e.g. 1716123456000)
 *  - Date ISO/string (passed to Date constructor)
 *  - Date instance
 * Future (ahead of now) values resolve to 'just now'.
 */
export function formatRelativeTime(
  input: number | string | Date,
  nowMs: number = Date.now(),
): string {
  let targetMs: number;

  if (typeof input === 'number') {
    // Heuristic: treat numbers >= 10^11 as ms (current epoch ms ~ 1.7e12), otherwise seconds.
    targetMs = input >= 1e11 ? input : input * 1000;
  } else if (input instanceof Date) {
    targetMs = input.getTime();
  } else {
    const parsed = new Date(input);
    targetMs = isNaN(parsed.getTime()) ? nowMs : parsed.getTime();
  }

  let diffSeconds = Math.floor((nowMs - targetMs) / 1000);
  if (diffSeconds < 0) diffSeconds = 0; // Future-safe

  const minutes = Math.floor(diffSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30); // Approximation
  const years = Math.floor(days / 365); // Approximation

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

// Convenience alias for code that only deals in unix seconds.
export function formatRelativeTimeFromSeconds(seconds: number, nowMs: number = Date.now()): string {
  return formatRelativeTime(seconds, nowMs);
}
