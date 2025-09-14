// SPDX-License-Identifier: MIT
// Utility to build stable, versioned cache keys across services.
import { Injectable, inject } from '@angular/core';
import { CACHE_NAMESPACE_VERSION } from '../config/cache.config';

export type KeyInput =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null
  | undefined;

function stableStringify(value: KeyInput): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== 'object') return String(value);

  if (Array.isArray(value)) {
    const arr = value as unknown[];
    return `[${arr.map((v) => stableStringify(v as KeyInput)).join(',')}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((k) => `${k}:${stableStringify(obj[k] as KeyInput)}`);
  return `{${pairs.join(',')}}`;
}

@Injectable({ providedIn: 'root' })
export class CacheKeyBuilderService {
  private readonly version = inject(CACHE_NAMESPACE_VERSION);

  build(resource: string, params?: KeyInput): string {
    const p = params === undefined ? '' : `:${stableStringify(params)}`;
    return `${this.version}:${resource}${p}`;
  }

  // Convenience helpers used around the app
  storyListKey(listType: string): string {
    return this.build('storyList', { type: listType });
  }

  storyKey(id: number | string): string {
    return this.build('story', { id: Number(id) });
  }

  userKey(id: string): string {
    return this.build('user', { id });
  }
}
