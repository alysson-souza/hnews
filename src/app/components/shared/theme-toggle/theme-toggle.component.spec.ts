// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { By } from '@angular/platform-browser';

describe('ThemeToggleComponent', () => {
  let fixture: ComponentFixture<ThemeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
  });

  describe('theme toggle button', () => {
    it('should be a native button element', () => {
      const btn = fixture.debugElement.query(By.css('button'));
      expect(btn).toBeTruthy();
      expect(btn.nativeElement.tagName).toBe('BUTTON');
    });

    it('should have explicit tabindex=0 for macOS/WebKit Tab focus', () => {
      const btn = fixture.debugElement.query(By.css('button'));
      expect(btn.nativeElement.getAttribute('tabindex')).toBe('0');
    });

    it('should have an accessible aria-label', () => {
      const btn = fixture.debugElement.query(By.css('button'));
      expect(btn.nativeElement.getAttribute('aria-label')).toContain('Switch to');
    });
  });
});
