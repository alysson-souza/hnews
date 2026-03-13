// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderDesktopSearchComponent } from './header-desktop-search.component';
import { By } from '@angular/platform-browser';

describe('HeaderDesktopSearchComponent', () => {
  let fixture: ComponentFixture<HeaderDesktopSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderDesktopSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderDesktopSearchComponent);
    fixture.detectChanges();
  });

  describe('keyboard shortcuts button', () => {
    it('should be a native button element', () => {
      const btn = fixture.debugElement.query(
        By.css('button[aria-label="Show keyboard shortcuts"]'),
      );
      expect(btn).toBeTruthy();
      expect(btn.nativeElement.tagName).toBe('BUTTON');
    });

    it('should have explicit tabindex=0 for macOS/WebKit Tab focus', () => {
      const btn = fixture.debugElement.query(
        By.css('button[aria-label="Show keyboard shortcuts"]'),
      );
      expect(btn.nativeElement.getAttribute('tabindex')).toBe('0');
    });
  });
});
