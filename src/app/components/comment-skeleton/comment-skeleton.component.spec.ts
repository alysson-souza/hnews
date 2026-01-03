// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentSkeletonComponent } from './comment-skeleton.component';

describe('CommentSkeletonComponent', () => {
  let fixture: ComponentFixture<CommentSkeletonComponent>;
  let component: CommentSkeletonComponent;

  const getThreadContainer = (): HTMLDivElement | null =>
    fixture.nativeElement.querySelector('.thread-container');

  const getCommentCard = (): HTMLDivElement | null =>
    fixture.nativeElement.querySelector('.comment-card');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('renders base structure with skeleton card and loading lines', () => {
    const card = getCommentCard();
    expect(card, 'comment card should exist').not.toBeNull();
    expect(card!.classList.contains('skeleton')).toBe(true);

    const lines = card!.querySelectorAll('div');
    expect(lines.length).toBe(2);

    const line1 = lines.item(0) as HTMLDivElement;
    const line2 = lines.item(1) as HTMLDivElement;

    expect(line1.classList.contains('h-4')).toBe(true);
    expect(line1.classList.contains('rounded')).toBe(true);
    expect(line1.classList.contains('w-1/4')).toBe(true);
    expect(line1.classList.contains('mb-2')).toBe(true);

    expect(line2.classList.contains('h-3')).toBe(true);
    expect(line2.classList.contains('rounded')).toBe(true);
    expect(line2.classList.contains('w-3/4')).toBe(true);
  });

  it('does not apply thread-indent when depth is 0', () => {
    fixture.componentRef.setInput('depth', 0);
    fixture.detectChanges();

    const container = getThreadContainer()!;
    expect(container.classList.contains('thread-indent')).toBe(false);
  });

  it('applies thread-indent when depth > 0', () => {
    fixture.componentRef.setInput('depth', 1);
    fixture.detectChanges();

    const container = getThreadContainer()!;
    expect(container.classList.contains('thread-indent')).toBe(true);
  });

  it('updates classes when depth changes at runtime', () => {
    fixture.componentRef.setInput('depth', 2);
    fixture.detectChanges();

    let container = getThreadContainer()!;
    expect(container.classList.contains('thread-indent')).toBe(true);

    fixture.componentRef.setInput('depth', 0);
    fixture.detectChanges();

    container = getThreadContainer()!;
    expect(container.classList.contains('thread-indent')).toBe(false);
  });
});
