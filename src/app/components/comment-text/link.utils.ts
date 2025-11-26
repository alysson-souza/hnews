// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { getDomain } from '../../services/domain.utils';

/**
 * Format a URL for display by extracting the domain and truncating the path.
 * Returns a string like "example.com" or "example.com/…/path" for display purposes.
 *
 * @param url The URL to format (can be with or without protocol)
 * @returns Formatted display text showing domain and optionally truncated path
 *
 * @example
 * formatUrlForDisplay('https://example.com') // 'example.com'
 * formatUrlForDisplay('https://github.com/user/repo') // 'github.com/…/user/repo'
 * formatUrlForDisplay('https://example.com/path?query=1#top') // 'example.com/…/path'
 */
export function formatUrlForDisplay(url: string): string {
  if (!url) return url;

  // Extract domain using shared utility
  const domain = getDomain(url);
  if (!domain) return url;

  // Construct display text: domain + last 15 chars of path (excluding query/anchor)
  let displayText = domain;
  try {
    // Normalize URL to ensure we can parse it
    const normalized = url.match(/^https?:\/\//i) ? url : `https://${url.replace(/^\/+/, '')}`;
    const urlObj = new URL(normalized);
    const path = urlObj.pathname;

    if (path && path !== '/') {
      // Remove trailing slash for cleaner display
      const cleanPath = path.replace(/\/$/, '');
      if (cleanPath.length > 0) {
        const last15 = cleanPath.slice(-15);
        displayText = `${domain}/…/${last15.replace(/^\//, '')}`;
      }
    }
  } catch {
    // If URL parsing fails, fallback to just domain (already set)
  }

  return displayText;
}
