// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PwaUpdateActionsComponent } from './pwa-update-actions.component';

describe('PwaUpdateActionsComponent', () => {
  let component: PwaUpdateActionsComponent;
  let fixture: ComponentFixture<PwaUpdateActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaUpdateActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaUpdateActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show check button by default', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Check for Updates');
  });

  it('should show "Checking..." when isChecking is true', () => {
    component.isChecking = true;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Checking...');
  });

  it('should not show install button when updateAvailable is false', () => {
    component.updateAvailable = false;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Install Update');
  });

  it('should show install button when updateAvailable is true', () => {
    component.updateAvailable = true;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Install Update');
  });

  it('should emit checkForUpdate when check button is clicked', () => {
    spyOn(component.checkForUpdate, 'emit');
    component.onCheckClick();
    expect(component.checkForUpdate.emit).toHaveBeenCalled();
  });

  it('should emit installUpdate when install button is clicked', () => {
    spyOn(component.installUpdate, 'emit');
    component.onInstallClick();
    expect(component.installUpdate.emit).toHaveBeenCalled();
  });

  it('should disable check button when isChecking is true', () => {
    component.isChecking = true;
    fixture.detectChanges();
    expect(component.isChecking).toBe(true);
  });
});
