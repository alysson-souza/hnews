import { InjectionToken } from '@angular/core';

export const CACHE_TTL_STORIES = new InjectionToken<number>('CACHE_TTL_STORIES', {
  providedIn: 'root',
  factory: () => 30 * 60 * 1000, // 30 minutes
});

export const CACHE_TTL_ITEM = new InjectionToken<number>('CACHE_TTL_ITEM', {
  providedIn: 'root',
  factory: () => 5 * 60 * 1000, // 5 minutes
});

export const CACHE_TTL_USER = new InjectionToken<number>('CACHE_TTL_USER', {
  providedIn: 'root',
  factory: () => 60 * 60 * 1000, // 1 hour
});

export const CACHE_TTL_SEARCH = new InjectionToken<number>('CACHE_TTL_SEARCH', {
  providedIn: 'root',
  factory: () => 10 * 60 * 1000, // 10 minutes
});
