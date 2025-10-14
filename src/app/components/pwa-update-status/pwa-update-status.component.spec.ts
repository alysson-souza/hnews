// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PwaUpdateStatusComponent } from './pwa-update-status.component';

describe('PwaUpdateStatusComponent', () => {
  let component: PwaUpdateStatusComponent;
  let fixture: ComponentFixture<PwaUpdateStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaUpdateStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaUpdateStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render when status is none', () => {
    component.status = 'none';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.update-status')).toBeNull();
  });

  it('should show available status with correct styling', () => {
    component.status = 'available';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const statusDiv = compiled.querySelector('.update-status');

    expect(statusDiv).toBeTruthy();
    expect(statusDiv?.classList.contains('available')).toBe(true);
    expect(compiled.textContent).toContain('Update Available');
    expect(compiled.textContent).toContain('A new version is ready to install');
  });

  it('should show checking status with spinner', () => {
    component.status = 'checking';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const statusDiv = compiled.querySelector('.update-status');

    expect(statusDiv?.classList.contains('checking')).toBe(true);
    expect(compiled.textContent).toContain('Checking for Updates');
  });

  it('should show up-to-date status', () => {
    component.status = 'up-to-date';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Up to Date');
    expect(compiled.textContent).toContain('You are running the latest version');
  });

  it('should return correct status class', () => {
    component.status = 'available';
    expect(component.getStatusClass()).toBe('update-status available');
  });

  it('should return correct status title', () => {
    expect(component.getStatusTitle()).toBe('');
    component.status = 'available';
    expect(component.getStatusTitle()).toBe('Update Available');
    component.status = 'checking';
    expect(component.getStatusTitle()).toBe('Checking for Updates');
    component.status = 'up-to-date';
    expect(component.getStatusTitle()).toBe('Up to Date');
  });

  it('should return correct status description', () => {
    component.status = 'available';
    expect(component.getStatusDescription()).toBe('A new version is ready to install');
    component.status = 'checking';
    expect(component.getStatusDescription()).toBe('Please wait while we check for updates...');
    component.status = 'up-to-date';
    expect(component.getStatusDescription()).toBe('You are running the latest version');
  });
});
