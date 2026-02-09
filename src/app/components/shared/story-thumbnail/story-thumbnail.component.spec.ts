// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { StoryThumbnailComponent } from './story-thumbnail.component';
import { OgImageService } from '../../../services/og-image.service';
import { PrivacyRedirectService } from '../../../services/privacy-redirect.service';
import type { OgImageResult } from '../../../services/og-image.service';

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

class OgImageServiceStub {
  /** Captured callbacks keyed by article URL. */
  callbacks = new Map<string, (result: OgImageResult) => void>();
  observedElements = new Map<Element, string>();
  cleanupCalls: string[] = [];

  observe = vi.fn((el: Element, url: string, cb: (result: OgImageResult) => void): (() => void) => {
    this.observedElements.set(el, url);
    this.callbacks.set(url, cb);
    return () => {
      this.cleanupCalls.push(url);
      this.observedElements.delete(el);
      this.callbacks.delete(url);
    };
  });

  /** Simulate the service resolving an OG result. */
  resolve(url: string, result: OgImageResult): void {
    const cb = this.callbacks.get(url);
    if (cb) cb(result);
  }
}

class PrivacyRedirectServiceStub {
  transformUrl = vi.fn((url: string) => url);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StoryThumbnailComponent', () => {
  let component: StoryThumbnailComponent;
  let fixture: ComponentFixture<StoryThumbnailComponent>;
  let ogImageStub: OgImageServiceStub;
  let redirectStub: PrivacyRedirectServiceStub;

