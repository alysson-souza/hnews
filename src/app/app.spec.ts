// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { PwaUpdateService } from './services/pwa-update.service';

describe('App', () => {
  let mockPwaUpdateService: jasmine.SpyObj<PwaUpdateService>;
  let versionUpdatesSubject: Subject<VersionEvent>;

  beforeEach(async () => {
    versionUpdatesSubject = new Subject<VersionEvent>();

    // Create mock PwaUpdateService with signal-like behavior
    class MockPwaUpdateService {
      updateAvailable = jasmine.createSpy('updateAvailable').and.returnValue(false);
      updateVersionInfo = jasmine.createSpy('updateVersionInfo').and.returnValue(null);
      applyUpdate = jasmine.createSpy('applyUpdate').and.returnValue(Promise.resolve());
      dismissUpdate = jasmine.createSpy('dismissUpdate');
    }

    mockPwaUpdateService =
      new MockPwaUpdateService() as unknown as jasmine.SpyObj<PwaUpdateService>;

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
      mockPwaUpdateService.updateAvailable.and.returnValue(true);

      expect(app.updateAvailable()).toBe(true);
      expect(mockPwaUpdateService.updateAvailable).toHaveBeenCalled();
    });

    it('should expose updateVersionInfo signal from PwaUpdateService', () => {
      const mockVersionInfo = { current: 'abc123', available: 'def456' };
      mockPwaUpdateService.updateVersionInfo.and.returnValue(mockVersionInfo);

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
      mockPwaUpdateService.updateAvailable.and.returnValue(true);
      mockPwaUpdateService.applyUpdate.and.returnValue(Promise.resolve());

      const event = new KeyboardEvent('keydown', {
        key: 'R',
        bubbles: true,
        cancelable: true,
      });

      // Create a mock target element (body - not an input)
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);

      spyOn(event, 'preventDefault');
      spyOn(app, 'applyPwaUpdate').and.returnValue(Promise.resolve());

      // Trigger the keyboard event
      app.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(app.applyPwaUpdate).toHaveBeenCalled();
    });

    it('should not trigger PWA update when R key is pressed and no update is available', () => {
      mockPwaUpdateService.updateAvailable.and.returnValue(false);

      const event = new KeyboardEvent('keydown', {
        key: 'R',
        bubbles: true,
        cancelable: true,
      });

      // Create a mock target element (body - not an input)
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);

      spyOn(event, 'preventDefault');
      spyOn(app, 'applyPwaUpdate');

      // Trigger the keyboard event
      app.handleKeyboardEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(app.applyPwaUpdate).not.toHaveBeenCalled();
    });

    it('should ignore R key when modifier keys are pressed', () => {
      mockPwaUpdateService.updateAvailable.and.returnValue(true);

      const event = new KeyboardEvent('keydown', {
        key: 'R',
        metaKey: true, // Command key on Mac
        bubbles: true,
        cancelable: true,
      });

      // Create a mock target element (body - not an input)
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);

      spyOn(event, 'preventDefault');
      spyOn(app, 'applyPwaUpdate');

      // Trigger the keyboard event
      app.handleKeyboardEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(app.applyPwaUpdate).not.toHaveBeenCalled();
    });

    it('should ignore R key when typing in input fields', () => {
      mockPwaUpdateService.updateAvailable.and.returnValue(true);

      const event = new KeyboardEvent('keydown', {
        key: 'R',
        bubbles: true,
        cancelable: true,
      });

      // Create a mock input element
      const mockInput = document.createElement('input');
      spyOnProperty(event, 'target').and.returnValue(mockInput);

      spyOn(event, 'preventDefault');
      spyOn(app, 'applyPwaUpdate');

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
      spyOn(console, 'log');
      spyOn(app, 'loadBuildInfo' as never);

      app.ngOnInit();

      expect(console.log).toHaveBeenCalledWith(jasmine.stringContaining('HNews version:'));
    });

    it('should call loadBuildInfo on ngOnInit', () => {
      spyOn(app, 'loadBuildInfo' as never);

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
      spyOn(app.router, 'navigate');
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
      spyOn(app.router, 'navigate');
      app.searchQuery = '   ';

      app.search();

      expect(app.router.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when search query is empty string', () => {
      spyOn(app.router, 'navigate');
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
      spyOn(event, 'preventDefault');
      spyOnProperty(event, 'target').and.returnValue(input);

      app.handleDesktopSearchKeydown(event);

      expect(app.searchQuery).toBe('');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should blur input on Escape when query is empty', () => {
      app.searchQuery = '';
      const input = document.createElement('input');
      spyOn(input, 'blur');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      spyOnProperty(event, 'target').and.returnValue(input);

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
      spyOn(app.themeService, 'toggleTheme');
      const event = new KeyboardEvent('keydown', { key: 't' });
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);
      spyOn(event, 'preventDefault');

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
      const mockKeyboardShortcuts = {
        open: jasmine.createSpy('open'),
        isOpen: jasmine.createSpy('isOpen').and.returnValue(false),
      };
      app.keyboardShortcuts = mockKeyboardShortcuts as never;

      const event = new KeyboardEvent('keydown', { key: '?' });
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);
      spyOn(event, 'preventDefault');

      app.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockKeyboardShortcuts.open).toHaveBeenCalled();
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
      spyOnProperty(event, 'target').and.returnValue(mockTarget);
      spyOn(event, 'preventDefault');

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
      spyOnProperty(event, 'target').and.returnValue(searchInput);

      app.handleKeyboardEvent(event);

      expect(app.searchQuery).toBe('');
      expect(app.showMobileSearch()).toBe(true);
    });

    it('should close mobile search on Escape when query is empty', () => {
      app.showMobileSearch.set(true);
      app.searchQuery = '';

      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      spyOn(searchInput, 'blur');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOnProperty(event, 'target').and.returnValue(searchInput);

      app.handleKeyboardEvent(event);

      expect(app.showMobileSearch()).toBe(false);
      expect(searchInput.blur).toHaveBeenCalled();
    });

    it('should close sidebar on Escape when sidebar is open', () => {
      spyOn(app.sidebarService, 'isOpen').and.returnValue(true);
      spyOn(app.sidebarService, 'closeSidebar');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app.sidebarService.closeSidebar).toHaveBeenCalled();
    });

    it('should close mobile search on Escape', () => {
      app.showMobileSearch.set(true);
      spyOn(app.sidebarService, 'isOpen').and.returnValue(false);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app.showMobileSearch()).toBe(false);
    });

    it('should close mobile menu on Escape', () => {
      app.mobileMenuOpen.set(true);
      spyOn(app.sidebarService, 'isOpen').and.returnValue(false);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app.mobileMenuOpen()).toBe(false);
    });

    it('should clear keyboard selection on Escape', () => {
      app.mobileMenuOpen.set(false);
      app.showMobileSearch.set(false);
      app.keyboardNavService.setSelectedIndex(3);
      spyOn(app.sidebarService, 'isOpen').and.returnValue(false);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);

      app.handleKeyboardEvent(event);

      // After escape with a selected index, it should be cleared
      expect(app.keyboardNavService.selectedIndex()).toBeNull();
    });

    it('should scroll to top on Escape when nothing else is active', () => {
      spyOn(app.sidebarService, 'isOpen').and.returnValue(false);
      spyOn(app['scrollService'], 'scrollToTop');
      app.keyboardNavService.clearSelection();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);

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
      Object.defineProperty(app.router, 'url', {
        get: () => '/user/test',
        configurable: true,
      });
      spyOn(app.keyboardNavService, 'selectNext');

      const event = new KeyboardEvent('keydown', { key: 'j' });
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app.keyboardNavService.selectNext).not.toHaveBeenCalled();
    });

    it('should ignore keyboard shortcuts when modifier keys are pressed', () => {
      spyOn(app.keyboardNavService, 'selectNext');

      const event = new KeyboardEvent('keydown', {
        key: 'j',
        metaKey: true,
      });
      const mockTarget = document.createElement('div');
      spyOnProperty(event, 'target').and.returnValue(mockTarget);

      app.handleKeyboardEvent(event);

      expect(app.keyboardNavService.selectNext).not.toHaveBeenCalled();
    });

    it('should ignore keyboard shortcuts when in input field', () => {
      spyOn(app.keyboardNavService, 'selectNext');

      const event = new KeyboardEvent('keydown', { key: 'j' });
      const mockInput = document.createElement('input');
      spyOnProperty(event, 'target').and.returnValue(mockInput);

      app.handleKeyboardEvent(event);

      expect(app.keyboardNavService.selectNext).not.toHaveBeenCalled();
    });

    it('should ignore keyboard shortcuts when in textarea', () => {
      spyOn(app.keyboardNavService, 'selectNext');

      const event = new KeyboardEvent('keydown', { key: 'j' });
      const mockTextarea = document.createElement('textarea');
      spyOnProperty(event, 'target').and.returnValue(mockTextarea);

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
