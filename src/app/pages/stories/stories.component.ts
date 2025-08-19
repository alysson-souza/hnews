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
    // Subscribe to route data changes to handle component reuse
    this.route.data.subscribe((data) => {
      const newType = data['type'] || 'top';
      this.storyType = newType;
      // StoryList will detect the change through ngOnChanges
    });
  }

  refresh(): void {
    if (this.storyList) {
      this.storyList.refresh();
    }
  }
}
