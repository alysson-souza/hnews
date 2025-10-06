// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { ScrollService, ScrollOptions } from './scroll.service';

describe('ScrollService', () => {
  let service: ScrollService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScrollService],
    });
    service = TestBed.inject(ScrollService);

    // Mock window.scrollTo
    spyOn(window, 'scrollTo');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('scrollToTop', () => {
    it('should scroll to top with smooth behavior by default', async () => {
      await service.scrollToTop();

      expect(window.scrollTo).toHaveBeenCalled();
    });

    it('should accept custom scroll behavior', async () => {
      const options: ScrollOptions = {
        behavior: 'auto',
      };

      await service.scrollToTop(options);

      expect(window.scrollTo).toHaveBeenCalled();
    });

    it('should handle delay correctly', async () => {
      const options: ScrollOptions = { delay: 100 };

      const promise = service.scrollToTop(options);

      expect(window.scrollTo).not.toHaveBeenCalled();

      await promise;

      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  describe('scrollToElement', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = {
        getBoundingClientRect: jasmine.createSpy('getBoundingClientRect').and.returnValue({
          top: 100,
          height: 50,
          width: 300,
          left: 0,
          bottom: 150,
          right: 300,
          x: 0,
          y: 100,
        }),
      } as jasmine.SpyObj<HTMLElement>;

      spyOn(document, 'getElementById').and.returnValue(mockElement);
      spyOn(document, 'querySelector').and.returnValue({
        getBoundingClientRect: jasmine
          .createSpy('getBoundingClientRect')
          .and.returnValue({ height: 80 }),
      } as unknown as HTMLElement);
    });

    it('should scroll to element by ID with default options', async () => {
      await service.scrollToElement('test-element');

      expect(document.getElementById).toHaveBeenCalledWith('test-element');
      expect(window.scrollTo).toHaveBeenCalled();
    });

    it('should handle element not found', async () => {
      (document.getElementById as jasmine.Spy).and.returnValue(null);

      await service.scrollToElement('non-existent');

      expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it('should handle missing header gracefully', async () => {
      (document.querySelector as jasmine.Spy).and.returnValue(null);

      await service.scrollToElement('test-element');

      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  describe('scrollElementIntoView', () => {
    it('should scroll element into view with default options', async () => {
      const element = {
        scrollIntoView: jasmine.createSpy('scrollIntoView'),
      } as jasmine.SpyObj<HTMLElement>;

      await service.scrollElementIntoView(element);

      expect(element.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });

    it('should accept custom scroll into view options', async () => {
      const element = {
        scrollIntoView: jasmine.createSpy('scrollIntoView'),
      } as jasmine.SpyObj<HTMLElement>;
      const options = {
        behavior: 'auto' as ScrollBehavior,
        block: 'start' as ScrollLogicalPosition,
        inline: 'nearest' as ScrollLogicalPosition,
      };

      await service.scrollElementIntoView(element, options);

      expect(element.scrollIntoView).toHaveBeenCalledWith(options);
    });
  });

  describe('getHeaderHeight', () => {
    it('should return header height when header exists', () => {
      const mockHeader = {
        getBoundingClientRect: () => ({ height: 100 }),
      } as jasmine.SpyObj<HTMLElement>;
      spyOn(document, 'querySelector').and.returnValue(mockHeader);

      const height = service.getHeaderHeight();

      expect(height).toBe(100);
      expect(document.querySelector).toHaveBeenCalledWith('.app-header');
    });

    it('should return fallback height when header does not exist', () => {
      spyOn(document, 'querySelector').and.returnValue(null);

      const height = service.getHeaderHeight();

      expect(height).toBe(80);
    });
  });
});
