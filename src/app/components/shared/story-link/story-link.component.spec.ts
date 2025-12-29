// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StoryLinkComponent } from './story-link.component';

@Component({
  template: `
    <app-story-link
      [url]="url()"
      [textContent]="content()"
      [linkTitle]="title()"
      class="test-link"
    />
  `,
  imports: [StoryLinkComponent],
})
class TestComponent {
  url = signal<string | undefined>(undefined);
  title = signal('');
  content = signal('Test Content');
}

describe('StoryLinkComponent', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('should render content without link when no URL', () => {
    component.url.set(undefined);
    fixture.detectChanges();

    expect(element.textContent).toContain('Test Content');
    expect(element.querySelector('a')).toBeFalsy();
  });

  it('should render external link for non-HN URLs', () => {
    component.url.set('https://example.com');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
  });

  it('should render internal routerLink for HN item URLs', () => {
    component.url.set('https://news.ycombinator.com/item?id=12345');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/item/12345');
    expect(link?.getAttribute('target')).toBeNull();
  });

  it('should render internal routerLink for HN user URLs', () => {
    component.url.set('https://news.ycombinator.com/user?id=pg');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/user/pg');
  });

  it('should set title attribute', () => {
    component.url.set('https://example.com');
    component.title.set('Test Title');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link?.getAttribute('title')).toBe('Test Title');
  });
});

describe('StoryLinkComponent with htmlContent', () => {
  @Component({
    template: `<app-story-link [url]="url()" [htmlContent]="html()" class="test-link" />`,
    imports: [StoryLinkComponent],
  })
  class HtmlTestComponent {
    url = signal<string | undefined>(undefined);
    html = signal('<em>Highlighted</em> Text');
  }

  let fixture: ComponentFixture<HtmlTestComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HtmlTestComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HtmlTestComponent);
    element = fixture.nativeElement;
  });

  it('should render HTML content', () => {
    fixture.componentInstance.url.set('https://example.com');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link?.innerHTML).toContain('<em>Highlighted</em>');
  });
});
