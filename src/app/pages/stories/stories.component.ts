// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { StoryList } from '../../components/story-list/story-list';

@Component({
  selector: 'app-stories',
  standalone: true,
  imports: [CommonModule, StoryList],
  template: ` <app-story-list [storyType]="storyType"></app-story-list> `,
})
export class StoriesComponent implements OnInit {
  @ViewChild(StoryList) storyList!: StoryList;
  private route = inject(ActivatedRoute);
  storyType: 'top' | 'best' | 'new' | 'ask' | 'show' | 'job' = 'top';

  ngOnInit() {
    // Listen to matcher-provided route params to handle reuse without destroying the component
    this.route.paramMap.subscribe((params) => {
      const paramType = params.get('type');
      const mappedType = this.mapParamToStoryType(paramType);
      this.storyType = mappedType;
      // StoryList detects the change through Input updates
    });
  }

  refresh(): void {
    if (this.storyList) {
      this.storyList.refresh();
    }
  }

  private mapParamToStoryType(
    type: string | null,
  ): 'top' | 'best' | 'new' | 'ask' | 'show' | 'job' {
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
