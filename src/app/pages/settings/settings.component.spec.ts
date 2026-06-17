// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CacheManagerService } from '@services/cache-manager.service';
import { HackernewsService } from '@services/hackernews.service';
import { CommandRegistryService } from '@services/command-registry.service';
import { DeviceService } from '@services/device.service';
import { KeyboardNavigationService } from '@services/keyboard-navigation.service';
import { PrivacyRedirectService } from '@services/privacy-redirect.service';
import { SavedStoriesService } from '@services/saved-stories.service';
import { ScrollService } from '@services/scroll.service';
import { SidebarService } from '@services/sidebar.service';
import { ThemeService } from '@services/theme.service';
import { UserSettingsService } from '@services/user-settings.service';
import { UserTagsService } from '@services/user-tags.service';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent saved stories controls', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;
  let savedStories: SavedStoriesService;

  beforeEach(async () => {
    window.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideRouter([]),
        {
          provide: HackernewsService,
          useValue: { getStoryWithAllComments: vi.fn().mockReturnValue(of(null)) },
        },
        {
          provide: UserTagsService,
          useValue: {
            getAllTags: vi.fn().mockReturnValue([]),
            getPaginatedTags: vi.fn().mockReturnValue({
              tags: [],
              totalCount: 0,
              totalPages: 0,
              currentPage: 1,
            }),
            exportTags: vi.fn().mockReturnValue('{}'),
            importTags: vi.fn().mockReturnValue(true),
            removeTag: vi.fn(),
            setNotes: vi.fn(),
            clearAllTags: vi.fn(),
          },
        },
        {
          provide: CacheManagerService,
          useValue: {
            getStats: vi.fn().mockResolvedValue({
              indexedDB: 0,
              swCache: 0,
              itemCount: 0,
              memoryItems: 0,
            }),
            clearAll: vi.fn(),
            clear: vi.fn(),
          },
        },
        {
          provide: ThemeService,
          useValue: {
            theme: signal<'auto' | 'light' | 'dark'>('auto'),
            setTheme: vi.fn(),
          },
        },
        {
          provide: UserSettingsService,
          useValue: {
            settings: signal({ openCommentsInSidebar: false }),
            setSetting: vi.fn(),
          },
        },
        { provide: SidebarService, useValue: { isOpen: vi.fn().mockReturnValue(false) } },
        { provide: DeviceService, useValue: { isDesktop: vi.fn().mockReturnValue(true) } },
        { provide: CommandRegistryService, useValue: { register: vi.fn() } },
        { provide: KeyboardNavigationService, useValue: { clearSelection: vi.fn() } },
        { provide: ScrollService, useValue: { scrollToHTMLElement: vi.fn() } },
        {
          provide: PrivacyRedirectService,
          useValue: {
            settings: signal({ enabled: false, services: {} }),
            state: signal({ ready: true, loading: false, error: null, nextRetryAt: null }),
            registry: [],
            setEnabled: vi.fn(),
            setServiceEnabled: vi.fn(),
            refresh: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    savedStories = TestBed.inject(SavedStoriesService);
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  function savedExportButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      'button[aria-label="Export saved stories"]',
    ) as HTMLButtonElement;
  }

  it('disables saved-story export when there are no saved stories', async () => {
    await fixture.whenStable();

    expect(component.savedStoriesCount()).toBe(0);
    expect(savedExportButton().disabled).toBe(true);
  });

  it('exports saved stories with the expected filename', async () => {
    savedStories.save({
      id: 1,
      type: 'story',
      time: 1700000000,
      title: 'Saved story',
    });
    await fixture.whenStable();

    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:saved');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    component.exportSavedStories();

    expect(createObjectUrl).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:saved');
    expect(component.savedStoriesMessage()).toBe('Saved stories exported successfully');
  });

  it('imports valid saved stories and shows result counts', async () => {
    const json = JSON.stringify({
      schema: 'hnews.savedStories',
      version: 1,
      exportedAt: 1700000000000,
      stories: [{ id: 2, savedAt: 1700000000000 }],
    });
    const file = new File([json], 'saved.json', { type: 'application/json' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    component.importSavedStories({ target: input } as unknown as Event);
    await vi.waitFor(() => {
      expect(component.savedStoriesMessage()).toBe(
        'Saved stories imported: 1 new, 0 updated, 0 skipped',
      );
    });

    expect(savedStories.isSaved(2)).toBe(true);
  });

  it('shows an error for invalid saved-story imports', async () => {
    const file = new File(['not json'], 'bad.json', { type: 'application/json' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    component.importSavedStories({ target: input } as unknown as Event);
    await vi.waitFor(() => {
      expect(component.savedStoriesError()).toBe(true);
    });

    expect(component.savedStoriesMessage()).toBe(
      'Failed to import saved stories. Please check the file format.',
    );
  });

  it('clears saved stories after confirmation only', () => {
    savedStories.save({
      id: 3,
      type: 'story',
      time: 1700000000,
      title: 'Saved story',
    });
    const confirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal('confirm', confirm);

    component.clearSavedStories();

    expect(confirm).toHaveBeenCalledWith(
      'Are you sure you want to clear all saved stories? This cannot be undone.',
    );
    expect(savedStories.getAll()).toEqual([]);
    expect(component.savedStoriesMessage()).toBe('All saved stories cleared');
  });
});
