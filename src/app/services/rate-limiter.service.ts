// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable } from '@angular/core';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestQueue {
  timestamps: number[];
  pending: (() => void)[];
}

@Injectable({
  providedIn: 'root',
})
export class RateLimiterService {
  private queues = new Map<string, RequestQueue>();

  private readonly limits: Record<string, RateLimitConfig> = {
    hackernews: { maxRequests: 30, windowMs: 60000 }, // 30 requests per minute
    algolia: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    microlink: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  };

  async throttle<T = unknown>(key: string, fn: () => Promise<T>): Promise<T> {
    const config = this.limits[key] || { maxRequests: 10, windowMs: 60000 };

    if (!this.queues.has(key)) {
      this.queues.set(key, { timestamps: [], pending: [] });
    }

    const queue = this.queues.get(key)!;
    const now = Date.now();

    // Clean old timestamps
    queue.timestamps = queue.timestamps.filter((t) => now - t < config.windowMs);

    // Check if we can make request immediately
    if (queue.timestamps.length < config.maxRequests) {
      queue.timestamps.push(now);
      return fn();
    }

    // Calculate delay needed
    const oldestTimestamp = queue.timestamps[0];
    const delay = oldestTimestamp + config.windowMs - now;

    // Wait and retry
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await this.throttle(key, fn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  // Method to check if we're approaching rate limit
  isNearLimit(key: string): boolean {
    const config = this.limits[key];
    if (!config) return false;

    const queue = this.queues.get(key);
    if (!queue) return false;

    const now = Date.now();
    const recentRequests = queue.timestamps.filter((t) => now - t < config.windowMs);

    return recentRequests.length >= config.maxRequests * 0.8; // 80% threshold
  }

  // Get current usage stats
  getUsageStats(key: string): { current: number; max: number; resetIn: number } {
    const config = this.limits[key];
    if (!config) return { current: 0, max: 0, resetIn: 0 };

    const queue = this.queues.get(key);
    if (!queue || queue.timestamps.length === 0) {
      return { current: 0, max: config.maxRequests, resetIn: 0 };
    }

    const now = Date.now();
    const recentRequests = queue.timestamps.filter((t) => now - t < config.windowMs);
    const oldestTimestamp = recentRequests[0] || now;
    const resetIn = Math.max(0, oldestTimestamp + config.windowMs - now);

    return {
      current: recentRequests.length,
      max: config.maxRequests,
      resetIn,
    };
  }

  // Batch throttle - execute multiple functions with rate limiting
  async throttleBatch<T = unknown>(key: string, fns: (() => Promise<T>)[]): Promise<T[]> {
    const results: T[] = [];

    for (const fn of fns) {
      const result = await this.throttle(key, fn);
      results.push(result);
    }

    return results;
  }

  // Get available capacity for immediate requests
  getAvailableCapacity(key: string): number {
    const config = this.limits[key];
    if (!config) return 0;

    const queue = this.queues.get(key);
    if (!queue) return config.maxRequests;

    const now = Date.now();
    const recentRequests = queue.timestamps.filter((t) => now - t < config.windowMs);

    return Math.max(0, config.maxRequests - recentRequests.length);
  }
}
