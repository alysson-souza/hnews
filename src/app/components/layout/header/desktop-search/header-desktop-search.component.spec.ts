// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderDesktopSearchComponent } from './header-desktop-search.component';
import { By } from '@angular/platform-browser';
import { CommandRegistryService } from '@services/command-registry.service';

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

  describe('PWA refresh button', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('canRefresh', true);
      fixture.detectChanges();
    });

    it('should execute the story refresh command when clicked', () => {
      const commandRegistry = TestBed.inject(CommandRegistryService);
      vi.spyOn(commandRegistry, 'execute').mockResolvedValue();
      const btn = fixture.debugElement.query(By.css('button[aria-label="Refresh app"]'));

      btn.nativeElement.click();

      expect(commandRegistry.execute).toHaveBeenCalledWith('story.refresh');
    });

    it('should have explicit tabindex=0 for macOS/WebKit Tab focus', () => {
      const btn = fixture.debugElement.query(By.css('button[aria-label="Refresh app"]'));

      expect(btn.nativeElement.getAttribute('tabindex')).toBe('0');
    });

    it('should disable and spin while refreshing', () => {
      fixture.componentRef.setInput('refreshing', true);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('button[aria-label="Refreshing app"]'));
      const icon = btn.nativeElement.querySelector('ng-icon') as HTMLElement;

      expect(btn.nativeElement.disabled).toBe(true);
      expect(btn.nativeElement.getAttribute('aria-busy')).toBe('true');
      expect(icon.classList.contains('animate-spin')).toBe(true);
    });
  });
});
