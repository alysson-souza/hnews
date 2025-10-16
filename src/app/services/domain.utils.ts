// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

/**
 * Extracts and normalizes the domain from a URL.
 * Handles URLs with or without protocols and provides fallback regex parsing.
 *
 * @param url The URL to extract domain from
 * @returns The normalized domain name (without www prefix), or empty string if invalid
 */
export function getDomain(url?: string): string {
  if (!url) return '';

  try {
    const href = url.trim();
    if (!href) return '';

    // Try to parse the URL; support protocol-relative and missing protocol by prefixing with https://
    let domain = '';
    try {
      const normalized = href.match(/^https?:\/\//i) ? href : `https://${href.replace(/^\/+/, '')}`;
      const parsedUrl = new URL(normalized);
      const hostname = (parsedUrl.hostname || '').replace(/^www\./i, '');
      // Only accept if it looks like a domain (contains a dot or is localhost)
      if (hostname && (/\./.test(hostname) || hostname === 'localhost')) {
        domain = hostname;
      }
    } catch {
      // Fallback: crude domain extraction using regex
      const match = href.match(/^(?:https?:\/\/)?([^/:?#]+)(?:[/:?#]|$)/i);
      const extracted = (match?.[1] || '').replace(/^www\./i, '');
      // Only accept if it looks like a domain (contains a dot or is localhost)
      domain = extracted && (/\./.test(extracted) || extracted === 'localhost') ? extracted : '';
    }

    return domain;
  } catch {
    return '';
  }
}
