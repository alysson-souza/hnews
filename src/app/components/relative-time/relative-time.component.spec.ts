// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelativeTimeComponent } from './relative-time.component';

describe('RelativeTimeComponent', () => {
  let component: RelativeTimeComponent;
  let fixture: ComponentFixture<RelativeTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelativeTimeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RelativeTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('format()', () => {
    const now = Math.floor(Date.now() / 1000);

    it('should return "just now" for current timestamp', () => {
      expect(component.format(now)).toBe('just now');
    });

    it('should return "1 minute ago"', () => {
      expect(component.format(now - 60)).toBe('1 minute ago');
    });

    it('should return "2 minutes ago"', () => {
      expect(component.format(now - 120)).toBe('2 minutes ago');
    });

    it('should return "1 hour ago"', () => {
      expect(component.format(now - 3600)).toBe('1 hour ago');
    });

    it('should return "5 hours ago"', () => {
      expect(component.format(now - 5 * 3600)).toBe('5 hours ago');
    });

    it('should return "1 day ago"', () => {
      expect(component.format(now - 24 * 3600)).toBe('1 day ago');
    });

    it('should return "3 days ago"', () => {
      expect(component.format(now - 3 * 24 * 3600)).toBe('3 days ago');
    });

    it('should handle future timestamps as "just now"', () => {
      expect(component.format(now + 100)).toBe('just now');
    });
  });

  it('should render formatted time in template', () => {
    const now = Math.floor(Date.now() / 1000);
    component.timestamp = now - 3600;
    fixture.detectChanges();
    const span: HTMLElement = fixture.nativeElement.querySelector('.time-text');
    expect(span.textContent).toBe('1 hour ago');
  });
});
