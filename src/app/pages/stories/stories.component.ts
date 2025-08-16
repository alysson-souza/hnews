// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject } from '@angular/core';
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
  private route = inject(ActivatedRoute);
  storyType: 'top' | 'best' | 'new' | 'ask' | 'show' | 'job' = 'top';

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.storyType = data['type'] || 'top';
    });
  }
}
