// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CommentHeaderComponent } from './comment-header.component';

import { provideRouter } from '@angular/router';

describe('CommentHeaderComponent', () => {
  let fixture: ComponentFixture<CommentHeaderComponent>;
  let component: CommentHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentHeaderComponent);
    component = fixture.componentInstance;
    // Required input
    fixture.componentRef.setInput('timestamp', Math.floor(Date.now() / 1000) - 60);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('renders user tag when "by" is provided', () => {
    fixture.componentRef.setInput('by', 'alice');
    fixture.detectChanges();

    const userTag = fixture.debugElement.query(By.css('app-user-tag'));
    expect(userTag).toBeDefined();
    expect(fixture.nativeElement.textContent).toContain('alice');
  });

  it('does not render user tag when "by" is missing', () => {
    fixture.componentRef.setInput('by', undefined);
    fixture.detectChanges();

    const userTag = fixture.debugElement.query(By.css('app-user-tag'));
    expect(userTag).toBeNull();
  });

  it('always renders relative time with timestamp', () => {
    // Stabilize now to make output deterministic
    const fixedNow = 2000000000000; // ms
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
    fixture.componentRef.setInput('timestamp', Math.floor(fixedNow / 1000) - 60); // 1 minute ago
    fixture.detectChanges();
    const timeEl = fixture.debugElement.query(By.css('.time-text'));
    expect(timeEl, 'relative time span not found').toBeDefined();
    expect(fixture.nativeElement.textContent).toContain('1 minute ago');
  });

  it('forwards upvote click via (vote) to parent output', () => {
    const upvoteBtnDe = fixture.debugElement.query(By.css('app-upvote-button button'));
    expect(upvoteBtnDe).toBeDefined();

    let emitted = false;
    component.upvote.subscribe(() => (emitted = true));

    (upvoteBtnDe.nativeElement as HTMLButtonElement).click();
    expect(emitted).toBe(true);
  });

  it('sets aria-label on upvote button based on voted state', () => {
    fixture.componentRef.setInput('voted', false);
    fixture.detectChanges();
    let upvoteBtn: HTMLButtonElement = fixture.debugElement.query(
      By.css('app-upvote-button button'),
    ).nativeElement;
    expect(upvoteBtn.getAttribute('aria-label')).toBe('Upvote comment');

    fixture.componentRef.setInput('voted', true);
    fixture.detectChanges();
    upvoteBtn = fixture.debugElement.query(By.css('app-upvote-button button')).nativeElement;
    expect(upvoteBtn.getAttribute('aria-label')).toBe('Already upvoted comment');
  });

  it('renders replies counter only when showExpand=true', () => {
    fixture.componentRef.setInput('showExpand', false);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-replies-counter'))).toBeNull();

    fixture.componentRef.setInput('showExpand', true);
    fixture.componentRef.setInput('repliesCount', 3);
    fixture.detectChanges();

    const repliesEl = fixture.debugElement.query(By.css('app-replies-counter'));
    expect(repliesEl).toBeDefined();
    // Button text is rendered inside child; ensure the button exists
    expect(
      fixture.debugElement.query(By.css('app-replies-counter button')),
      'expand button not found',
    ).toBeDefined();
  });

  it('forwards expand click via (expand) to parent output', () => {
    fixture.componentRef.setInput('showExpand', true);
    fixture.componentRef.setInput('repliesCount', 2);
    fixture.detectChanges();

    let expanded = false;
    component.expand.subscribe(() => (expanded = true));

    const btnDe = fixture.debugElement.query(By.css('app-replies-counter button'));
    (btnDe.nativeElement as HTMLButtonElement).click();
    expect(expanded).toBe(true);
  });
});
