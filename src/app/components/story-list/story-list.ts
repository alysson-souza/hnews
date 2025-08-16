// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HackernewsService, HNItem } from '../../services/hackernews.service';
import { StoryItem } from '../story-item/story-item';
import { StorySkeletonComponent } from '../story-skeleton/story-skeleton.component';
import { Observable, switchMap, map, tap } from 'rxjs';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { OpenGraphService, OpenGraphData } from '../../services/opengraph.service';
import { PageContainerComponent } from '../shared/page-container/page-container.component';

@Component({
  selector: 'app-story-list',
  standalone: true,
  imports: [CommonModule, StoryItem, StorySkeletonComponent, PageContainerComponent],
  templateUrl: './story-list.html',
  styleUrl: './story-list.css',
})
export class StoryList implements OnInit {
  @Input() storyType: 'top' | 'best' | 'new' | 'ask' | 'show' | 'job' = 'top';
  @Input() pageSize = 30;

  private hnService = inject(HackernewsService);
  private ogService = inject(OpenGraphService);
  sidebarService = inject(SidebarService);
  deviceService = inject(DeviceService);

  stories = signal<HNItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(0);
  totalStoryIds = signal<number[]>([]);
  openGraphData = signal<Map<string, OpenGraphData>>(new Map());

  ngOnInit() {
    this.loadStories();
  }

  loadStories() {
    this.loading.set(true);
    this.error.set(null);

    this.getStoryIds()
      .pipe(
        switchMap((ids) => {
          this.totalStoryIds.set(ids);
          const start = this.currentPage() * this.pageSize;
          const end = start + this.pageSize;
          const pageIds = ids.slice(start, end);
          return this.hnService.getItems(pageIds);
        }),
        map((items) => items.filter((item) => item !== null) as HNItem[]),
        tap((items) => {
          // Extract URLs from stories for OpenGraph fetching
          const urls = items
            .filter((item) => item.url && !this.isTextPost(item))
            .map((item) => item.url!);

          // Fetch OpenGraph data progressively
          if (urls.length > 0) {
            this.ogService.getOpenGraphDataBatch(urls).subscribe({
              next: (partialOgDataMap) => {
                // Accumulate partial results as they stream in
                this.openGraphData.update((existing) => {
                  const updated = new Map(existing);
                  partialOgDataMap.forEach((data, url) => {
                    updated.set(url, data);
                  });
                  return updated;
                });
              },
              error: (err) => {
                console.error('Error fetching OpenGraph data:', err);
              },
            });
          }
        }),
      )
      .subscribe({
        next: (items) => {
          this.stories.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load stories. Please try again.');
          this.loading.set(false);
          console.error('Error loading stories:', err);
        },
      });
  }

  private getStoryIds(): Observable<number[]> {
    switch (this.storyType) {
      case 'top':
        return this.hnService.getTopStories();
      case 'best':
        return this.hnService.getBestStories();
      case 'new':
        return this.hnService.getNewStories();
      case 'ask':
        return this.hnService.getAskStories();
      case 'show':
        return this.hnService.getShowStories();
      case 'job':
        return this.hnService.getJobStories();
      default:
        return this.hnService.getTopStories();
    }
  }

  loadMore() {
    if (!this.hasMore()) return;

    this.currentPage.update((p) => p + 1);
    this.loading.set(true);

    const start = this.currentPage() * this.pageSize;
    const end = start + this.pageSize;
    const pageIds = this.totalStoryIds().slice(start, end);

    this.hnService
      .getItems(pageIds)
      .pipe(
        map((items) => items.filter((item) => item !== null) as HNItem[]),
        tap((items) => {
          // Extract URLs from new stories for OpenGraph fetching
          const urls = items
            .filter((item) => item.url && !this.isTextPost(item))
            .map((item) => item.url!);

          // Fetch OpenGraph data for new batch progressively
          if (urls.length > 0) {
            this.ogService.getOpenGraphDataBatch(urls).subscribe({
              next: (partialOgDataMap) => {
                // Accumulate partial results as they stream in
                this.openGraphData.update((existing) => {
                  const updated = new Map(existing);
                  partialOgDataMap.forEach((data, url) => {
                    updated.set(url, data);
                  });
                  return updated;
                });
              },
              error: (err) => {
                console.error('Error fetching OpenGraph data:', err);
              },
            });
          }
        }),
      )
      .subscribe({
        next: (items) => {
          this.stories.update((stories) => [...stories, ...items]);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load more stories.');
          this.loading.set(false);
          console.error('Error loading more stories:', err);
        },
      });
  }

  hasMore(): boolean {
    return (this.currentPage() + 1) * this.pageSize < this.totalStoryIds().length;
  }

  refresh() {
    this.currentPage.set(0);
    this.stories.set([]);
    this.openGraphData.set(new Map());
    this.loadStories();
  }

  private isTextPost(story: HNItem): boolean {
    const title = story?.title || '';
    return (
      !story?.url ||
      title.startsWith('Ask HN:') ||
      title.startsWith('Tell HN:') ||
      (title.startsWith('Show HN:') && !story?.url)
    );
  }

  getOpenGraphForStory(story: HNItem): OpenGraphData | undefined {
    return story.url ? this.openGraphData().get(story.url) : undefined;
  }
}
