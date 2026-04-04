// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ScrollToTopComponent } from './scroll-to-top.component';
import { ScrollService } from '@services/scroll.service';

class ScrollServiceStub {
  scrollToTop = vi.fn();
}

describe('ScrollToTopComponent', () => {
  let component: ScrollToTopComponent;
  let fixture: ComponentFixture<ScrollToTopComponent>;
  let scrollService: ScrollServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollToTopComponent],
      providers: [{ provide: ScrollService, useClass: ScrollServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollToTopComponent);
    component = fixture.componentInstance;
    scrollService = TestBed.inject(ScrollService) as unknown as ScrollServiceStub;
  });

  it('renders the visible button with the primary shared variant', () => {
    component.isVisible.set(true);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('app-button button'));
    expect(button).toBeTruthy();
    expect(button.nativeElement.classList).toContain('btn-primary');
  });

  it('scrolls to the top when clicked', () => {
    component.isVisible.set(true);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('app-button button'));
    button.nativeElement.click();

    expect(scrollService.scrollToTop).toHaveBeenCalled();
  });
});
