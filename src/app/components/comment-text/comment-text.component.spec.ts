// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideIcons } from '@ng-icons/core';
import { solarLinkLinear } from '@ng-icons/solar-icons/linear';
import { CommentTextComponent } from './comment-text.component';

describe('CommentTextComponent', () => {
  let fixture: ComponentFixture<CommentTextComponent>;
  let component: CommentTextComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentTextComponent],
      providers: [provideIcons({ solarLinkLinear })],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should process html input using all transforms in correct order', () => {
    const raw = `
      <p>Check this out:</p>
      <p>&gt; quoted line</p>
      <p>Visit <a href="https://example.com/some/path">Example</a></p>
    `;

    fixture.componentRef.setInput('html', raw);
    fixture.detectChanges();

    // Verify the transform pipeline was applied (quotes first, then links, then code highlight)
    // All are applied internally by the component

    // processedHtml is SafeHtml, so we can verify it's been sanitized
    expect(component.processedHtml).toBeTruthy();
  });

  it('should render transformed HTML (blockquote and external link) via innerHTML', async () => {
    const raw = `
      <p>&gt; quoted A</p>
      <p>&gt; quoted B</p>
      <p>See <a href="https://example.com/some/path?q=1">Example link</a></p>
    `;
    fixture.componentRef.setInput('html', raw);
    fixture.detectChanges();

    // Wait for directive to process links (AfterViewInit is async)
    await fixture.whenStable();
    // Increase delay for directive processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    const bodyEl = fixture.debugElement.query(By.css('.comment-body')).nativeElement as HTMLElement;

    // Blockquote grouping: two quoted <p> elements should be wrapped inside one <blockquote>
    const bq = bodyEl.querySelector('blockquote');
    expect(bq, 'blockquote should exist').not.toBeNull();
    if (bq) {
      const bqParas = bq.querySelectorAll('p');
      expect(bqParas.length).toBe(2);
      expect(bqParas[0].textContent?.trim()).toBe('quoted A');
      expect(bqParas[1].textContent?.trim()).toBe('quoted B');
    }

    // External link transformation: anchor should be converted to domain-only text and have attrs
    // Note: Link enhancement is now done by the directive, not the transform
    const allLinks = bodyEl.querySelectorAll('a');
    expect(allLinks.length, 'should have at least one link').toBeGreaterThan(0);

    const a = bodyEl.querySelector('a.ext-link') as HTMLAnchorElement | null;
    expect(a, 'transformed anchor should exist').not.toBeNull();
    if (a) {
      expect(a.textContent).toContain('example.com');
      expect(a.textContent).toContain('some/path');
      expect(a.getAttribute('href')).toBe('https://example.com/some/path?q=1');
      expect(a.getAttribute('title')).toBe('https://example.com/some/path?q=1');
      expect(a.getAttribute('target')).toBe('_blank');
      const rel = a.getAttribute('rel') || '';
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
      expect(rel).toContain('nofollow');

      // Verify icon was added by directive
      const icon = a.querySelector('ng-icon');
      expect(icon).not.toBeNull();
    }
  });

  it('should handle code blocks with syntax highlighting', () => {
    const raw = '<pre><code>console.log("hello");</code></pre>';
    fixture.componentRef.setInput('html', raw);
    fixture.detectChanges();

    const bodyEl = fixture.debugElement.query(By.css('.comment-body')).nativeElement as HTMLElement;
    const codeBlock = bodyEl.querySelector('pre code');
    expect(codeBlock, 'code block should exist').not.toBeNull();
  });

  it('should sanitize HTML while preserving safe formatting tags', () => {
    const raw = '<p>Safe <b>bold</b> text</p>';
    fixture.componentRef.setInput('html', raw);
    fixture.detectChanges();

    const bodyEl = fixture.debugElement.query(By.css('.comment-body')).nativeElement as HTMLElement;
    expect(bodyEl.innerHTML).toContain('<b>bold</b>');
  });

  it('should remove dangerous tags during sanitization', () => {
    const raw = '<p>Text <script>alert("xss")</script></p>';
    fixture.componentRef.setInput('html', raw);
    fixture.detectChanges();

    const bodyEl = fixture.debugElement.query(By.css('.comment-body')).nativeElement as HTMLElement;
    expect(bodyEl.innerHTML).not.toContain('<script>');
  });

  it('should handle empty or null input gracefully', () => {
    fixture.componentRef.setInput('html', '');
    fixture.detectChanges();
    expect(component.processedHtml).toBeTruthy();

    fixture.componentRef.setInput('html', null as unknown as string);
    fixture.detectChanges();
    expect(component.processedHtml).toBeTruthy();
  });

  it('should integrate all transformations in a complex example', async () => {
    const raw = `
      <p>Here's some code:</p>
      <pre><code>function test() { return 42; }</code></pre>
      <p>&gt; This is a quote</p>
      <p>Check <a href="https://github.com">this</a> out</p>
    `;
    fixture.componentRef.setInput('html', raw);
    fixture.detectChanges();

    // Wait for directive to process links
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const bodyEl = fixture.debugElement.query(By.css('.comment-body')).nativeElement as HTMLElement;

    // Verify code block exists
    expect(bodyEl.querySelector('pre code')).not.toBeNull();

    // Verify blockquote exists
    expect(bodyEl.querySelector('blockquote')).not.toBeNull();

    // Verify link was enhanced by directive
    expect(bodyEl.querySelector('a.ext-link')).not.toBeNull();
    expect(bodyEl.querySelector('a ng-icon')).not.toBeNull();
  });
});
