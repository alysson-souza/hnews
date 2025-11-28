// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResultMetaComponent } from './result-meta.component';
import { UserTagComponent } from '../user-tag/user-tag.component';

describe('ResultMetaComponent', () => {
  let component: ResultMetaComponent;
  let fixture: ComponentFixture<ResultMetaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultMetaComponent, UserTagComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultMetaComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('story result metadata', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isComment', false);
      fixture.componentRef.setInput('itemId', '123');
      fixture.componentRef.setInput('commentCount', 42);
      fixture.componentRef.setInput('points', 100);
      fixture.componentRef.setInput('author', 'john_doe');
      fixture.componentRef.setInput('timeAgo', '2 hours ago');
    });

    it('should display author username', () => {
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('john_doe');
    });

    it('should display points for story', () => {
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('100 points');
    });

    it('should display comment count link for story', () => {
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('42 comments');
    });

    it('should display time ago', () => {
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('2 hours ago');
    });
  });

  describe('comment result metadata', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isComment', true);
      fixture.componentRef.setInput('itemId', '456');
      fixture.componentRef.setInput('parentId', '789');
      fixture.componentRef.setInput('author', 'jane_doe');
      fixture.componentRef.setInput('timeAgo', '1 hour ago');
    });

    it('should not display points for comment', () => {
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent;
      expect(text).not.toContain('points');
    });

    it('should display view comment and story links', () => {
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('View Comment');
      expect(text).toContain('View Story');
    });
  });

  describe('optional fields', () => {
    it('should not display author section when missing', () => {
      fixture.componentRef.setInput('author', undefined);
      fixture.componentRef.setInput('timeAgo', 'now');
      fixture.detectChanges();
      const bySpan = Array.from(fixture.nativeElement.querySelectorAll('span') as Element[]).find(
        (el) => el.textContent === 'by',
      );
      expect(bySpan).toBeFalsy();
    });

    it('should handle missing points gracefully', () => {
      fixture.componentRef.setInput('isComment', false);
      fixture.componentRef.setInput('points', undefined);
      fixture.componentRef.setInput('itemId', '123');
      fixture.componentRef.setInput('commentCount', 5);
      fixture.componentRef.setInput('timeAgo', 'now');
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent;
      expect(text).not.toContain('undefined');
      expect(text).toContain('5 comments');
    });
  });
});
