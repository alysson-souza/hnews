import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoryFaviconComponent } from './story-favicon.component';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';

describe('StoryFaviconComponent', () => {
  let component: StoryFaviconComponent;
  let fixture: ComponentFixture<StoryFaviconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryFaviconComponent],
      providers: [
        {
          provide: IMAGE_LOADER,
          useValue: (config: ImageLoaderConfig) => {
            return config.src;
          },
        },
      ],
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

  it('should generate correct Unavatar URL', () => {
    fixture.componentRef.setInput('url', 'https://www.google.com/some/path');
    fixture.componentRef.setInput('altText', 'Google');
    fixture.detectChanges();

    expect(component.faviconUrl()).toBe('https://unavatar.io/google.com?fallback=false');
  });

  it('should strip subdomains for favicon lookup', () => {
    fixture.componentRef.setInput('url', 'https://edition.cnn.com/2026/02/25/politics/some-story');
    fixture.componentRef.setInput('altText', 'CNN');
    fixture.detectChanges();

    expect(component.faviconUrl()).toBe('https://unavatar.io/cnn.com?fallback=false');
  });

  it('should preserve compound country-code TLDs (co.uk)', () => {
    fixture.componentRef.setInput('url', 'https://news.bbc.co.uk/some/path');
    fixture.componentRef.setInput('altText', 'BBC');
    fixture.detectChanges();

    expect(component.faviconUrl()).toBe('https://unavatar.io/bbc.co.uk?fallback=false');
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
});
