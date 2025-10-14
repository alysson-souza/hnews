// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentSkeletonComponent } from './comment-skeleton.component';

describe('CommentSkeletonComponent', () => {
  let fixture: ComponentFixture<CommentSkeletonComponent>;
  let component: CommentSkeletonComponent;

  const getContainer = (): HTMLDivElement | null =>
    fixture.nativeElement.querySelector('div.skeleton.mb-4');

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

  it('renders base structure with two skeleton lines', () => {
    const container = getContainer();
    expect(container).withContext('container should exist').not.toBeNull();

    const children = container!.children;
    expect(children.length).toBe(2);

    const line1 = children.item(0) as HTMLDivElement;
    const line2 = children.item(1) as HTMLDivElement;

    expect(line1.classList.contains('h-4')).toBe(true);
    expect(line1.classList.contains('bg-gray-200')).toBe(true);
    expect(line1.classList.contains('dark:bg-slate-800')).toBe(true);
    expect(line1.classList.contains('rounded')).toBe(true);
    expect(line1.classList.contains('w-1/4')).toBe(true);
    expect(line1.classList.contains('mb-2')).toBe(true);

    expect(line2.classList.contains('h-3')).toBe(true);
    expect(line2.classList.contains('bg-gray-200')).toBe(true);
    expect(line2.classList.contains('dark:bg-slate-800')).toBe(true);
    expect(line2.classList.contains('rounded')).toBe(true);
    expect(line2.classList.contains('w-3/4')).toBe(true);
  });

  it('does not render indentation/border classes when depth is 0 (default)', () => {
    component.depth = 0;
    fixture.detectChanges();

    const container = getContainer()!;
    const classList = container.classList;

    expect(classList.contains('ml-4')).toBe(false);
    expect(classList.contains('border-l-2')).toBe(false);
    expect(classList.contains('border-gray-200')).toBe(false);
    expect(classList.contains('dark:border-slate-700')).toBe(false);
    expect(classList.contains('pl-4')).toBe(false);
    expect(classList.contains('relative')).toBe(false);
    expect(classList.contains('group')).toBe(false);
  });

  it('applies indentation/border classes when depth > 0', () => {
    component.depth = 1;
    fixture.detectChanges();

    const container = getContainer()!;
    const classList = container.classList;

    expect(classList.contains('ml-4')).toBe(true);
    expect(classList.contains('border-l-2')).toBe(true);
    expect(classList.contains('border-gray-200')).toBe(true);
    expect(classList.contains('dark:border-slate-700')).toBe(true);
    expect(classList.contains('pl-4')).toBe(true);
    expect(classList.contains('relative')).toBe(true);
    expect(classList.contains('group')).toBe(true);
  });

  it('updates classes when depth changes at runtime', () => {
    component.depth = 2;
    fixture.detectChanges();

    let container = getContainer()!;
    let classList = container.classList;

    expect(classList.contains('ml-4')).toBe(true);
    expect(classList.contains('border-l-2')).toBe(true);
    expect(classList.contains('pl-4')).toBe(true);

    component.depth = 0;
    fixture.detectChanges();

    container = getContainer()!;
    classList = container.classList;

    expect(classList.contains('ml-4')).toBe(false);
    expect(classList.contains('border-l-2')).toBe(false);
    expect(classList.contains('border-gray-200')).toBe(false);
    expect(classList.contains('dark:border-slate-700')).toBe(false);
    expect(classList.contains('pl-4')).toBe(false);
    expect(classList.contains('relative')).toBe(false);
    expect(classList.contains('group')).toBe(false);
  });
});
