// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { InjectionToken } from '@angular/core';

export const CACHE_TTL_STORIES = new InjectionToken<number>('CACHE_TTL_STORIES', {
  providedIn: 'root',
  factory: () => 5 * 60 * 1000, // 5 minutes (for story lists - top/best/new/etc)
});

export const CACHE_TTL_ITEM = new InjectionToken<number>('CACHE_TTL_ITEM', {
  providedIn: 'root',
  factory: () => 30 * 60 * 1000, // 30 minutes (for individual story items)
});

export const CACHE_TTL_USER = new InjectionToken<number>('CACHE_TTL_USER', {
  providedIn: 'root',
  factory: () => 60 * 60 * 1000, // 1 hour
});

export const CACHE_TTL_SEARCH = new InjectionToken<number>('CACHE_TTL_SEARCH', {
  providedIn: 'root',
  factory: () => 10 * 60 * 1000, // 10 minutes
});

export const CACHE_TTL_METADATA = new InjectionToken<number>('CACHE_TTL_METADATA', {
  providedIn: 'root',
  factory: () => 60 * 1000, // 1 minute (metadata changes frequently)
});

export const CACHE_TTL_OG_IMAGE = new InjectionToken<number>('CACHE_TTL_OG_IMAGE', {
  providedIn: 'root',
  factory: () => 7 * 24 * 60 * 60 * 1000, // 7 days (OG images rarely change)
});

// Versioned cache namespace to allow seamless invalidation on schema changes
export const CACHE_NAMESPACE_VERSION = new InjectionToken<string>('CACHE_NAMESPACE_VERSION', {
  providedIn: 'root',
  factory: () => 'v1',
});
