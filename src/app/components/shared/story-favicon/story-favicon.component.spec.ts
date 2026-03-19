import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { StoryFaviconComponent } from './story-favicon.component';
import { PageLifecycleService } from '@services/page-lifecycle.service';

class PageLifecycleServiceStub {
  hiddenSince = signal<number | null>(null);
  isVisible = signal(true);
  resumeCount = signal(0);
  wasDiscarded = false;
}

describe('StoryFaviconComponent', () => {
  let component: StoryFaviconComponent;
  let fixture: ComponentFixture<StoryFaviconComponent>;
  let pageLifecycleStub: PageLifecycleServiceStub;

  beforeEach(async () => {
    pageLifecycleStub = new PageLifecycleServiceStub();

    await TestBed.configureTestingModule({
      imports: [StoryFaviconComponent],
      providers: [{ provide: PageLifecycleService, useValue: pageLifecycleStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(StoryFaviconComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('altText', 'Example');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should generate correct Google favicon URL', () => {
    fixture.componentRef.setInput('url', 'https://www.google.com/some/path');
    fixture.componentRef.setInput('altText', 'Google');
    fixture.detectChanges();

    expect(component.faviconUrl()).toBe('/api/favicons?domain=google.com');
  });

  it('should strip subdomains for favicon lookup', () => {
    fixture.componentRef.setInput('url', 'https://edition.cnn.com/2026/02/25/politics/some-story');
    fixture.componentRef.setInput('altText', 'CNN');
    fixture.detectChanges();

    expect(component.faviconUrl()).toBe('/api/favicons?domain=cnn.com');
  });

  it('should preserve compound country-code TLDs (co.uk)', () => {
    fixture.componentRef.setInput('url', 'https://news.bbc.co.uk/some/path');
    fixture.componentRef.setInput('altText', 'BBC');
    fixture.detectChanges();

    expect(component.faviconUrl()).toBe('/api/favicons?domain=bbc.co.uk');
  });

  it('should return default asset if no domain found', () => {
    fixture.componentRef.setInput('url', '');
    fixture.componentRef.setInput('altText', 'No URL');
    fixture.detectChanges();

    expect(component.faviconUrl()).toBe('/assets/default-thumb.svg');
  });

  it('should compute domain letter correctly', () => {
    fixture.componentRef.setInput('url', 'https://github.com/angular/angular');
    fixture.componentRef.setInput('altText', 'GitHub');
    fixture.detectChanges();

    expect(component.domainLetter()).toBe('G');
  });

  it('should handle www prefix in domain letter', () => {
    fixture.componentRef.setInput('url', 'https://www.reddit.com/r/angular');
    fixture.componentRef.setInput('altText', 'Reddit');
    fixture.detectChanges();

    expect(component.domainLetter()).toBe('R');
  });

  it('should show image initially', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('altText', 'Example');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    const letter = fixture.nativeElement.querySelector('div');

    expect(img).toBeTruthy();
    expect(letter).toBeFalsy();
  });

  it('should show letter fallback on error', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('altText', 'Example');
    fixture.detectChanges();

    component.handleError();
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    const letter = fixture.nativeElement.querySelector('div');

    expect(img).toBeFalsy();
    expect(letter).toBeTruthy();
    expect(letter.textContent.trim()).toBe('E');
  });

  it('should show letter fallback via DOM error event on img', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('altText', 'Example');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('div')).toBeTruthy();
  });

  it('should show letter fallback when Google returns a 16x16 globe', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('altText', 'Example');
    fixture.detectChanges();

    component.handleLoad({ target: { naturalWidth: 16, naturalHeight: 16 } } as unknown as Event);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('div')).toBeTruthy();
  });

  it('should keep image visible when a properly sized favicon loads', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('altText', 'Example');
    fixture.detectChanges();

    component.handleLoad({ target: { naturalWidth: 64, naturalHeight: 64 } } as unknown as Event);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('div')).toBeFalsy();
  });

  it('should reset error state when url input changes', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('altText', 'Example');
    fixture.detectChanges();

    component.handleError();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeFalsy();

    fixture.componentRef.setInput('url', 'https://github.com');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('div')).toBeFalsy();
  });

  it('should allow favicon to load after error recovery on new url', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('altText', 'Example');
    fixture.detectChanges();

    // Error on URL A
    component.handleError();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeFalsy();

    // Switch to URL B — img should show
    fixture.componentRef.setInput('url', 'https://github.com');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();

    // Error on URL B
    component.handleError();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeFalsy();

    // Switch back to URL A — img should show again
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('div')).toBeFalsy();
  });

  it('should reset error state on tab resume', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('altText', 'Example');
    fixture.detectChanges();

    // Trigger an error
    component.handleError();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeFalsy();

    // Simulate resume
    pageLifecycleStub.resumeCount.set(1);
    fixture.detectChanges();

    // Error should be cleared — favicon img should re-appear
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('div')).toBeFalsy();
  });

  it('should not change state on resume when no error', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('altText', 'Example');
    fixture.detectChanges();

    // No error — img should be showing
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();

    // Simulate resume
    pageLifecycleStub.resumeCount.set(1);
    fixture.detectChanges();

    // Should still be showing img
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
  });
});
