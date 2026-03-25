#!/usr/bin/env node
// Patches the built ngsw-worker.js so that Driver.handleFetch catches all
// errors instead of re-throwing non-critical ones.  Without this patch the
// service worker crashes respondWith when the cache is empty and the network
// is unreachable.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'dist', 'hnews', 'browser', 'ngsw-worker.js');

let src = readFileSync(file, 'utf8');

// The pattern we need to replace inside Driver.handleFetch:
//
//   if (err.isCritical) {
//     this.debugger.log(err, `Driver.handleFetch(version: ${appVersion.manifestHash})`);
//     await this.versionFailed(appVersion, err);
//     return this.safeFetch(event.request);
//   }
//   throw err;
//
// Replace the bare "throw err;" with a cache-then-network fallback so
// respondWith always receives a resolved Response.

const needle = [
  'return this.safeFetch(event.request);',
  '            }',
  '            throw err;',
].join('\n');

if (!src.includes(needle)) {
  console.error('patch-ngsw: pattern not found — ngsw-worker.js may have changed');
  process.exit(1);
}

const replacement = [
  'return this.safeFetch(event.request);',
  '            }',
  '            return self.caches.match(event.request)',
  '              .then(function(c){return c||self.caches.match("/index.html")})',
  '              .then(function(c){return c||self.fetch(event.request).catch(function(){',
  '                return new Response("Offline",{status:503,headers:{"Content-Type":"text/html"}})',
  '              })});',
].join('\n');

src = src.replace(needle, replacement);
writeFileSync(file, src);
console.log('patch-ngsw: patched Driver.handleFetch error handler');
