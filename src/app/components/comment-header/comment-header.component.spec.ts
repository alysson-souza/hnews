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
    component.timestamp = Math.floor(Date.now() / 1000) - 60;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('renders user tag when "by" is provided', () => {
    component.by = 'alice';
    fixture.detectChanges();

    const userTag = fixture.debugElement.query(By.css('app-user-tag'));
    expect(userTag).toBeDefined();
    expect(fixture.nativeElement.textContent).toContain('alice');
  });

  it('does not render user tag when "by" is missing', () => {
    component.by = undefined;
    fixture.detectChanges();

    const userTag = fixture.debugElement.query(By.css('app-user-tag'));
    expect(userTag).toBeNull();
  });

  it('always renders relative time with timestamp', () => {
    // Stabilize now to make output deterministic
    const fixedNow = 2_000_000_000_000; // ms
    spyOn(Date, 'now').and.returnValue(fixedNow);
    component.timestamp = Math.floor(fixedNow / 1000) - 60; // 1 minute ago
    fixture.detectChanges();
    const timeEl = fixture.debugElement.query(By.css('.time-text'));
    expect(timeEl).withContext('relative time span not found').toBeDefined();
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
    component.voted = false;
    fixture.detectChanges();
    let upvoteBtn: HTMLButtonElement = fixture.debugElement.query(
      By.css('app-upvote-button button'),
    ).nativeElement;
    expect(upvoteBtn.getAttribute('aria-label')).toBe('Upvote comment');

    component.voted = true;
    fixture.detectChanges();
    upvoteBtn = fixture.debugElement.query(By.css('app-upvote-button button')).nativeElement;
    expect(upvoteBtn.getAttribute('aria-label')).toBe('Already upvoted comment');
  });

  it('renders replies counter only when showExpand=true', () => {
    component.showExpand = false;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-replies-counter'))).toBeNull();

    component.showExpand = true;
    component.repliesCount = 3;
    fixture.detectChanges();

    const repliesEl = fixture.debugElement.query(By.css('app-replies-counter'));
    expect(repliesEl).toBeDefined();
    // Button text is rendered inside child; ensure the button exists
    expect(fixture.debugElement.query(By.css('app-replies-counter button')))
      .withContext('expand button not found')
      .toBeDefined();
  });

  it('forwards expand click via (expand) to parent output', () => {
    component.showExpand = true;
    component.repliesCount = 2;
    fixture.detectChanges();

    let expanded = false;
    component.expand.subscribe(() => (expanded = true));

    const btnDe = fixture.debugElement.query(By.css('app-replies-counter button'));
    (btnDe.nativeElement as HTMLButtonElement).click();
    expect(expanded).toBe(true);
  });
});
