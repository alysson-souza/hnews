// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { getDomain } from '../../services/domain.utils';

/**
 * Transform anchor elements in the provided HTML so that:
 * - The anchor text becomes just the domain (hostname without www.).
 * - The original href is preserved; rel attributes are expanded for safety.
 * - A class `ext-link` is added for styling (smaller, subtle).
 */
export function transformLinksToDomain(html: string): string {
  if (!html || typeof document === 'undefined') return html || '';

  try {
    const container = document.createElement('div');
    container.innerHTML = html;

    const anchors = Array.from(container.querySelectorAll('a')) as HTMLAnchorElement[];
    for (const a of anchors) {
      const rawHref = a.getAttribute('href') || '';
      const href = rawHref.trim();
      if (!href) continue;

      // Extract domain using shared utility
      const domain = getDomain(href);
      if (!domain) continue;

      // Replace visible text with domain only and mark with a class
      a.textContent = domain;
      a.classList.add('ext-link');

      // Fallback: enforce smaller size inline to win over conflicting styles
      const existingStyle = a.getAttribute('style') || '';
      const smallStyle = 'font-size:0.75rem;line-height:1.15rem;';
      a.setAttribute('style', `${existingStyle} ${smallStyle}`.trim());

      // Preserve original URL in title for discoverability
      if (!a.getAttribute('title')) {
        a.setAttribute('title', href);
      }

      // Ensure safe rel attributes
      const rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      for (const needed of ['noopener', 'noreferrer', 'nofollow']) {
        if (!rel.includes(needed)) rel.push(needed);
      }
      a.setAttribute('rel', rel.join(' ').trim());

      // Open in a new tab by default (except for in-page anchors and mailto links)
      const lowerHref = href.toLowerCase();
      const isAnchor = lowerHref.startsWith('#');
      const isMailto = lowerHref.startsWith('mailto:');
      if (!isAnchor && !isMailto) {
        a.setAttribute('target', '_blank');
      }
    }

    return container.innerHTML;
  } catch {
    return html;
  }
}
