// SPDX-License-Identifier: MIT
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CommentTextComponent } from './comment-text.component';
import { transformQuotesHtml } from './quote.transform';
import { transformLinksToDomain } from './links.transform';

describe('CommentTextComponent', () => {
  let fixture: ComponentFixture<CommentTextComponent>;
  let component: CommentTextComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentTextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should process html input using quote and link transforms in order', () => {
    const raw = `
      <p>Check this out:</p>
      <p>&gt; quoted line</p>
      <p>Visit <a href="https://example.com/some/path">Example</a></p>
    `;

    component.html = raw;

    const expected = transformLinksToDomain(transformQuotesHtml(raw));
    expect(component.processedHtml).toBe(expected);
  });

  it('should render transformed HTML (blockquote and external link) via innerHTML', () => {
    const raw = `
      <p>&gt; quoted A</p>
      <p>&gt; quoted B</p>
      <p>See <a href="https://example.com/some/path?q=1">Example link</a></p>
    `;
    component.html = raw;
    fixture.detectChanges();

    const bodyEl = fixture.debugElement.query(By.css('.comment-body')).nativeElement as HTMLElement;

    // Blockquote grouping: two quoted <p> elements should be wrapped inside one <blockquote>
    const bq = bodyEl.querySelector('blockquote');
    expect(bq).withContext('blockquote should exist').not.toBeNull();
    if (bq) {
      const bqParas = bq.querySelectorAll('p');
      expect(bqParas.length).toBe(2);
      expect(bqParas[0].textContent?.trim()).toBe('quoted A');
      expect(bqParas[1].textContent?.trim()).toBe('quoted B');
    }

    // External link transformation: anchor should be converted to domain-only text and have attrs
    const a = bodyEl.querySelector('a.ext-link') as HTMLAnchorElement | null;
    expect(a).withContext('transformed anchor should exist').not.toBeNull();
    if (a) {
      expect(a.textContent?.trim()).toBe('example.com');
      expect(a.getAttribute('href')).toBe('https://example.com/some/path?q=1');
      expect(a.getAttribute('title')).toBe('https://example.com/some/path?q=1');
      expect(a.getAttribute('target')).toBe('_blank');
      const rel = a.getAttribute('rel') || '';
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
      expect(rel).toContain('nofollow');
    }
  });

  it('should handle empty or null input gracefully', () => {
    component.html = '';
    expect(component.processedHtml).toBe(transformLinksToDomain(transformQuotesHtml('')));

    component.html = null as unknown as string;
    expect(component.processedHtml).toBe(transformLinksToDomain(transformQuotesHtml('')));
  });
});
