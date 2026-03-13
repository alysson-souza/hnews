// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SegmentedControlComponent } from './segmented-control.component';
import { By } from '@angular/platform-browser';

describe('SegmentedControlComponent', () => {
  let fixture: ComponentFixture<SegmentedControlComponent>;

  const testOptions = [
    { value: 'default', label: 'Default' },
    { value: 'top50', label: 'Top 50%' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentedControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentedControlComponent);
    fixture.componentRef.setInput('options', testOptions);
    fixture.componentRef.setInput('value', 'default');
    fixture.detectChanges();
  });

  describe('tab focus accessibility', () => {
    it('should render all options as native button elements', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button.segment-button'));
      expect(buttons.length).toBe(2);
    });

    it('should have explicit tabindex=0 on all segment buttons for macOS/WebKit Tab focus', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button.segment-button'));
      for (const btn of buttons) {
        expect(btn.nativeElement.getAttribute('tabindex')).toBe('0');
      }
    });

    it('should have proper ARIA role attributes', () => {
      const container = fixture.debugElement.query(By.css('[role="tablist"]'));
      expect(container).toBeTruthy();

      const buttons = fixture.debugElement.queryAll(By.css('button.segment-button'));
      for (const btn of buttons) {
        expect(btn.nativeElement.getAttribute('role')).toBe('tab');
      }
    });
  });

  describe('keyboard navigation', () => {
    it('should emit value change on ArrowRight', () => {
      const spy = vi.fn();
      fixture.componentInstance.valueChange.subscribe(spy);

      const firstButton = fixture.debugElement.queryAll(By.css('button.segment-button'))[0];
      firstButton.triggerEventHandler(
        'keydown',
        new KeyboardEvent('keydown', { key: 'ArrowRight' }),
      );

      expect(spy).toHaveBeenCalledWith('top50');
    });

    it('should emit value change on ArrowLeft from second option', () => {
      const spy = vi.fn();
      fixture.componentRef.setInput('value', 'top50');
      fixture.detectChanges();

      fixture.componentInstance.valueChange.subscribe(spy);

      const secondButton = fixture.debugElement.queryAll(By.css('button.segment-button'))[1];
      secondButton.triggerEventHandler(
        'keydown',
        new KeyboardEvent('keydown', { key: 'ArrowLeft' }),
      );

      expect(spy).toHaveBeenCalledWith('default');
    });
  });
});
