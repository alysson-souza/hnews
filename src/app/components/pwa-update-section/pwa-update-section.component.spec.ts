// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PwaUpdateSectionComponent } from './pwa-update-section.component';
import { PwaUpdateService } from '../../services/pwa-update.service';
import { DeviceService } from '../../services/device.service';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { signal } from '@angular/core';

describe('PwaUpdateSectionComponent', () => {
  let component: PwaUpdateSectionComponent;
  let fixture: ComponentFixture<PwaUpdateSectionComponent>;
  let mockPwaUpdateService: jasmine.SpyObj<PwaUpdateService>;
  let mockDeviceService: jasmine.SpyObj<DeviceService>;
  let mockSwUpdate: jasmine.SpyObj<SwUpdate>;
  let versionUpdatesSubject: Subject<VersionEvent>;

  beforeEach(async () => {
    versionUpdatesSubject = new Subject<VersionEvent>();

    mockSwUpdate = jasmine.createSpyObj('SwUpdate', ['checkForUpdate', 'activateUpdate'], {
      isEnabled: true,
      versionUpdates: versionUpdatesSubject.asObservable(),
    });
    mockSwUpdate.checkForUpdate.and.returnValue(Promise.resolve(false));
    mockSwUpdate.activateUpdate.and.returnValue(Promise.resolve(true));

    mockPwaUpdateService = jasmine.createSpyObj('PwaUpdateService', ['applyUpdate'], {
      updateAvailable: signal(false),
      updateVersionInfo: signal(null),
      updates: mockSwUpdate,
    });

    mockDeviceService = jasmine.createSpyObj('DeviceService', ['isPWA']);
    mockDeviceService.isPWA.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [PwaUpdateSectionComponent],
      providers: [
        { provide: PwaUpdateService, useValue: mockPwaUpdateService },
        { provide: DeviceService, useValue: mockDeviceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaUpdateSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render when not in PWA mode', () => {
    mockDeviceService.isPWA.and.returnValue(false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-card')).toBeNull();
  });

  it('should render when in PWA mode', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-card')).toBeTruthy();
    expect(compiled.textContent).toContain('App Updates');
  });

  it('should display version info', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-pwa-version-info')).toBeTruthy();
  });

  it('should check for updates when checkForUpdate is called', async () => {
    mockSwUpdate.checkForUpdate.and.returnValue(Promise.resolve(true));

    await component.checkForUpdate();

    expect(mockSwUpdate.checkForUpdate).toHaveBeenCalled();
    expect(component.statusMessage()).toBe('Update available!');
  });

  it('should show message when no update is found', async () => {
    mockSwUpdate.checkForUpdate.and.returnValue(Promise.resolve(false));

    await component.checkForUpdate();

    expect(component.statusMessage()).toBe('You are running the latest version');
  });

  it('should handle update check errors', async () => {
    mockSwUpdate.checkForUpdate.and.returnValue(Promise.reject(new Error('Network error')));

    await component.checkForUpdate();

    expect(component.statusMessage()).toBe('Failed to check for updates');
    expect(component.statusError()).toBe(true);
  });

  it('should call pwaUpdate.applyUpdate when installUpdate is called', async () => {
    await component.installUpdate();
    expect(mockPwaUpdateService.applyUpdate).toHaveBeenCalled();
  });

  it('should show checking status during update check', async () => {
    const checkPromise = component.checkForUpdate();
    expect(component.isChecking()).toBe(true);
    await checkPromise;
    expect(component.isChecking()).toBe(false);
  });

  it('should compute correct update status', () => {
    expect(component.updateStatus()).toBe('none');

    component.isChecking.set(true);
    expect(component.updateStatus()).toBe('checking');

    component.isChecking.set(false);
    const mockSignal = component.pwaUpdate.updateAvailable as ReturnType<typeof signal<boolean>>;
    mockSignal.set(true);
    expect(component.updateStatus()).toBe('available');
  });

  it('should clear status message after timeout', (done) => {
    jasmine.clock().install();
    component['showMessage']('Test message', false);
    expect(component.statusMessage()).toBe('Test message');

    jasmine.clock().tick(5001);
    expect(component.statusMessage()).toBe('');
    jasmine.clock().uninstall();
    done();
  });
});
