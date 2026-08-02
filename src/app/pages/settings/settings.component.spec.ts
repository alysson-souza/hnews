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

describe('SettingsComponent backup controls', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;
  let savedStories: SavedStoriesService;
  let tags: UserTagsService;

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
    tags = TestBed.inject(UserTagsService);
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  function backupExportButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      'button[aria-label="Export backup"]',
    ) as HTMLButtonElement;
  }

  function changeEventFor(json: string): Event {
    const file = new File([json], 'backup.json', { type: 'application/json' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    return { target: input } as unknown as Event;
  }

  it('disables backup export while there is nothing to back up', async () => {
    await fixture.whenStable();

    expect(component.isBackupEmpty()).toBe(true);
    expect(backupExportButton().disabled).toBe(true);
  });

  it('enables backup export once either dataset has data', async () => {
    tags.setTag('dang', 'HN Moderator');
    await fixture.whenStable();

    expect(component.savedStoriesCount()).toBe(0);
    expect(backupExportButton().disabled).toBe(false);
  });

  it('exports a backup with the expected filename', async () => {
    savedStories.save({
      id: 1,
      type: 'story',
      time: 1700000000,
      title: 'Saved story',
    });
    await fixture.whenStable();

    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:backup');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const anchorDownload = vi.spyOn(HTMLAnchorElement.prototype, 'download', 'set');
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    component.exportBackup();

    expect(createObjectUrl).toHaveBeenCalled();
    expect(anchorDownload).toHaveBeenCalledWith('hnews-backup-1700000000000.json');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:backup');
    expect(component.backupMessage()).toBe('Backup exported successfully');
  });

  it('imports a unified backup and reports both datasets', async () => {
    const json = JSON.stringify({
      schema: 'hnews.backup',
      version: 1,
      exportedAt: 1700000000000,
      data: {
        userTags: [{ username: 'dang', tag: 'HN Moderator' }],
        savedStories: [{ id: 2, savedAt: 1700000000000 }],
      },
    });

    await component.importBackup(changeEventFor(json));

    expect(component.backupError()).toBe(false);
    expect(component.backupMessage()).toBe(
      'Imported. Tags: 1 new, 0 updated, 0 skipped · Stories: 1 new, 0 updated, 0 skipped',
    );
    expect(tags.getTag('dang')?.tag).toBe('HN Moderator');
    expect(savedStories.isSaved(2)).toBe(true);
  });

  it('imports a legacy saved stories file and reports only that dataset', async () => {
    const json = JSON.stringify({
      schema: 'hnews.savedStories',
      version: 1,
      exportedAt: 1700000000000,
      stories: [{ id: 3, savedAt: 1700000000000 }],
    });

    await component.importBackup(changeEventFor(json));

    expect(component.backupMessage()).toBe('Imported. Stories: 1 new, 0 updated, 0 skipped');
    expect(savedStories.isSaved(3)).toBe(true);
  });

  it('shows why an import was rejected', async () => {
    await component.importBackup(changeEventFor('not json'));

    expect(component.backupError()).toBe(true);
    expect(component.backupMessage()).toBe('Import failed: Unrecognized backup file.');
  });

  it('shows a distinct message for a backup from a newer version', async () => {
    const json = JSON.stringify({
      schema: 'hnews.backup',
      version: 99,
      exportedAt: 1700000000000,
      data: { userTags: [] },
    });

    await component.importBackup(changeEventFor(json));

    expect(component.backupError()).toBe(true);
    expect(component.backupMessage()).toBe(
      'Import failed: Backup was created by a newer version of hnews.',
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
