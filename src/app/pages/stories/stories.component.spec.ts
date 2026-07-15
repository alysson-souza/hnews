// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { storyRouteMatcher } from '../../app.routes';
import { StoryList } from '@components/story-list/story-list';
import { StoriesComponent } from './stories.component';
import { StoryListStore } from '@stores/story-list.store';

type StoryType = 'top' | 'best' | 'new' | 'ask' | 'show' | 'job';

@Component({
  selector: 'app-story-list',
  template: '',
})
class StoryListStubComponent {
  readonly storyType = input<StoryType>('top');
  refresh = vi.fn();
}

describe('StoriesComponent', () => {
  let harness: RouterTestingHarness;
  const store = {
    loading: signal(true),
    refreshing: signal(false),
    backgroundRefreshing: signal(false),
  };

  beforeEach(async () => {
    store.loading.set(true);
    store.refreshing.set(false);
    store.backgroundRefreshing.set(false);

    TestBed.overrideComponent(StoriesComponent, {
      remove: { imports: [StoryList] },
      add: { imports: [StoryListStubComponent] },
    });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: StoryListStore, useValue: store },
        provideRouter([{ matcher: storyRouteMatcher, component: StoriesComponent }]),
      ],
    });

    harness = await RouterTestingHarness.create();
  });

  it('updates the story list input when the reused story route changes', async () => {
    await harness.navigateByUrl('/top', StoriesComponent);
    expect(storyList(harness.fixture).storyType()).toBe('top');

    for (const [url, expectedType] of [
      ['/best', 'best'],
      ['/newest', 'new'],
      ['/ask', 'ask'],
      ['/show', 'show'],
      ['/jobs', 'job'],
    ] as const) {
      await harness.navigateByUrl(url, StoriesComponent);
      harness.fixture.detectChanges();

      expect(storyList(harness.fixture).storyType()).toBe(expectedType);
    }
  });

  it('reacts to initial, paginated, and refresh loading states', async () => {
    const component = await harness.navigateByUrl('/top', StoriesComponent);

    expect(component.refreshStatus()).toBe('loading');

    store.loading.set(false);
    expect(component.refreshStatus()).toBe('idle');

    store.backgroundRefreshing.set(true);
    expect(component.refreshStatus()).toBe('refreshing');
  });
});

function storyList(fixture: ComponentFixture<unknown>): StoryListStubComponent {
  return fixture.debugElement.query(By.directive(StoryListStubComponent))
    .componentInstance as StoryListStubComponent;
}
