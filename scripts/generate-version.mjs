#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolveSha(command) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

const rootDir = join(__dirname, '..');
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));

const commitSha = resolveSha('git rev-parse HEAD');
const shortCommitSha =
  commitSha !== 'unknown'
    ? resolveSha('git rev-parse --short HEAD') || commitSha.slice(0, 7)
    : 'unknown';
const buildTime = new Date().toISOString();
const version = packageJson.version ?? '0.0.0';

const outputDir = join(rootDir, 'public');
mkdirSync(outputDir, { recursive: true });
const outputPath = join(outputDir, 'version.json');
const contents = {
  version,
  buildTime,
  commitSha,
  commitShaShort: shortCommitSha,
};
writeFileSync(outputPath, JSON.stringify(contents, null, 2) + '\n', 'utf8');
