import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

interface HeaderRule {
  pattern: string;
  headers: string[];
}

function parseHeadersFile(source: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  let currentRule: HeaderRule | undefined;

  for (const rawLine of source.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (!rawLine.startsWith(' ') && !rawLine.startsWith('\t')) {
      currentRule = { pattern: trimmed, headers: [] };
      rules.push(currentRule);
      continue;
    }

    currentRule?.headers.push(trimmed);
  }

  return rules;
}

describe('Cloudflare Pages headers', () => {
  const rules = parseHeadersFile(readFileSync(join(cwd(), 'public/_headers'), 'utf8'));

  function headersFor(pattern: string): string[] {
    return rules.find((rule) => rule.pattern === pattern)?.headers ?? [];
  }

  it('caches fingerprinted root bundles immutably without matching service workers', () => {
    expect(headersFor('/*.js')).toEqual([]);
    expect(headersFor('/*.css')).toEqual([]);

    expect(headersFor('/main-*.js')).toContain(
      'Cache-Control: public, max-age=31536000, immutable',
    );
    expect(headersFor('/chunk-*.js')).toContain(
      'Cache-Control: public, max-age=31536000, immutable',
    );
    expect(headersFor('/polyfills-*.js')).toContain(
      'Cache-Control: public, max-age=31536000, immutable',
    );
    expect(headersFor('/styles-*.css')).toContain(
      'Cache-Control: public, max-age=31536000, immutable',
    );
  });

  it('keeps the service worker cache revalidating', () => {
    expect(headersFor('/ngsw-worker.js')).toEqual(['Cache-Control: no-cache']);
  });
});
