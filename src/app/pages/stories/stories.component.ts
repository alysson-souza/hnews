// SPDX-License-Identifier: MIT
// Copyright (C) 2025-2026 Alysson Souza
import { Component, computed, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ActivatedRoute } from '@angular/router';
import { StoryList } from '@components/story-list/story-list';
import { RefreshableRoute, RefreshStatus } from '@models/refresh';
import { StoryListStore } from '@stores/story-list.store';
import { map } from 'rxjs/operators';

type StoryType = 'top' | 'best' | 'new' | 'ask' | 'show' | 'job';

@Component({
  selector: 'app-stories',
  imports: [StoryList],
  template: ` <app-story-list [storyType]="storyType()" /> `,
})
export class StoriesComponent implements RefreshableRoute {
  readonly storyList = viewChild.required(StoryList);
  private route = inject(ActivatedRoute);
  private store = inject(StoryListStore);
  readonly refreshStatus = computed<RefreshStatus>(() => {
    if (this.store.refreshing() || this.store.backgroundRefreshing()) {
      return 'refreshing';
    }
    return this.store.loading() ? 'loading' : 'idle';
  });
  readonly storyType = toSignal(
    this.route.paramMap.pipe(map((params) => this.mapParamToStoryType(params.get('type')))),
    { initialValue: this.mapParamToStoryType(this.route.snapshot.paramMap.get('type')) },
  );

  refresh(): void {
    const storyList = this.storyList();
    if (storyList) {
      storyList.refresh();
    }
  }

  private mapParamToStoryType(type: string | null): StoryType {
    switch (type) {
      case 'top':
      case 'best':
      case 'new':
      case 'ask':
      case 'show':
      case 'job':
        return type;
      default:
        return 'top';
    }
  }
}
