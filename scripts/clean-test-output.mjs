#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Removes transient build & test output that can cause stale spec artifacts in CI.
// Safe to run repeatedly.
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const roots = [join(process.cwd(), 'dist', 'test-out')];

for (const p of roots) {
  try {
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
      console.log('[clean-test-output] Removed', p);
    }
  } catch (err) {
    console.warn('[clean-test-output] Failed to remove', p, err?.message || err);
  }
}

// We intentionally do NOT delete the removed component directory here because it has already
// been deleted from source; any reappearance would indicate an unexpected regeneration.
