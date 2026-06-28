// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentSkeletonComponent } from './comment-skeleton.component';

describe('CommentSkeletonComponent', () => {
  let fixture: ComponentFixture<CommentSkeletonComponent>;

  const getThreadContainer = (): HTMLDivElement | null =>
    fixture.nativeElement.querySelector('.thread-container');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentSkeletonComponent);
    fixture.detectChanges();
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
