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
});