  beforeEach(async () => {
    ogImageStub = new OgImageServiceStub();
    redirectStub = new PrivacyRedirectServiceStub();

    await TestBed.configureTestingModule({
      imports: [StoryThumbnailComponent],
      providers: [
        {
          provide: IMAGE_LOADER,
          useValue: (config: ImageLoaderConfig) => config.src,
        },
        { provide: OgImageService, useValue: ogImageStub },
        { provide: PrivacyRedirectService, useValue: redirectStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StoryThumbnailComponent);
    component = fixture.componentInstance;
  });

  // -----------------------------------------------------------------------
  // Basic rendering
  // -----------------------------------------------------------------------

  it('should create', () => {
    fixture.componentRef.setInput('storyTitle', 'Test Story');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show placeholder for text posts', () => {
    fixture.componentRef.setInput('storyTitle', 'Ask HN: Something');
    fixture.componentRef.setInput('isTextPost', true);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg');
    const favicon = fixture.nativeElement.querySelector('app-story-favicon');

    expect(svg).toBeTruthy();
    expect(favicon).toBeFalsy();
  });

  it('should show favicon for link posts', () => {
    fixture.componentRef.setInput('storyTitle', 'Show HN: Something');
    fixture.componentRef.setInput('storyUrl', 'https://example.com');
    fixture.componentRef.setInput('isTextPost', false);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg');
    const favicon = fixture.nativeElement.querySelector('app-story-favicon');

    expect(svg).toBeFalsy();
    expect(favicon).toBeTruthy();
  });

  it('should emit linkClicked event when clicked', () => {
    fixture.componentRef.setInput('storyTitle', 'Test Story');
    fixture.componentRef.setInput('storyUrl', 'https://example.com');
    fixture.detectChanges();

    let emitted = false;
    component.linkClicked.subscribe(() => (emitted = true));

    const link = fixture.nativeElement.querySelector('a');
    link.click();

    expect(emitted).toBe(true);
  });

  // -----------------------------------------------------------------------
  // OG image service integration
  // -----------------------------------------------------------------------

  describe('OG image integration', () => {
    it('does not observe when isTextPost is true', async () => {
      fixture.componentRef.setInput('storyTitle', 'Ask HN');
      fixture.componentRef.setInput('storyUrl', 'https://example.com');
      fixture.componentRef.setInput('isTextPost', true);
      fixture.detectChanges();

      await Promise.resolve(); // flush queueMicrotask

      expect(ogImageStub.observe).not.toHaveBeenCalled();
    });

    it('does not observe when storyUrl is empty', async () => {
      fixture.componentRef.setInput('storyTitle', 'Test Story');
      fixture.detectChanges();

      await Promise.resolve();

      expect(ogImageStub.observe).not.toHaveBeenCalled();
    });

    it('observes element via OgImageService for link posts', async () => {
      const url = 'https://example.com/article';
      fixture.componentRef.setInput('storyTitle', 'Test Story');
      fixture.componentRef.setInput('storyUrl', url);
      fixture.detectChanges();

      await Promise.resolve(); // flush queueMicrotask

      expect(ogImageStub.observe).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        url,
        expect.any(Function),
      );
    });

    it('shows OG image when service resolves with imageUrl', async () => {
      const url = 'https://example.com/article';
      fixture.componentRef.setInput('storyTitle', 'Test Story');
      fixture.componentRef.setInput('storyUrl', url);
      fixture.detectChanges();

      await Promise.resolve();

      ogImageStub.resolve(url, {
        imageUrl: '/api/og-image-proxy?url=https%3A%2F%2Fcdn.example.com%2Fog.jpg',
        title: 'Article Title',
        description: 'Article Description',
      });
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('img.og-image');
      expect(img).toBeTruthy();
      expect(img.src).toContain('/api/og-image-proxy');
      expect(img.alt).toBe('Preview for Test Story');
    });

    it('keeps showing favicon when service resolves with null imageUrl', async () => {
      const url = 'https://example.com/article';
      fixture.componentRef.setInput('storyTitle', 'Test Story');
      fixture.componentRef.setInput('storyUrl', url);
      fixture.detectChanges();

      await Promise.resolve();

      ogImageStub.resolve(url, {
        imageUrl: null,
        title: 'Title',
        description: null,
      });
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('img.og-image');
      const favicon = fixture.nativeElement.querySelector('app-story-favicon');
      expect(img).toBeFalsy();
      expect(favicon).toBeTruthy();
    });

    it('cleans up observer on destroy', async () => {
      const url = 'https://example.com/article';
      fixture.componentRef.setInput('storyTitle', 'Test Story');
      fixture.componentRef.setInput('storyUrl', url);
      fixture.detectChanges();

      await Promise.resolve();

      fixture.destroy();

      expect(ogImageStub.cleanupCalls).toContain(url);
    });
  });

  // -----------------------------------------------------------------------
  // OG image fade-in
  // -----------------------------------------------------------------------

  describe('OG image fade-in', () => {
    it('starts with ogImageLoaded as false', () => {
      fixture.componentRef.setInput('storyTitle', 'Test');
      fixture.detectChanges();
      expect(component.ogImageLoaded()).toBe(false);
    });

    it('sets ogImageLoaded to true on handleOgImageLoad', () => {
      fixture.componentRef.setInput('storyTitle', 'Test');
      fixture.detectChanges();

      component.handleOgImageLoad();
      expect(component.ogImageLoaded()).toBe(true);
    });

    it('resets ogImageLoaded when OG result arrives', async () => {
      const url = 'https://example.com/article';
      fixture.componentRef.setInput('storyTitle', 'Test');
      fixture.componentRef.setInput('storyUrl', url);
      fixture.detectChanges();

      await Promise.resolve();

      // Manually set loaded to true first
      component.ogImageLoaded.set(true);

      // Service delivers a result — should reset loaded to false
      ogImageStub.resolve(url, {
        imageUrl: '/api/og-image-proxy?url=https%3A%2F%2Fexample.com%2Fog.jpg',
        title: null,
        description: null,
      });

      expect(component.ogImageLoaded()).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe('OG image error handling', () => {
    it('falls back to favicon on image error', async () => {
      const url = 'https://example.com/article';
      fixture.componentRef.setInput('storyTitle', 'Test');
      fixture.componentRef.setInput('storyUrl', url);
      fixture.detectChanges();

      await Promise.resolve();

      // Deliver OG image
      ogImageStub.resolve(url, {
        imageUrl: '/api/og-image-proxy?url=broken',
        title: 'OG Title',
        description: 'OG Desc',
      });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('img.og-image')).toBeTruthy();

      // Simulate image load error
      component.handleOgImageError();
      fixture.detectChanges();

      expect(component.ogImageUrl()).toBeNull();
      expect(component.ogTitle()).toBeNull();
      expect(component.ogDescription()).toBeNull();
      expect(component.ogImageLoaded()).toBe(false);

      expect(fixture.nativeElement.querySelector('img.og-image')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('app-story-favicon')).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // Tooltip (ogTooltip computed signal)
  // -----------------------------------------------------------------------

  describe('ogTooltip', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('storyTitle', 'Story Title');
      fixture.detectChanges();
    });

    it('returns null when no OG data and no story title', () => {
      fixture.componentRef.setInput('storyTitle', '');
      fixture.detectChanges();
      expect(component.ogTooltip()).toBeNull();
    });

    it('falls back to story title when no OG data', () => {
      expect(component.ogTooltip()).toBe('Story Title');
    });

    it('shows og:title when available', () => {
      component.ogTitle.set('OG Title');
      expect(component.ogTooltip()).toBe('OG Title');
    });

    it('shows og:description when available', () => {
      component.ogDescription.set('OG Description');
      expect(component.ogTooltip()).toBe('OG Description');
    });

    it('joins og:title and og:description with newline', () => {
      component.ogTitle.set('OG Title');
      component.ogDescription.set('OG Description');
      expect(component.ogTooltip()).toBe('OG Title\nOG Description');
    });

    it('prefers OG data over story title fallback', () => {
      component.ogTitle.set('OG Title');
      expect(component.ogTooltip()).toBe('OG Title');
      // Not 'Story Title'
    });
  });

  // -----------------------------------------------------------------------
  // Privacy redirect integration
  // -----------------------------------------------------------------------

  describe('privacy redirect', () => {
    it('opens transformed URL when redirect applies', () => {
      const url = 'https://youtube.com/watch?v=123';
      const transformed = 'https://piped.video/watch?v=123';
      redirectStub.transformUrl.mockReturnValue(transformed);

      fixture.componentRef.setInput('storyTitle', 'Test');
      fixture.componentRef.setInput('storyUrl', url);
      fixture.detectChanges();

      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      let emitted = false;
      component.linkClicked.subscribe(() => (emitted = true));

      const link = fixture.nativeElement.querySelector('a');
      link.click();

      expect(windowOpenSpy).toHaveBeenCalledWith(transformed, '_blank', 'noopener,noreferrer');
      expect(emitted).toBe(true);
      windowOpenSpy.mockRestore();
    });

    it('lets link work normally when no redirect applies', () => {
      const url = 'https://example.com';
      redirectStub.transformUrl.mockReturnValue(url);

      fixture.componentRef.setInput('storyTitle', 'Test');
      fixture.componentRef.setInput('storyUrl', url);
      fixture.detectChanges();

      let emitted = false;
      component.linkClicked.subscribe(() => (emitted = true));

      const link = fixture.nativeElement.querySelector('a');
      link.click();

      expect(emitted).toBe(true);
    });
  });
});
