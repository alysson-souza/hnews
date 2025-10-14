// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PwaVersionInfoComponent } from './pwa-version-info.component';

describe('PwaVersionInfoComponent', () => {
  let component: PwaVersionInfoComponent;
  let fixture: ComponentFixture<PwaVersionInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaVersionInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaVersionInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default version info when no inputs provided', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('unknown');
  });

  it('should display provided version info', () => {
    component.version = '1.0.0';
    component.commit = 'abc123';
    component.buildTime = '2025-10-15';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('1.0.0');
    expect(compiled.textContent).toContain('abc123');
    expect(compiled.textContent).toContain('2025-10-15');
  });

  it('should have correct structure with labels and values', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = compiled.querySelectorAll('.version-label');
    const values = compiled.querySelectorAll('.version-value');

    expect(labels.length).toBe(3);
    expect(values.length).toBe(3);
    expect(labels[0].textContent).toBe('Version');
    expect(labels[1].textContent).toBe('Commit');
    expect(labels[2].textContent).toBe('Build Time');
  });
});
