// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { of, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';

import { StoryItem } from '@components/story-item/story-item';
import { HNItem } from '@models/hn';
import { DeviceService } from '@services/device.service';
import { HackernewsService } from '@services/hackernews.service';
import { KeyboardNavigationService } from '@services/keyboard-navigation.service';
import { NetworkStateService } from '@services/network-state.service';
import { SavedStoriesService } from '@services/saved-stories.service';
import { SidebarService } from '@services/sidebar.service';
import { StoryArchiveService } from '@services/story-archive.service';
import { StoryShareService } from '@services/story-share.service';
import { UserSettingsService } from '@services/user-settings.service';
import { VisitedService } from '@services/visited.service';
import { SavedStoriesComponent } from './saved-stories.component';

const makeStory = (id: number, title = `Story ${id}`): HNItem => ({
  id,
  type: 'story',
  by: `user-${id}`,
  time: 1700000000 + id,
  title,
  url: `https://example.com/${id}`,
  score: id,
  descendants: id,
});

class MockDeviceService {
  isDesktop(): boolean {
    return false;
  }

  isMobile(): boolean {
    return true;
  }

  shouldShowKeyboardHints(): boolean {
    return false;
  }

  getModifierKey(): string {
    return 'Ctrl';
  }
}

describe('SavedStoriesComponent', () => {
  let fixture: ComponentFixture<SavedStoriesComponent>;
  let savedStories: SavedStoriesService;
  let hackernews: {
    getItems: ReturnType<typeof vi.fn>;
    getStoryWithAllComments: ReturnType<typeof vi.fn>;
  };
  let keyboardNav: {
    setTotalItems: ReturnType<typeof vi.fn>;
    clearSelection: ReturnType<typeof vi.fn>;
    selectedIndex: ReturnType<typeof vi.fn>;
  };
  let networkState: { isOnline: ReturnType<typeof vi.fn>; isOffline: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    window.localStorage.clear();

    hackernews = {
      getItems: vi.fn().mockReturnValue(of([])),
      getStoryWithAllComments: vi.fn().mockReturnValue(of(null)),
    };
    keyboardNav = {
      setTotalItems: vi.fn(),
      clearSelection: vi.fn(),
      selectedIndex: vi.fn().mockReturnValue(null),
    };
    networkState = {
      isOnline: vi.fn().mockReturnValue(false),
      isOffline: vi.fn().mockReturnValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [SavedStoriesComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: HackernewsService, useValue: hackernews },
        { provide: KeyboardNavigationService, useValue: keyboardNav },
        { provide: NetworkStateService, useValue: networkState },
        {
          provide: SidebarService,
          useValue: {
            isOpen: vi.fn().mockReturnValue(false),
            toggleSidebar: vi.fn(),
            closeSidebar: vi.fn(),
          },
        },
        { provide: DeviceService, useClass: MockDeviceService },
        {
          provide: VisitedService,
          useValue: {
            markStoryVisited: vi.fn(),
            hasNewComments: vi.fn().mockReturnValue(false),
            getNewCommentCount: vi.fn().mockReturnValue(0),
            isVisited: vi.fn().mockReturnValue(false),
          },
        },
        {
          provide: UserSettingsService,
          useValue: { settings: vi.fn().mockReturnValue({ openCommentsInSidebar: false }) },
        },
        {
          provide: StoryShareService,
          useValue: {
            getStoryActionText: vi.fn().mockReturnValue('Share Story'),
            getCommentsActionText: vi.fn().mockReturnValue('Share Comments'),
            shareStory: vi.fn(),
            shareComments: vi.fn(),
          },
        },
        {
          provide: StoryArchiveService,
          useValue: { getArchiveUrl: vi.fn().mockReturnValue(null) },
        },
      ],
    }).compileComponents();

    savedStories = TestBed.inject(SavedStoriesService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(SavedStoriesComponent);
  }

  it('renders an empty state when there are no saved stories', async () => {
    createComponent();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No saved stories');
    expect(fixture.debugElement.query(By.directive(StoryItem))).toBeFalsy();
    expect(keyboardNav.setTotalItems).toHaveBeenLastCalledWith(0);
  });

  it('renders saved stories newest first using story rows', async () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1700000000000);
    savedStories.save(makeStory(1, 'Older'));
    now.mockReturnValue(1700000010000);
    savedStories.save(makeStory(2, 'Newer'));

    createComponent();
    await fixture.whenStable();

    const rows = fixture.debugElement.queryAll(By.directive(StoryItem));
    expect(rows.length).toBe(2);
    expect(rows.map((row) => (row.componentInstance as StoryItem).story()?.title)).toEqual([
      'Newer',
      'Older',
    ]);
    expect(keyboardNav.setTotalItems).toHaveBeenLastCalledWith(2);
  });

  it('refreshes saved IDs and updates snapshots', async () => {
    savedStories.save(makeStory(3, 'Cached'));
    networkState.isOnline.mockReturnValue(true);
    networkState.isOffline.mockReturnValue(false);
    hackernews.getItems.mockReturnValue(of([makeStory(3, 'Fresh')]));

    createComponent();
    fixture.componentInstance.refresh();
    await fixture.whenStable();

    expect(hackernews.getItems).toHaveBeenCalledWith([3], true);
    expect(savedStories.getAll()[0].story?.title).toBe('Fresh');
    expect(keyboardNav.clearSelection).toHaveBeenCalled();
  });

  it('exposes automatic refresh activity through refreshStatus', async () => {
    savedStories.save(makeStory(5));
    const refreshResult = new Subject<HNItem[]>();
    hackernews.getItems.mockReturnValue(refreshResult.asObservable());
    networkState.isOnline.mockReturnValue(true);
    networkState.isOffline.mockReturnValue(false);

    createComponent();
    await Promise.resolve();

    expect(fixture.componentInstance.refreshStatus()).toBe('refreshing');

    refreshResult.next([makeStory(5, 'Fresh')]);
    refreshResult.complete();
    await fixture.whenStable();

    expect(fixture.componentInstance.refreshStatus()).toBe('idle');
  });

  it('renders imported ID-only records with a fallback story row', async () => {
    savedStories.importSavedStories(
      JSON.stringify({
        schema: 'hnews.savedStories',
        version: 1,
        exportedAt: 1700000000000,
        stories: [{ id: 4, savedAt: 1700000000000 }],
      }),
    );

    createComponent();
    await fixture.whenStable();

    const row = fixture.debugElement.query(By.directive(StoryItem)).componentInstance as StoryItem;
    expect(row.story()?.title).toBe('Story 4');
    expect(row.story()?.id).toBe(4);
  });
});
