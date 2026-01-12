// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, Subject, firstValueFrom, from } from 'rxjs';
import { HnApiClient } from '../data/hn-api.client';
import { CacheManagerService } from './cache-manager.service';
import { HNItem } from '../models/hn';

interface PendingRequest {
  id: number;
  resolve: (item: HNItem | null) => void;
  reject: (error: Error) => void;
}

/**
 * Batches individual item requests to reduce N+1 HTTP calls.
 *
 * Instead of making 500 HTTP requests for 500 comments, this service
 * queues requests and flushes them in batches (default: 20 items per batch
 * or every 50ms, whichever comes first).
 *
 * Usage: Inject this service and call getItem(id) - it returns a Promise
 * that resolves when the batch containing that item is fetched.
 */
@Injectable({
  providedIn: 'root',
})
export class BatchedItemLoaderService implements OnDestroy {
  private hn = inject(HnApiClient);
  private cache = inject(CacheManagerService);

  private readonly storyScope = 'story';
  private readonly BATCH_SIZE = 20;
  private readonly BATCH_DELAY_MS = 50;

  private pendingRequests: PendingRequest[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private destroyed$ = new Subject<void>();

  // Track in-flight fetches to deduplicate concurrent requests for same ID
  private inflightFetches = new Map<number, Promise<HNItem | null>>();

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    // Reject any pending requests
    for (const req of this.pendingRequests) {
      req.reject(new Error('Service destroyed'));
    }
    this.pendingRequests = [];
  }

  /**
   * Get a single item by ID. The request is queued and batched with others.
   * @param id Item ID to fetch
   * @param forceRefresh If true, bypass cache and fetch fresh data
   * @returns Promise resolving to HNItem or null
   */
  async getItem(id: number, forceRefresh = false): Promise<HNItem | null> {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await this.cache.get<HNItem>(this.storyScope, id.toString());
      if (cached !== null) {
        return cached;
      }
    }

    // Check if there's already an in-flight fetch for this ID
    const existing = this.inflightFetches.get(id);
    if (existing && !forceRefresh) {
      return existing;
    }

    // Create a new promise for this request
    const promise = new Promise<HNItem | null>((resolve, reject) => {
      this.pendingRequests.push({ id, resolve, reject });
      this.scheduleFlush();
    });

    // Track the in-flight fetch
    this.inflightFetches.set(id, promise);
    promise.finally(() => {
      this.inflightFetches.delete(id);
    });

    return promise;
  }

  /**
   * Get multiple items by IDs. Batches all requests together.
   * @param ids Array of item IDs to fetch
   * @param forceRefresh If true, bypass cache and fetch fresh data
   * @returns Promise resolving to array of HNItem or null
   */
  async getItems(ids: number[], forceRefresh = false): Promise<(HNItem | null)[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const promises = ids.map((id) => this.getItem(id, forceRefresh));
    return Promise.all(promises);
  }

  /**
   * Schedule a batch flush. Flushes immediately if batch size is reached,
   * otherwise waits for the delay timer.
   */
  private scheduleFlush(): void {
    // Flush immediately if we've hit batch size
    if (this.pendingRequests.length >= this.BATCH_SIZE) {
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout);
        this.flushTimeout = null;
      }
      this.flush();
      return;
    }

    // Otherwise, schedule a delayed flush if not already scheduled
    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => {
        this.flushTimeout = null;
        this.flush();
      }, this.BATCH_DELAY_MS);
    }
  }

  /**
   * Execute the batch: fetch all pending items in parallel and resolve promises.
   */
  private flush(): void {
    if (this.pendingRequests.length === 0) {
      return;
    }

    // Take up to BATCH_SIZE requests
    const batch = this.pendingRequests.splice(0, this.BATCH_SIZE);
    const ids = batch.map((req) => req.id);

    // Dedupe IDs in case same ID was requested multiple times in quick succession
    const uniqueIds = [...new Set(ids)];

    // Fetch all items in parallel
    this.fetchBatch(uniqueIds)
      .then((results) => {
        // Create a map for quick lookup
        const resultMap = new Map<number, HNItem | null>();
        for (const item of results) {
          if (item !== null) {
            resultMap.set(item.id, item);
          }
        }

        // Resolve each pending request
        for (const req of batch) {
          const item = resultMap.get(req.id) ?? null;
          req.resolve(item);
        }
      })
      .catch((error) => {
        // Reject all requests in this batch
        for (const req of batch) {
          req.reject(error);
        }
      });

    // If there are still pending requests, schedule another flush
    if (this.pendingRequests.length > 0) {
      this.scheduleFlush();
    }
  }

  /**
   * Fetch a batch of items from the API in parallel.
   */
  private async fetchBatch(ids: number[]): Promise<(HNItem | null)[]> {
    const promises = ids.map(async (id) => {
      try {
        const item = await firstValueFrom(this.hn.item(id));
        // Cache the result
        if (item !== null) {
          await this.cache.set(this.storyScope, id.toString(), item);
        }
        return item;
      } catch {
        return null;
      }
    });

    return Promise.all(promises);
  }

  /**
   * Observable wrapper for getItem, for compatibility with RxJS-based code.
   */
  getItem$(id: number, forceRefresh = false): Observable<HNItem | null> {
    return from(this.getItem(id, forceRefresh));
  }

  /**
   * Observable wrapper for getItems, for compatibility with RxJS-based code.
   */
  getItems$(ids: number[], forceRefresh = false): Observable<(HNItem | null)[]> {
    return from(this.getItems(ids, forceRefresh));
  }
}
