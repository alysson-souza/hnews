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

    const expectedUrl = 'https://unavatar.io/google.com?fallback=false';
    expect(component.faviconUrl()).toBe(expectedUrl);
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
});
