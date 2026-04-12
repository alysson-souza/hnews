#!/usr/bin/env node
// Patches the built ngsw-worker.js so that Driver.handleFetch catches all
// errors instead of re-throwing non-critical ones.  Without this patch the
// service worker crashes respondWith when the cache is empty and the network
// is unreachable.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browserDirs = [
  join(root, 'dist', 'hnews', 'browser'),
  join(root, 'dist', 'hnews-cf', 'browser'),
  join(root, 'dist', 'hnews-gh', 'browser'),
];
const versionInfoPath = join(root, 'public', 'version.json');
const versionInfo = JSON.parse(readFileSync(versionInfoPath, 'utf8'));

let patchedAny = false;

for (const browserDir of browserDirs) {
  patchedAny = patchNgswWorker(join(browserDir, 'ngsw-worker.js')) || patchedAny;
  patchedAny = patchNgswManifest(join(browserDir, 'ngsw.json')) || patchedAny;
}

if (!patchedAny) {
  console.error('patch-ngsw: no Angular production build outputs found');
  process.exit(1);
}

function patchNgswWorker(file) {
  if (!existsSync(file)) {
    return false;
  }

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

  const replacement = [
    'return this.safeFetch(event.request);',
    '            }',
    '            return self.caches.match(event.request)',
    '              .then(function(c){return c||self.caches.match("/index.html")})',
    '              .then(function(c){return c||self.fetch(event.request).catch(function(){',
    '                return new Response("Offline",{status:503,headers:{"Content-Type":"text/html"}})',
    '              })});',
  ].join('\n');

  if (src.includes(replacement)) {
    console.log(`patch-ngsw: offline fallback already present in ${file}`);
    return true;
  }

  if (!src.includes(needle)) {
    console.error(`patch-ngsw: pattern not found in ${file} — ngsw-worker.js may have changed`);
    process.exit(1);
  }

  src = src.replace(needle, replacement);
  writeFileSync(file, src);
  console.log(`patch-ngsw: patched Driver.handleFetch error handler in ${file}`);
  return true;
}

function patchNgswManifest(file) {
  if (!existsSync(file)) {
    return false;
  }

  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  manifest.appData = {
    version: versionInfo.version,
    commit: versionInfo.commitSha,
    commitShaShort: versionInfo.commitShaShort,
    buildTime: versionInfo.buildTime,
  };

  writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`patch-ngsw: injected appData into ${file}`);
  return true;
}
