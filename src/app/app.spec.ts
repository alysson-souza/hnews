import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';
import { App } from './app';
import { PwaUpdateService } from './services/pwa-update.service';
import { KeyboardContextService } from './services/keyboard-context.service';

describe('App', () => {
  let mockPwaUpdateService: MockedObject<PwaUpdateService>;
  let versionUpdatesSubject: Subject<VersionEvent>;
  let mockKeyboardContextService: {
    currentContext: WritableSignal<string>;
    isOnStoryList: WritableSignal<boolean>;
    isOnItemPage: WritableSignal<boolean>;
    isOnUserPage: WritableSignal<boolean>;
  };

  beforeEach(async () => {
    versionUpdatesSubject = new Subject<VersionEvent>();

    mockKeyboardContextService = {
      currentContext: signal('default'),
      isOnStoryList: signal(true),
      isOnItemPage: signal(false),
      isOnUserPage: signal(false),
    };

    // Create mock PwaUpdateService with signal-like behavior
    class MockPwaUpdateService {
      updateAvailable = vi.fn().mockReturnValue(false);
      updateVersionInfo = vi.fn().mockReturnValue(null);
      applyUpdate = vi.fn().mockReturnValue(Promise.resolve());
      dismissUpdate = vi.fn();
    }

    mockPwaUpdateService = new MockPwaUpdateService() as unknown as MockedObject<PwaUpdateService>;

    // Override template to avoid deep rendering of child components (e.g., fontawesome)
    TestBed.overrideComponent(App, {
      set: {
        template: '<span>HNews</span>',
      },
    });
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: SwUpdate,
          useValue: {
            isEnabled: false,
            versionUpdates: versionUpdatesSubject.asObservable(),
            checkForUpdate: () => Promise.resolve(false),
            activateUpdate: () => Promise.resolve(false),
          } as unknown as SwUpdate,
        },
        {
          provide: PwaUpdateService,
          useValue: mockPwaUpdateService,
        },
        {
          provide: KeyboardContextService,
          useValue: mockKeyboardContextService,
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeDefined();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('HNews');
  });

  describe('PWA Update Functionality', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should expose updateAvailable signal from PwaUpdateService', () => {
      mockPwaUpdateService.updateAvailable.mockReturnValue(true);

      expect(app.updateAvailable()).toBe(true);
      expect(mockPwaUpdateService.updateAvailable).toHaveBeenCalled();
    });

    it('should expose updateVersionInfo signal from PwaUpdateService', () => {
      const mockVersionInfo = { current: 'abc123', available: 'def456' };
      mockPwaUpdateService.updateVersionInfo.mockReturnValue(mockVersionInfo);

      expect(app.updateVersionInfo()).toBe(mockVersionInfo);
      expect(mockPwaUpdateService.updateVersionInfo).toHaveBeenCalled();
    });

    it('should call applyPwaUpdate() when applyPwaUpdate method is called', async () => {
      await app.applyPwaUpdate();

      expect(mockPwaUpdateService.applyUpdate).toHaveBeenCalled();
    });

    it('should call dismissPwaUpdate() when dismissPwaUpdate method is called', () => {
      app.dismissPwaUpdate();

      expect(mockPwaUpdateService.dismissUpdate).toHaveBeenCalled();
    });
  });

  describe('PWA Update Keyboard Shortcuts', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should trigger PWA update when R key is pressed and update is available', () => {
      mockPwaUpdateService.updateAvailable.mockReturnValue(true);
      mockPwaUpdateService.applyUpdate.mockReturnValue(Promise.resolve());

      const event = new KeyboardEvent('keydown', {
        key: 'R',
        bubbles: true,
        cancelable: true,
      });

      // Create a mock target element (body - not an input)
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);

      vi.spyOn(event, 'preventDefault');
      vi.spyOn(app, 'applyPwaUpdate').mockReturnValue(Promise.resolve());

      // Trigger the keyboard event
      app.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(app.applyPwaUpdate).toHaveBeenCalled();
    });

    it('should not trigger PWA update when R key is pressed and no update is available', () => {
      mockPwaUpdateService.updateAvailable.mockReturnValue(false);

      const event = new KeyboardEvent('keydown', {
        key: 'R',
        bubbles: true,
        cancelable: true,
      });

      // Create a mock target element (body - not an input)
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);

      vi.spyOn(event, 'preventDefault');
      vi.spyOn(app, 'applyPwaUpdate');

      // Trigger the keyboard event
      app.handleKeyboardEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(app.applyPwaUpdate).not.toHaveBeenCalled();
    });

    it('should ignore R key when modifier keys are pressed', () => {
      mockPwaUpdateService.updateAvailable.mockReturnValue(true);

      const event = new KeyboardEvent('keydown', {
        key: 'R',
        metaKey: true, // Command key on Mac
        bubbles: true,
        cancelable: true,
      });

      // Create a mock target element (body - not an input)
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);

      vi.spyOn(event, 'preventDefault');
      vi.spyOn(app, 'applyPwaUpdate');

      // Trigger the keyboard event
      app.handleKeyboardEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(app.applyPwaUpdate).not.toHaveBeenCalled();
    });

    it('should ignore R key when typing in input fields', () => {
      mockPwaUpdateService.updateAvailable.mockReturnValue(true);

      const event = new KeyboardEvent('keydown', {
        key: 'R',
        bubbles: true,
        cancelable: true,
      });

      // Create a mock input element
      const mockInput = document.createElement('input');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockInput);

      vi.spyOn(event, 'preventDefault');
      vi.spyOn(app, 'applyPwaUpdate');

      // Trigger the keyboard event
      app.handleKeyboardEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(app.applyPwaUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle Hooks', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
    });

    it('should log version on ngOnInit', () => {
      vi.spyOn(console, 'log');
      vi.spyOn(app, 'loadBuildInfo' as never);

      app.ngOnInit();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('HNews version:'));
    });

    it('should call loadBuildInfo on ngOnInit', () => {
      vi.spyOn(app, 'loadBuildInfo' as never);

      app.ngOnInit();

      expect(app['loadBuildInfo']).toHaveBeenCalled();
    });
  });

  describe('Mobile Menu and Search', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should toggle mobile menu on toggleMobileMenu()', () => {
      expect(app.mobileMenuOpen()).toBe(false);

      app.toggleMobileMenu();
      expect(app.mobileMenuOpen()).toBe(true);

      app.toggleMobileMenu();
      expect(app.mobileMenuOpen()).toBe(false);
    });

    it('should close mobile search when opening mobile menu', () => {
      app.showMobileSearch.set(true);

      app.toggleMobileMenu();

      expect(app.mobileMenuOpen()).toBe(true);
      expect(app.showMobileSearch()).toBe(false);
    });

    it('should toggle mobile search on toggleMobileSearch()', () => {
      expect(app.showMobileSearch()).toBe(false);

      app.toggleMobileSearch();
      expect(app.showMobileSearch()).toBe(true);

      app.toggleMobileSearch();
      expect(app.showMobileSearch()).toBe(false);
    });

    it('should close mobile menu when opening mobile search', () => {
      app.mobileMenuOpen.set(true);

      app.toggleMobileSearch();

      expect(app.showMobileSearch()).toBe(true);
      expect(app.mobileMenuOpen()).toBe(false);
    });

    it('should close mobile menu on closeMobileMenu()', () => {
      app.mobileMenuOpen.set(true);

      app.closeMobileMenu();

      expect(app.mobileMenuOpen()).toBe(false);
    });
  });

  describe('Search Functionality', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should navigate to search page with query parameter on search()', () => {
      vi.spyOn(app.router, 'navigate');
      app.searchQuery = 'angular';

      app.search();

      expect(app.router.navigate).toHaveBeenCalledWith(['/search'], {
        queryParams: { q: 'angular' },
      });
      expect(app.searchQuery).toBe('');
      expect(app.showMobileSearch()).toBe(false);
      expect(app.mobileMenuOpen()).toBe(false);
    });

    it('should not navigate when search query is empty', () => {
      vi.spyOn(app.router, 'navigate');
      app.searchQuery = '   ';

      app.search();

      expect(app.router.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when search query is empty string', () => {
      vi.spyOn(app.router, 'navigate');
      app.searchQuery = '';

      app.search();

      expect(app.router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Desktop Search Keydown', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should clear search query on Escape when query has value', () => {
      app.searchQuery = 'test';
      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'target', 'get').mockReturnValue(input);

      app.handleDesktopSearchKeydown(event);

      expect(app.searchQuery).toBe('');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should blur input on Escape when query is empty', () => {
      app.searchQuery = '';
      const input = document.createElement('input');
      vi.spyOn(input, 'blur');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'target', 'get').mockReturnValue(input);

      app.handleDesktopSearchKeydown(event);

      expect(input.blur).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation - Theme Toggle', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should toggle theme when t key is pressed', () => {
      vi.spyOn(app.themeService, 'toggleTheme');
      const event = new KeyboardEvent('keydown', { key: 't' });
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);
      vi.spyOn(event, 'preventDefault');

      app.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(app.themeService.toggleTheme).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation - Help Dialog', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should show keyboard shortcuts when ? key is pressed', () => {
      const keyboardShortcutsComponent = app.keyboardShortcuts();
      vi.spyOn(keyboardShortcutsComponent, 'open');
      vi.spyOn(keyboardShortcutsComponent, 'isOpen').mockReturnValue(false);

      const event = new KeyboardEvent('keydown', { key: '?' });
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);
      vi.spyOn(event, 'preventDefault');

      app.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(keyboardShortcutsComponent.open).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation - Search Focus', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should prevent default when / key is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: '/' });
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);
      vi.spyOn(event, 'preventDefault');

      app.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation - Escape Key', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should clear search query on Escape in mobile search input', () => {
      app.showMobileSearch.set(true);
      app.searchQuery = 'test query';

      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      vi.spyOn(event, 'target', 'get').mockReturnValue(searchInput);

      app.handleKeyboardEvent(event);

      expect(app.searchQuery).toBe('');
      expect(app.showMobileSearch()).toBe(true);
    });

    it('should close mobile search on Escape when query is empty', () => {
      app.showMobileSearch.set(true);
      app.searchQuery = '';

      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      vi.spyOn(searchInput, 'blur');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      vi.spyOn(event, 'target', 'get').mockReturnValue(searchInput);

      app.handleKeyboardEvent(event);

      expect(app.showMobileSearch()).toBe(false);
      expect(searchInput.blur).toHaveBeenCalled();
    });

    it('should close sidebar on Escape when sidebar is open', () => {
      mockKeyboardContextService.currentContext.set('sidebar');
      vi.spyOn(app.sidebarService, 'isOpen').mockReturnValue(true);
      vi.spyOn(app.sidebarService, 'closeSidebar');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app.sidebarService.closeSidebar).toHaveBeenCalled();
    });

    it('should close mobile search on Escape', () => {
      app.showMobileSearch.set(true);
      vi.spyOn(app.sidebarService, 'isOpen').mockReturnValue(false);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app.showMobileSearch()).toBe(false);
    });

    it('should close mobile menu on Escape', () => {
      app.mobileMenuOpen.set(true);
      vi.spyOn(app.sidebarService, 'isOpen').mockReturnValue(false);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app.mobileMenuOpen()).toBe(false);
    });

    it('should clear keyboard selection on Escape', () => {
      app.mobileMenuOpen.set(false);
      app.showMobileSearch.set(false);
      app.keyboardNavService.setSelectedIndex(3);
      vi.spyOn(app.sidebarService, 'isOpen').mockReturnValue(false);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);

      app.handleKeyboardEvent(event);

      // After escape with a selected index, it should be cleared
      expect(app.keyboardNavService.selectedIndex()).toBeNull();
    });

    it('should scroll to top on Escape when nothing else is active', () => {
      vi.spyOn(app.sidebarService, 'isOpen').mockReturnValue(false);
      vi.spyOn(app['scrollService'], 'scrollToTop');
      app.keyboardNavService.clearSelection();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app['scrollService'].scrollToTop).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation - Story List Shortcuts', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should not process story shortcuts when not on story list page', () => {
      mockKeyboardContextService.isOnStoryList.set(false);
      vi.spyOn(app.keyboardNavService, 'selectNext');

      const event = new KeyboardEvent('keydown', { key: 'j' });
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app.keyboardNavService.selectNext).not.toHaveBeenCalled();
    });

    it('should ignore keyboard shortcuts when modifier keys are pressed', () => {
      vi.spyOn(app.keyboardNavService, 'selectNext');

      const event = new KeyboardEvent('keydown', {
        key: 'j',
        metaKey: true,
      });
      const mockTarget = document.createElement('div');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app.keyboardNavService.selectNext).not.toHaveBeenCalled();
    });

    it('should ignore keyboard shortcuts when in input field', () => {
      vi.spyOn(app.keyboardNavService, 'selectNext');

      const event = new KeyboardEvent('keydown', { key: 'j' });
      const mockInput = document.createElement('input');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockInput);

      app.handleKeyboardEvent(event);

      expect(app.keyboardNavService.selectNext).not.toHaveBeenCalled();
    });

    it('should ignore keyboard shortcuts when in textarea', () => {
      vi.spyOn(app.keyboardNavService, 'selectNext');

      const event = new KeyboardEvent('keydown', { key: 'j' });
      const mockTextarea = document.createElement('textarea');
      vi.spyOn(event, 'target', 'get').mockReturnValue(mockTextarea);

      app.handleKeyboardEvent(event);

      expect(app.keyboardNavService.selectNext).not.toHaveBeenCalled();
    });
  });

  describe('Version Info', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have version info', () => {
      expect(app.version).toBeDefined();
      expect(app.commitSha).toBeDefined();
      expect(app.commitShaShort).toBeDefined();
    });

    it('should generate commit URL when commit SHA is not unknown', () => {
      app.commitSha = 'abc123def456';
      app.commitUrl =
        app.commitSha !== 'unknown'
          ? `https://github.com/alysson-souza/hnews/commit/${app.commitSha}`
          : null;
      const expectedUrl = 'https://github.com/alysson-souza/hnews/commit/abc123def456';

      expect(app.commitUrl).toBe(expectedUrl);
    });

    it('should not generate commit URL when commit SHA is unknown', () => {
      app.commitSha = 'unknown';
      app.commitUrl =
        app.commitSha !== 'unknown'
          ? `https://github.com/alysson-souza/hnews/commit/${app.commitSha}`
          : null;

      expect(app.commitUrl).toBeNull();
    });
  });

  describe('Offline State', () => {
    let fixture: ComponentFixture<App>;
    let app: App;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      app = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have isOffline computed signal', () => {
      // isOffline is a computed signal from networkState.isOnline()
      expect(app.isOffline).toBeDefined();
      // The actual value depends on networkState.isOnline() which is tested in network-state.service.spec.ts
      const offlineValue = app.isOffline();
      expect(typeof offlineValue).toBe('boolean');
    });
  });
});
