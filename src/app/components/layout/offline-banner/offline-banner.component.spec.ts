// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfflineBannerComponent } from './offline-banner.component';

describe('OfflineBannerComponent', () => {
  let fixture: ComponentFixture<OfflineBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfflineBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OfflineBannerComponent);
  });

  it('renders the offline state when visible', () => {
    const component = fixture.componentInstance;
    component.visible = true;
    component.offline = true;

    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.offline-banner') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.classList.contains('offline-banner-yellow')).toBeTrue();
    expect(banner.textContent).toContain('You are offline');
  });

  it('renders the online state when visible and online', () => {
    const component = fixture.componentInstance;
    component.visible = true;
    component.offline = false;

    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.offline-banner') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.classList.contains('offline-banner-green')).toBeTrue();
    expect(banner.textContent).toContain('Back online');
  });

  it('does not render when not visible', () => {
    const component = fixture.componentInstance;
    component.visible = false;

    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.offline-banner');
    expect(banner).toBeNull();
  });
});
