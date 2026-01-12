// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { Observable, of, firstValueFrom } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AlgoliaApiClient } from '../data/algolia-api.client';
import { CacheManagerService } from './cache-manager.service';
import { HNItem } from '../models/hn';
import { AlgoliaItemResponse, flattenAlgoliaItemTree } from '../models/algolia';

/**
 * Result of bulk loading a story with all its comments.
 */
export interface BulkLoadResult {
  /** The story/item that was loaded */
  story: HNItem;
  /** Map of all comment IDs to their HNItem data */
  commentsMap: Map<number, HNItem>;
  /** Total number of comments loaded */
  commentCount: number;
}

/**
 * Service for loading stories with all comments in a single Algolia API request.
 *
 * The Algolia /items/{id} endpoint returns the entire comment tree nested
 * in the `children` array, avoiding the N+1 request problem of the
 * Firebase HN API.
 *
 * Performance comparison:
 * - Firebase API: 1 request for story + N requests for N comments = N+1 requests
 * - Algolia API: 1 request for story with ALL comments = 1 request
 *
 * For a story with 500 comments, this reduces requests from 501 to 1.
 */
@Injectable({
  providedIn: 'root',
})
export class AlgoliaCommentLoaderService {
  private algolia = inject(AlgoliaApiClient);
  private cache = inject(CacheManagerService);

  private readonly storyScope = 'story';

  /**
   * Load a story/item with all its comments in a single request.
   *
   * This fetches the entire comment tree from Algolia, flattens it,
   * and populates the cache so subsequent getItem() calls are instant.
   *
   * @param id - The story or item ID
   * @returns Observable with the story and a map of all comments
   */
  loadStoryWithComments(id: number): Observable<BulkLoadResult | null> {
    return this.algolia.getItem(id).pipe(
      map((response) => this.processAlgoliaResponse(response)),
      tap((result) => {
        if (result) {
          // Pre-populate cache with all items
          this.cacheAllItems(result);
        }
      }),
      catchError((error) => {
        console.error('Algolia bulk load failed:', error);
        return of(null);
      }),
    );
  }

  /**
   * Async version for easier use in components.
   */
  async loadStoryWithCommentsAsync(id: number): Promise<BulkLoadResult | null> {
    return firstValueFrom(this.loadStoryWithComments(id));
  }

  /**
   * Get a comment from a previously loaded bulk result.
   * This is O(1) lookup from the map.
   */
  getCommentFromResult(result: BulkLoadResult, commentId: number): HNItem | null {
    return result.commentsMap.get(commentId) ?? null;
  }

  /**
   * Get multiple comments from a previously loaded bulk result.
   */
  getCommentsFromResult(result: BulkLoadResult, commentIds: number[]): HNItem[] {
    return commentIds
      .map((id) => result.commentsMap.get(id))
      .filter((item): item is HNItem => item !== undefined);
  }

  /**
   * Process Algolia response into a flat map of items.
   */
  private processAlgoliaResponse(response: AlgoliaItemResponse): BulkLoadResult {
    // Flatten the nested tree into a map
    const flatMap = flattenAlgoliaItemTree(response);

    // Extract the story (root item)
    const story = flatMap.get(response.id) as HNItem;

    // Create a map of just the comments (exclude the root story)
    const commentsMap = new Map<number, HNItem>();
    for (const [id, item] of flatMap) {
      if (id !== response.id) {
        commentsMap.set(id, item as HNItem);
      }
    }

    return {
      story,
      commentsMap,
      commentCount: commentsMap.size,
    };
  }

  /**
   * Cache all items from a bulk load result.
   * This allows subsequent getItem() calls to hit the cache.
   */
  private async cacheAllItems(result: BulkLoadResult): Promise<void> {
    // Cache the story
    await this.cache.set(this.storyScope, result.story.id.toString(), result.story);

    // Cache all comments
    // Use Promise.all for parallel caching, but chunk to avoid overwhelming
    const entries = Array.from(result.commentsMap.entries());
    const chunkSize = 50;

    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(([id, item]) => this.cache.set(this.storyScope, id.toString(), item)),
      );
    }
  }

  /**
   * Check if Algolia bulk loading should be used for this story.
   *
   * Heuristic: Use Algolia for stories with more than a threshold of comments,
   * as the overhead of a slightly larger response is offset by avoiding N+1 requests.
   *
   * @param descendantsCount - The number of descendants (comments) on the story
   * @returns true if Algolia bulk loading is recommended
   */
  shouldUseBulkLoading(descendantsCount: number | undefined): boolean {
    // Use bulk loading if there are more than 5 comments
    // This threshold balances the benefit of bulk loading vs the slight
    // delay of a larger initial response
    return (descendantsCount ?? 0) > 5;
  }
}
